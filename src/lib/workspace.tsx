import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { FALLBACK_RATES, type Rates } from "./services";
import { getRates } from "./fx.functions";
import { TEMPLATES, type Trip, type TripTemplate, type WorkspaceState } from "./types";

const STORAGE_KEY = "atlasledger.workspace.v1";

export const uid = () => Math.random().toString(36).slice(2, 10);

function seed(): WorkspaceState {
  return {
    plan: "pro",
    role: "owner",
    baseCurrency: "EUR",
    branding: {
      brandName: "AtlasLedger",
      domain: "atlasledger.app",
      accent: 172,
      tagline: "Plan elke reis. Verantwoord elke euro.",
    },
    members: [
      { id: uid(), name: "Domenic Rokers", email: "domenic@atlasledger.app", role: "owner" },
      { id: uid(), name: "Lena Vos", email: "lena@atlasledger.app", role: "editor" },
      { id: uid(), name: "Sam de Boer", email: "sam@boekhouding.nl", role: "accountant" },
    ],
    trips: [
      {
        id: "demo-sweden",
        name: "Zweden — Lapland winterexpeditie",
        template: "winter",
        start: "2027-01-12",
        end: "2027-01-21",
        budget: 4200,
        stops: [
          { id: uid(), name: "Stockholm", country: "Zweden", lat: 59.3293, lon: 18.0686, nights: 2 },
          { id: uid(), name: "Kiruna", country: "Zweden", lat: 67.8558, lon: 20.2253, nights: 4 },
          { id: uid(), name: "Abisko", country: "Zweden", lat: 68.3494, lon: 18.8305, nights: 3 },
        ],
        itinerary: [
          { id: uid(), day: "2027-01-12", title: "Vlucht Amsterdam → Stockholm", notes: "Bagage: -30°C uitrusting" },
          { id: uid(), day: "2027-01-14", title: "Nachttrein naar Kiruna" },
          { id: uid(), day: "2027-01-17", title: "Noorderlicht safari Abisko" },
        ],
        expenses: [
          { id: uid(), date: "2027-01-12", title: "Vluchten", category: "transport", amount: 640, currency: "EUR", paidBy: "Domenic", billable: false },
          { id: uid(), date: "2027-01-14", title: "Icehotel 2 nachten", category: "lodging", amount: 5400, currency: "SEK", paidBy: "Lena", billable: false },
          { id: uid(), date: "2027-01-17", title: "Husky tour", category: "activities", amount: 2300, currency: "SEK", paidBy: "Domenic", billable: false },
        ],
      },
      {
        id: "demo-tokyo",
        name: "Tokyo — client onboarding",
        template: "business",
        start: "2027-03-03",
        end: "2027-03-09",
        budget: 3500,
        stops: [
          { id: uid(), name: "Tokyo", country: "Japan", lat: 35.6762, lon: 139.6503, nights: 4 },
          { id: uid(), name: "Kyoto", country: "Japan", lat: 35.0116, lon: 135.7681, nights: 2 },
        ],
        itinerary: [
          { id: uid(), day: "2027-03-03", title: "Vlucht + hotel Shinjuku" },
          { id: uid(), day: "2027-03-04", title: "Client workshop" },
        ],
        expenses: [
          { id: uid(), date: "2027-03-03", title: "Business class vlucht", category: "transport", amount: 1850, currency: "EUR", paidBy: "Domenic", billable: true },
          { id: uid(), date: "2027-03-05", title: "Hotel Shinjuku", category: "lodging", amount: 96000, currency: "JPY", paidBy: "Domenic", billable: true },
        ],
      },
    ],
  };
}

type Ctx = {
  state: WorkspaceState;
  update: (fn: (s: WorkspaceState) => WorkspaceState) => void;
  updateTrip: (id: string, fn: (t: Trip) => Trip) => void;
  addTrip: (name: string, template: TripTemplate) => string;
  removeTrip: (id: string) => void;
  rates: Rates;
  ratesLive: boolean;
  reset: () => void;
};

const WorkspaceContext = createContext<Ctx | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WorkspaceState>(() => seed());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw) as WorkspaceState);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

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
    setState((s) => ({ ...s, trips: s.trips.map((t) => (t.id === id ? fn(t) : t)) }));
  }, []);

  const addTrip = useCallback((name: string, template: TripTemplate) => {
    const id = uid();
    const tpl = TEMPLATES.find((t) => t.id === template)!;
    const today = new Date().toISOString().slice(0, 10);
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
  }, []);

  const removeTrip = useCallback((id: string) => {
    setState((s) => ({ ...s, trips: s.trips.filter((t) => t.id !== id) }));
  }, []);

  const reset = useCallback(() => setState(seed()), []);

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
    }),
    [state, update, updateTrip, addTrip, removeTrip, ratesQuery.data, reset],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return ctx;
}
