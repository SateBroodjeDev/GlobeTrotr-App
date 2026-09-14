import type { ExpenseCategory, Trip } from "@/lib/types";

export type TripCategoryTotal = { category: ExpenseCategory; amount: number; percentage: number };

export type TripStatistics = {
  countries: number;
  destinations: number;
  nights: number;
  tripDays: number;
  elapsedDays: number;
  spent: number;
  remaining: number;
  dailyAverage: number;
  projectedTotal: number;
  projectedDifference: number;
  categoryTotals: TripCategoryTotal[];
};

const dayNumber = (value: string) => {
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(timestamp) ? Math.floor(timestamp / 86_400_000) : undefined;
};

export function calculateTripStatistics(
  trip: Trip,
  convertExpense: (amount: number, currency: string) => number,
  today = new Date(),
): TripStatistics {
  const start = dayNumber(trip.start);
  const end = dayNumber(trip.end);
  const current = dayNumber(today.toISOString().slice(0, 10));
  const tripDays = start !== undefined && end !== undefined && end >= start ? end - start + 1 : 0;
  const elapsedDays = start === undefined || current === undefined || tripDays === 0
    ? 0
    : Math.max(0, Math.min(tripDays, current - start + 1));
  const totals = new Map<ExpenseCategory, number>();
  let spent = 0;
  for (const expense of trip.expenses) {
    const converted = convertExpense(expense.amount, expense.currency);
    if (!Number.isFinite(converted)) continue;
    spent += converted;
    totals.set(expense.category, (totals.get(expense.category) ?? 0) + converted);
  }
  const dailyAverage = elapsedDays > 0 ? spent / elapsedDays : 0;
  const projectedTotal = elapsedDays > 0 && elapsedDays < tripDays ? dailyAverage * tripDays : spent;
  return {
    countries: new Set(trip.stops.map((stop) => stop.country.trim().toLocaleLowerCase()).filter(Boolean)).size,
    destinations: trip.stops.length,
    nights: trip.stops.reduce((sum, stop) => sum + Math.max(0, stop.nights ?? 0), 0),
    tripDays,
    elapsedDays,
    spent,
    remaining: trip.budget - spent,
    dailyAverage,
    projectedTotal,
    projectedDifference: trip.budget - projectedTotal,
    categoryTotals: [...totals.entries()]
      .map(([category, amount]) => ({ category, amount, percentage: spent > 0 ? (amount / spent) * 100 : 0 }))
      .sort((left, right) => right.amount - left.amount),
  };
}
