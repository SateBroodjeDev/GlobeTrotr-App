import type { Trip } from "@/lib/types";

export function duplicateTripName(name: string, copyLabel: string, maxLength = 30) {
  const suffix = ` (${copyLabel})`;
  return `${name.slice(0, Math.max(1, maxLength - suffix.length)).trimEnd()}${suffix}`;
}

export function buildTripDuplicate(source: Trip, target: Trip, makeId: () => string): Trip {
  const travelIds = new Map<string, string>();
  const travelItems = (source.travelItems ?? []).map((item) => {
    const id = makeId();
    travelIds.set(item.id, id);
    return {
      ...item,
      id,
      bookingReference: undefined,
      expenseId: undefined,
      details: item.details ? { ...item.details, fuelActualExpenseIds: undefined } : undefined,
    };
  });
  return {
    ...source,
    id: target.id,
    ownerId: target.ownerId,
    revision: target.revision,
    accessRole: target.accessRole,
    stops: source.stops.map((stop) => ({ ...stop, id: makeId() })),
    itinerary: source.itinerary.map((item) => ({
      ...item,
      id: makeId(),
      sourceTravelItemId: item.sourceTravelItemId
        ? travelIds.get(item.sourceTravelItemId)
        : undefined,
    })),
    travelItems,
    // Kandidaten en bronprijzen kunnen verouderd zijn en horen niet automatisch
    // bij een nieuwe reisversie. Gekozen onderdelen staan al in travelItems.
    travelOptions: [],
    expenses: [],
    members: [],
    travelers: [],
    packing: (source.packing ?? []).map((item) => ({ ...item, id: makeId(), done: false })),
    archived: false,
    public: false,
    shareFinancials: false,
    sharePinHash: undefined,
  };
}
