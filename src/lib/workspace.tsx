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
  loadWorkspace,
  saveWorkspace,
  syncTripPublication,
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
  const pendingPublicationSync = useRef(new Map<string, Trip>());
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
          // Herstel ook bestaande reizen die vóór de relationele migratie zijn
          // opgeslagen. De publieke homepage leest de trips-tabel, niet JSON.
          remote.trips.forEach((trip) => pendingPublicationSync.current.set(trip.id, trip));
          setState(remote);
        } else {
          await saveWorkspace({ data: { data: stateRef.current } });
        }
        if (!cancelled) setCloud("synced");
      })
      .catch(() => !cancelled && setCloud("local"));
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  // Debounced cloud save
  useEffect(() => {
    if (cloud !== "synced" || !user || !hydrated.current) return;
    setCloud("saving");
    const t = setTimeout(() => {
      saveWorkspace({ data: { data: stateRef.current } })
        .then(() => setCloud("synced"))
        .catch(() => setCloud("synced"));
    }, 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, user]);

  const ratesQuery = useQuery({
    queryKey: ["fx-rates"],
    queryFn: () => getRates(),
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });

  const update = useCallback((fn: (s: WorkspaceState) => WorkspaceState) => {
    setState((s) => fn(s));
  }, []);

  const updateTrip = useCallback((id: string, fn: (t: Trip) => Trip) => {
    setState((s) => ({
      ...s,
      trips: s.trips.map((trip) => {
        if (trip.id !== id) return trip;
        const next = fn(trip);
        if (
          trip.public !== next.public ||
          trip.shareFinancials !== next.shareFinancials ||
          trip.sharePinHash !== next.sharePinHash
        ) {
          pendingPublicationSync.current.set(next.id, next);
        }
        return next;
      }),
    }));
  }, []);

  // Publicatie heeft een eigen, kleine synchronisatie. Zo blijft de publieke
  // homepage correct wanneer het opslaan van een niet-gerelateerd reisonderdeel
  // (zoals een planning of uitgave) tijdelijk faalt.
  useEffect(() => {
    if (!user || !pendingPublicationSync.current.size) return;
    const pending = [...pendingPublicationSync.current.values()];
    pendingPublicationSync.current.clear();
    void Promise.all(
      pending.map((trip) =>
        syncTripPublication({
          data: {
            tripId: trip.id,
            isPublic: trip.public ?? false,
            shareFinancials: trip.shareFinancials ?? false,
            sharePinHash: trip.sharePinHash,
          },
        }).catch((error: unknown) => {
          // De JSON-save blijft bestaan als terugval; opnieuw laden probeert
          // deze gerichte synchronisatie nogmaals.
          console.warn("Publicatiestatus kon niet direct worden gesynchroniseerd", error);
        }),
      ),
    );
  }, [state, user]);

  const addTrip = useCallback(
    async (name: string, template: TripTemplate) => {
      const tpl = TEMPLATES.find((t) => t.id === template)!;
      const today = new Date().toISOString().slice(0, 10);
      let id = uid();
      if (user) {
        try {
          const created = await createTripInDatabase({
            data: { name, template, start: today, budget: 1500 },
          });
          id = created.tripId;
        } catch {
          // Vóór de UUID-migratie kan de database deze reis nog niet maken.
          // De bestaande JSON-opslag blijft dan compatibel werken.
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
      return id;
    },
    [user],
  );

  const removeTrip = useCallback((id: string) => {
    setState((s) => ({ ...s, trips: s.trips.filter((t) => t.id !== id) }));
  }, []);

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
      addTrip,
      removeTrip,
      rates: ratesQuery.data ?? FALLBACK_RATES,
      ratesLive: !!ratesQuery.data,
      reset,
      changePlan,
      cloud,
    }),
    [state, update, updateTrip, addTrip, removeTrip, ratesQuery.data, reset, changePlan, cloud],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return ctx;
}
