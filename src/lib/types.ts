export type PlanId = "free" | "pro" | "agency";
export type RoleId = "owner" | "editor" | "accountant" | "viewer";

export type Stop = {
  id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  arrive?: string;
  nights?: number;
};

export type ItineraryItem = {
  id: string;
  day: string;
  title: string;
  notes?: string;
};

export type Expense = {
  id: string;
  date: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  paidBy: string;
  billable: boolean;
};

export type ExpenseCategory =
  | "transport"
  | "lodging"
  | "food"
  | "activities"
  | "shopping"
  | "other";

export const CATEGORIES: { id: ExpenseCategory; label: string }[] = [
  { id: "transport", label: "Vervoer" },
  { id: "lodging", label: "Verblijf" },
  { id: "food", label: "Eten & drinken" },
  { id: "activities", label: "Activiteiten" },
  { id: "shopping", label: "Shopping" },
  { id: "other", label: "Overig" },
];

export type TripTemplate =
  | "safari"
  | "cruise"
  | "roadtrip"
  | "backpacking"
  | "citytrip"
  | "beach"
  | "business"
  | "winter";

export const TEMPLATES: {
  id: TripTemplate;
  label: string;
  emoji: string;
  itinerary: string[];
}[] = [
  { id: "safari", label: "Safari", emoji: "🦁", itinerary: ["Aankomst & lodge check-in", "Game drive bij zonsopgang", "Bushwalk met ranger"] },
  { id: "cruise", label: "Cruise", emoji: "🛳️", itinerary: ["Inschepen & muster drill", "Zeedag aan boord", "Excursie in havenstad"] },
  { id: "roadtrip", label: "Roadtrip", emoji: "🚐", itinerary: ["Huurauto ophalen", "Scenic route etappe 1", "Overnachting onderweg"] },
  { id: "backpacking", label: "Backpacken", emoji: "🎒", itinerary: ["Hostel check-in", "Free walking tour", "Nachtbus naar volgende stop"] },
  { id: "citytrip", label: "Stedentrip", emoji: "🏙️", itinerary: ["Aankomst & hotel", "Museum & oude stad", "Rooftop diner"] },
  { id: "beach", label: "Beach / Resort", emoji: "🏝️", itinerary: ["Transfer naar resort", "Strand & snorkelen", "Spa & sunset cocktails"] },
  { id: "business", label: "Zakenreis", emoji: "💼", itinerary: ["Vlucht & inchecken", "Client meeting", "Conferentiedag"] },
  { id: "winter", label: "Winterexpeditie", emoji: "🏔️", itinerary: ["Aankomst & materiaalcheck", "Husky- of sneeuwscootertocht", "Noorderlicht safari"] },
];

export type Member = {
  id: string;
  name: string;
  email: string;
  role: RoleId;
};

export type Trip = {
  id: string;
  name: string;
  template: TripTemplate;
  start: string;
  end: string;
  budget: number;
  stops: Stop[];
  itinerary: ItineraryItem[];
  expenses: Expense[];
};

export type Branding = {
  brandName: string;
  domain: string;
  accent: number; // hue
  tagline: string;
};

export type WorkspaceState = {
  plan: PlanId;
  role: RoleId;
  baseCurrency: string;
  branding: Branding;
  members: Member[];
  trips: Trip[];
};
