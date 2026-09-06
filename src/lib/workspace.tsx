import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { FALLBACK_RATES, type Rates } from "./services";
import { getRates } from "./fx.functions";
import {
  createTrip as createTripInDatabase,
  deleteTrip as deleteTripInDatabase,
  loadWorkspace,
  saveTrip as saveTripInDatabase,
  saveWorkspace,
} from "./cloud.functions";
import { useAuth } from "./auth";
import { TEMPLATES, type PlanId, type Trip, type TripTemplate, type WorkspaceState } from "./types";

const STORAGE_KEY = "atlasledger.workspace.v1";

export const uid = () => Math.random().toString(36).slice(2, 10);

function seed(): WorkspaceState {
  return {
    plan: "free",
    role: "owner",
    baseCurrency: "EUR",
    branding: {
      brandName: "GlobeTrotr",
      domain: "globetrotr.nl",
      accent: 172,
      tagline: "Plan elke reis. Verantwoord elke euro.",
    },
    members: [],
    trips: [],
  };
}

type Ctx = {
  state: WorkspaceState;
  update: (fn: (s: WorkspaceState) => WorkspaceState) => void;
  updateTrip: (id: string, fn: (t: Trip) => Trip) => void;
  /** Optimistic trip mutation that resolves only after the server confirms it. */
  saveTripNow: (id: string, fn: (t: Trip) => Trip) => Promise<void>;
  addTrip: (name: string, template: TripTemplate) => Promise<string>;
  removeTrip: (id: string) => void;
  rates: Rates;
  ratesLive: boolean;
  reset: () => void;
  changePlan: (plan: PlanId) => Promise<boolean>;
  cloud: "local" | "loading" | "synced" | "saving";
};

const WorkspaceContext = createContext<Ctx | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WorkspaceState>(() => seed());
  const { user, loading: authLoading } = useAuth();
  const [cloud, setCloud] = useState<Ctx["cloud"]>("local");
  const hydrated = useRef(false);
  const stateRef = useRef(state);
  const cloudPersistenceReady = useRef(false);
  const saveSequence = useRef(0);
  const pendingTripIds = useRef(new Set<string>());
  const workspaceDirty = useRef(false);
  const [saveRevision, setSaveRevision] = useState(0);
  stateRef.current = state;

  const cacheKey = user ? `${STORAGE_KEY}.${user.id}` : null;

  // Per-account cache for instant paint; guests never see another account's data
  useEffect(() => {
    if (!cacheKey) {
      hydrated.current = true;
      return;
    }
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) setState(JSON.parse(raw) as WorkspaceState);
    } catch {
      /* ignore */
    }
    hydrated.current = true;
  }, [cacheKey]);

  useEffect(() => {
    if (!cacheKey) return;
    try {
      localStorage.setItem(cacheKey, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, cacheKey]);

  // Cloud hydration when signed in
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      cloudPersistenceReady.current = false;
      setCloud("local");
      setState(seed());
      hydrated.current = false;
      return;
    }
    let cancelled = false;
    setCloud("loading");
    loadWorkspace()
      .then(async (row) => {
        if (cancelled) return;
        const remote = row?.data as WorkspaceState | undefined;
        if (remote && Array.isArray(remote.trips)) {
          setState(remote);
        } else {
          await saveWorkspace({ data: { data: stateRef.current } });
        }
        cloudPersistenceReady.current = true;
        if (!cancelled) setCloud("synced");
      })
      .catch(() => !cancelled && setCloud("local"));
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  // Workspace-instellingen en reizen gebruiken verschillende schrijfpunten:
  // reisdata gaat direct naar de relationele tabellen, overige instellingen
  // blijven tijdelijk in het workspace-document.
  useEffect(() => {
    if (!user || !hydrated.current || !cloudPersistenceReady.current) return;
    if (!workspaceDirty.current && !pendingTripIds.current.size) return;
    const t = setTimeout(() => {
      const sequence = ++saveSequence.current;
      const tripIds = [...pendingTripIds.current];
      const shouldSaveWorkspace = workspaceDirty.current;
      pendingTripIds.current.clear();
      workspaceDirty.current = false;
      const trips = tripIds
        .map((id) => stateRef.current.trips.find((trip) => trip.id === id))
        .filter((trip): trip is Trip => Boolean(trip));
      setCloud("saving");
      (async () => {
        if (shouldSaveWorkspace) await saveWorkspace({ data: { data: stateRef.current } });
        // Achter elkaar opslaan houdt de JSON-compatibiliteitskopie consistent
        // wanneer twee verschillende reizen vlak na elkaar wijzigen.
        for (const trip of trips) await saveTripInDatabase({ data: { trip } });
      })()
        .then(() => {
          if (sequence === saveSequence.current) setCloud("synced");
        })
        .catch(() => {
          if (shouldSaveWorkspace) workspaceDirty.current = true;
          tripIds.forEach((id) => pendingTripIds.current.add(id));
          if (sequence === saveSequence.current) setCloud("synced");
        });
    }, 900);
    return () => clearTimeout(t);
  }, [saveRevision, user]);

  const ratesQuery = useQuery({
    queryKey: ["fx-rates"],
    queryFn: () => getRates(),
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });

  const update = useCallback((fn: (s: WorkspaceState) => WorkspaceState) => {
    workspaceDirty.current = true;
    setState((s) => fn(s));
    setSaveRevision((revision) => revision + 1);
  }, []);

  const updateTrip = useCallback((id: string, fn: (t: Trip) => Trip) => {
    pendingTripIds.current.add(id);
    setState((s) => ({ ...s, trips: s.trips.map((trip) => (trip.id === id ? fn(trip) : trip)) }));
    setSaveRevision((revision) => revision + 1);
  }, []);

  const saveTripNow = useCallback(
    async (id: string, fn: (trip: Trip) => Trip) => {
      const previousState = stateRef.current;
      const previousTrip = previousState.trips.find((trip) => trip.id === id);
      if (!previousTrip) throw new Error("Reis niet gevonden.");

      const nextTrip = fn(previousTrip);
      const nextState = {
        ...previousState,
        trips: previousState.trips.map((trip) => (trip.id === id ? nextTrip : trip)),
      };
      stateRef.current = nextState;
      setState(nextState);
      pendingTripIds.current.delete(id);

      if (!user) return;

      setCloud("saving");
      try {
        await saveTripInDatabase({ data: { trip: nextTrip } });
        setCloud("synced");
      } catch (error) {
        // Revert only when no newer edit has replaced this optimistic trip.
        setState((current) => {
          const stored = current.trips.find((trip) => trip.id === id);
          if (stored !== nextTrip) return current;
          const reverted = {
            ...current,
            trips: current.trips.map((trip) => (trip.id === id ? previousTrip : trip)),
          };
          stateRef.current = reverted;
          return reverted;
        });
        setCloud("synced");
        throw error;
      }
    },
    [user],
  );

  const addTrip = useCallback(
    async (name: string, template: TripTemplate) => {
      const tpl = TEMPLATES.find((t) => t.id === template)!;
      const today = new Date().toISOString().slice(0, 10);
      let id = user ? crypto.randomUUID() : uid();
      if (user) {
        try {
          const created = await createTripInDatabase({
            data: { tripId: id, name, template, start: today, budget: 1500 },
          });
          id = created.tripId;
        } catch (error) {
          // Vóór de UUID-migratie kan de database deze reis nog niet maken.
          // De bestaande JSON-opslag blijft dan compatibel werken.
          throw error;
        }
      }
      setState((s) => ({
        ...s,
        trips: [
          ...s.trips,
          {
            id,
            name,
            template,
            start: today,
            end: today,
            budget: 1500,
            stops: [],
            itinerary: tpl.itinerary.map((title) => ({ id: uid(), day: today, title })),
            expenses: [],
          },
        ],
      }));
      pendingTripIds.current.add(id);
      setSaveRevision((revision) => revision + 1);
      return id;
    },
    [user],
  );

  const removeTrip = useCallback(
    (id: string) => {
      setState((s) => ({ ...s, trips: s.trips.filter((t) => t.id !== id) }));
      if (user) {
        void deleteTripInDatabase({ data: { tripId: id } }).catch(() => {
          // Een volgende herlaadactie gebruikt de relationele bron en herstelt
          // de reis wanneer verwijderen op de server werkelijk mislukt.
        });
      }
    },
    [user],
  );

  const reset = useCallback(() => setState(seed()), []);

  const changePlan = useCallback(
    async (plan: PlanId) => {
      if (!user) return false;

      const previous = stateRef.current;
      const next = { ...previous, plan };
      stateRef.current = next;
      setState(next);
      setCloud("saving");

      try {
        await saveWorkspace({ data: { data: next } });
        setCloud("synced");
        return true;
      } catch {
        stateRef.current = previous;
        setState(previous);
        setCloud("synced");
        return false;
      }
    },
    [user],
  );

  const value = useMemo<Ctx>(
    () => ({
      state,
      update,
      updateTrip,
      saveTripNow,
      addTrip,
      removeTrip,
      rates: ratesQuery.data ?? FALLBACK_RATES,
      ratesLive: !!ratesQuery.data,
      reset,
      changePlan,
      cloud,
    }),
    [
      state,
      update,
      updateTrip,
      saveTripNow,
      addTrip,
      removeTrip,
      ratesQuery.data,
      reset,
      changePlan,
      cloud,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return ctx;
}
