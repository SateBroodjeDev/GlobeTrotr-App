import type { PlanId, RoleId } from "./types";

export type Feature =
  | "unlimited_trips"
  | "pdf_export"
  | "csv_export"
  | "white_label"
  | "analytics"
  | "roles"
  | "weather"
  | "billable_expenses"
  | "receipts";

export const PLANS: {
  id: PlanId;
  name: string;
  price: number;
  seats: string;
  tripLimit: number;
  features: Feature[];
  highlights: string[];
}[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    seats: "Voor jou",
    tripLimit: 2,
    features: ["csv_export"],
    highlights: ["2 actieve reizen", "Routekaart & uitgaven", "CSV-export"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 9,
    seats: "Voor jou en je reisgroep",
    tripLimit: Infinity,
    features: ["unlimited_trips", "pdf_export", "csv_export", "weather"],
    highlights: [
      "Onbeperkt reizen",
      "Live weer & valutakoersen",
      "PDF-reisoverzicht",
    ],
  },
  {
    id: "agency",
    name: "Agency",
    price: 29,
    seats: "Onbeperkt",
    tripLimit: Infinity,
    features: [
      "unlimited_trips",
      "pdf_export",
      "csv_export",
      "white_label",
      "analytics",
      "roles",
      "weather",
      "billable_expenses",
      "receipts",
    ],
    highlights: [
      "Eigen merk en domein",
      "Rollen en rechten",
      "Declarabele klantuitgaven",
      "Bonnetjes bij uitgaven",
    ],
  },
];

export function planOf(id: PlanId) {
  return PLANS.find((p) => p.id === id) ?? PLANS[0]!;
}

export function hasFeature(plan: PlanId, feature: Feature) {
  return planOf(plan).features.includes(feature);
}

export const ROLES: { id: RoleId; label: string; description: string; can: string[] }[] = [
  {
    id: "owner",
    label: "Eigenaar",
    description: "Volledige controle over workspace, facturatie en branding.",
    can: ["Reizen beheren", "Uitgaven boeken", "Leden uitnodigen", "Abonnement wijzigen", "Exporteren"],
  },
  {
    id: "editor",
    label: "Medereiziger (Editor)",
    description: "Plant mee en boekt uitgaven, geen toegang tot facturatie.",
    can: ["Reizen beheren", "Uitgaven boeken", "Exporteren"],
  },
  {
    id: "accountant",
    label: "Boekhouder",
    description: "Leest en exporteert financiële data, wijzigt geen planning.",
    can: ["Uitgaven bekijken", "Exporteren"],
  },
  {
    id: "viewer",
    label: "Publieke kijker",
    description: "Alleen-lezen toegang tot reisschema en kaart.",
    can: ["Reizen bekijken"],
  },
];

export function canEdit(role: RoleId) {
  return role === "owner" || role === "editor";
}
export function canExport(role: RoleId) {
  return role !== "viewer";
}
export function canBill(role: RoleId) {
  return role === "owner";
}

export function canPlanTrip(role: import("./types").TripMemberRole | undefined) {
  return !role || role === "owner" || role === "traveler" || role === "advisor";
}

export function canManageTripMoney(role: import("./types").TripMemberRole | undefined) {
  return !role || role === "owner" || role === "traveler" || role === "advisor" || role === "finance";
}

export function ownsTrip(role: import("./types").TripMemberRole | undefined) {
  return !role || role === "owner";
}
