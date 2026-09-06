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

export type TravelItemType = "flight" | "lodging" | "transport" | "activity";

export type TravelLocation = {
  name: string;
  country: string;
  lat: number;
  lon: number;
};

/** Een geboekt onderdeel van een reis, zoals vlucht, hotel of treinrit. */
export type TravelItem = {
  id: string;
  type: TravelItemType;
  title: string;
  date: string;
  endDate?: string;
  provider?: string;
  bookingReference?: string;
  flightNumber?: string;
  flightStatus?: string;
  departure?: TravelLocation;
  arrival?: TravelLocation;
  location?: TravelLocation;
  amount?: number;
  currency?: string;
  /** Gekoppelde uitgave die automatisch bij dit onderdeel is aangemaakt. */
  expenseId?: string;
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
  /** Namen die meebetalen; leeg = alle reizigers */
  splitWith?: string[];
  /** Pad in de receipts-opslag */
  receiptPath?: string;
  receiptName?: string;
};

export type ExpenseCategory =
  "transport" | "lodging" | "food" | "activities" | "shopping" | "other";

export const CATEGORIES: { id: ExpenseCategory; label: string }[] = [
  { id: "transport", label: "Vervoer" },
  { id: "lodging", label: "Verblijf" },
  { id: "food", label: "Eten & drinken" },
  { id: "activities", label: "Activiteiten" },
  { id: "shopping", label: "Shopping" },
  { id: "other", label: "Overig" },
];

export type TripTemplate =
  "safari" | "cruise" | "roadtrip" | "backpacking" | "citytrip" | "beach" | "business" | "winter";

export const TEMPLATES: {
  id: TripTemplate;
  label: string;
  emoji: string;
  itinerary: string[];
}[] = [
  {
    id: "safari",
    label: "Safari",
    emoji: "🦁",
    itinerary: ["Aankomst & lodge check-in", "Game drive bij zonsopgang", "Bushwalk met ranger"],
  },
  {
    id: "cruise",
    label: "Cruise",
    emoji: "🛳️",
    itinerary: ["Inschepen & muster drill", "Zeedag aan boord", "Excursie in havenstad"],
  },
  {
    id: "roadtrip",
    label: "Roadtrip",
    emoji: "🚐",
    itinerary: ["Huurauto ophalen", "Scenic route etappe 1", "Overnachting onderweg"],
  },
  {
    id: "backpacking",
    label: "Backpacken",
    emoji: "🎒",
    itinerary: ["Hostel check-in", "Free walking tour", "Nachtbus naar volgende stop"],
  },
  {
    id: "citytrip",
    label: "Stedentrip",
    emoji: "🏙️",
    itinerary: ["Aankomst & hotel", "Museum & oude stad", "Rooftop diner"],
  },
  {
    id: "beach",
    label: "Beach / Resort",
    emoji: "🏝️",
    itinerary: ["Transfer naar resort", "Strand & snorkelen", "Spa & sunset cocktails"],
  },
  {
    id: "business",
    label: "Zakenreis",
    emoji: "💼",
    itinerary: ["Vlucht & inchecken", "Client meeting", "Conferentiedag"],
  },
  {
    id: "winter",
    label: "Winterexpeditie",
    emoji: "🏔️",
    itinerary: ["Aankomst & materiaalcheck", "Husky- of sneeuwscootertocht", "Noorderlicht safari"],
  },
];

export type Member = {
  id: string;
  name: string;
  email: string;
  role: RoleId;
};

export type TripStatus = "upcoming" | "current" | "archived";

export type PackingItem = {
  id: string;
  label: string;
  done: boolean;
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
  travelItems?: TravelItem[];
  expenses: Expense[];
  travelers?: string[];
  packing?: PackingItem[];
  archived?: boolean;
  /** Openbaar zichtbaar op de homepage */
  public?: boolean;
  /** Toon het budget op de openbare reispagina */
  shareFinancials?: boolean;
  /** SHA-256-hash van de optionele PIN voor deze openbare reis */
  sharePinHash?: string;
};

export function tripStatus(trip: Trip, today = new Date()): TripStatus {
  if (trip.archived) return "archived";
  const d = today.toISOString().slice(0, 10);
  if (trip.end && trip.end < d) return "archived";
  if (trip.start && trip.start <= d) return "current";
  return "upcoming";
}

export const STATUS_LABEL: Record<TripStatus, string> = {
  current: "Huidig",
  upcoming: "Aankomend",
  archived: "Gearchiveerd",
};

export const PACKING_TEMPLATES: { id: string; label: string; emoji: string; items: string[] }[] = [
  {
    id: "winter",
    label: "Winterexpeditie",
    emoji: "🥶",
    items: [
      "Thermo-ondergoed (3x)",
      "Donsjas -30°C",
      "Winterschoenen met grip",
      "Wollen sokken (5 paar)",
      "Muts, sjaal & wanten",
      "Skibril / zonnebril",
      "Handwarmers",
      "Powerbank (kou = leeg)",
      "Statief voor noorderlicht",
      "Hoofdlamp + reservebatterijen",
      "Zonnebrand & lippenbalsem",
      "Reisverzekering & winterdekking",
      "Sneeuwkettingen / winterbanden",
      "IJskrabber & sleepkabel",
      "Thermoskan",
      "EHBO-set",
      "Paspoort & rijbewijs",
      "Contant geld in lokale valuta",
    ],
  },
  {
    id: "citytrip",
    label: "Stedentrip",
    emoji: "🏙️",
    items: [
      "Comfortabele schoenen",
      "Regenjas of paraplu",
      "Powerbank",
      "Stadsplattegrond / offline kaart",
      "Museumkaarten & tickets",
      "Dagrugzak",
      "Adapter",
      "Kleine EHBO-set",
    ],
  },
  {
    id: "beach",
    label: "Strand & resort",
    emoji: "🏝️",
    items: [
      "Zwemkleding (2x)",
      "Zonnebrand SPF50",
      "Strandhanddoek",
      "Slippers",
      "Snorkelset",
      "Aftersun",
      "Waterdichte telefoonhoes",
      "Zonnehoed",
    ],
  },
  {
    id: "roadtrip",
    label: "Roadtrip",
    emoji: "🚐",
    items: [
      "Rijbewijs & groene kaart",
      "Telefoonhouder & autolader",
      "Koelbox",
      "Gevarendriehoek & veiligheidshesjes",
      "Bandenspanningsmeter",
      "Snacks & water",
      "Offline navigatie",
      "Parkeerschijf & tolvignetten",
    ],
  },
  {
    id: "business",
    label: "Zakenreis",
    emoji: "💼",
    items: [
      "Laptop + lader",
      "Presentatie op USB/cloud",
      "Visitekaartjes",
      "Nette outfit",
      "Noise-cancelling koptelefoon",
      "Bonnetjesmapje",
      "Reisverzekering zakelijk",
    ],
  },
];

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
