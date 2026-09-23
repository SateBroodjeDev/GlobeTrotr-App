import type { Expense, ExpenseCategory, Trip } from "@/lib/types";

const DB_NAME = "globetrotr-offline-v1";
const STORE_NAME = "trip-packs";
const DB_VERSION = 1;

export type OfflineTripPack = {
  version: 1;
  tripId: string;
  name: string;
  start: string;
  end: string;
  locale: "nl" | "en";
  savedAt: string;
  payers: Array<{ id: string; name: string }>;
  queuedExpenses: OfflineExpense[];
  stops: Array<{ id: string; name: string; country: string; arrive?: string; nights?: number }>;
  itinerary: Array<{ id: string; day: string; title: string; notes?: string }>;
  travelItems: Array<{
    id: string;
    type: string;
    title: string;
    date: string;
    endDate?: string;
    provider?: string;
    flightNumber?: string;
    departure?: string;
    arrival?: string;
    location?: string;
    startTime?: string;
    endTime?: string;
  }>;
};

export type OfflineExpense = Pick<Expense, "id" | "date" | "title" | "amount" | "currency" | "paidBy"> & {
  category: ExpenseCategory;
  billable: false;
  queuedAt: string;
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) return reject(new Error("OFFLINE_STORAGE_UNAVAILABLE"));
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: "tripId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("OFFLINE_STORAGE_FAILED"));
  });
}

function transaction<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>) {
  return openDatabase().then((database) => new Promise<T>((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, mode);
    const request = run(tx.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("OFFLINE_STORAGE_FAILED"));
    tx.oncomplete = () => database.close();
    tx.onerror = () => reject(tx.error ?? new Error("OFFLINE_STORAGE_FAILED"));
  }));
}

export function createOfflineTripPack(trip: Trip, locale: string, payers: Array<{ id: string; name: string }> = [], queuedExpenses: OfflineExpense[] = []): OfflineTripPack {
  return {
    version: 1,
    tripId: trip.id,
    name: trip.name,
    start: trip.start,
    end: trip.end,
    locale: locale.toLowerCase().startsWith("nl") ? "nl" : "en",
    savedAt: new Date().toISOString(),
    payers: payers.slice(0, 100).map(({ id, name }) => ({ id, name })),
    queuedExpenses: queuedExpenses.slice(0, 50),
    stops: trip.stops.map(({ id, name, country, arrive, nights }) => ({ id, name, country, arrive, nights })),
    itinerary: trip.itinerary.map(({ id, day, title, notes }) => ({ id, day, title, notes })),
    travelItems: (trip.travelItems ?? []).map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      date: item.date,
      endDate: item.endDate,
      provider: item.provider,
      flightNumber: item.flightNumber,
      departure: item.departure?.name,
      arrival: item.arrival?.name,
      location: item.location?.name,
      startTime: item.details?.startTime,
      endTime: item.details?.endTime,
    })),
  };
}

export async function saveOfflineTrip(pack: OfflineTripPack) {
  await transaction("readwrite", (store) => store.put(pack));
}

export async function getOfflineTrip(tripId: string) {
  return transaction<OfflineTripPack | undefined>("readonly", (store) => store.get(tripId));
}

export async function deleteOfflineTrip(tripId: string) {
  await transaction("readwrite", (store) => store.delete(tripId));
}

export async function clearOfflineTrips() {
  if (typeof window === "undefined" || !("indexedDB" in window)) return;
  await transaction("readwrite", (store) => store.clear());
}

export async function queueOfflineExpense(tripId: string, expense: OfflineExpense) {
  const pack = await getOfflineTrip(tripId);
  if (!pack) throw new Error("OFFLINE_TRIP_NOT_FOUND");
  if ((pack.queuedExpenses ?? []).length >= 50) throw new Error("OFFLINE_EXPENSE_LIMIT");
  pack.queuedExpenses = [...(pack.queuedExpenses ?? []).filter((item) => item.id !== expense.id), expense];
  await saveOfflineTrip(pack);
  return pack;
}

export async function removeQueuedOfflineExpenses(tripId: string, ids: string[]) {
  const pack = await getOfflineTrip(tripId);
  if (!pack) return;
  const completed = new Set(ids);
  pack.queuedExpenses = (pack.queuedExpenses ?? []).filter((item) => !completed.has(item.id));
  await saveOfflineTrip(pack);
}

export function mergeOfflineExpenses(current: Expense[], queued: Expense[]) {
  const ids = new Set(current.map((expense) => expense.id));
  return [...current, ...queued.filter((expense) => !ids.has(expense.id))];
}
