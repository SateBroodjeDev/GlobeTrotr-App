import { convert, type Rates } from "./services";
import type { Expense, Trip } from "./types";

export type Balance = { name: string; paid: number; owes: number; net: number };
export type Transfer = { from: string; to: string; amount: number };

export function travelersOf(trip: Trip, fallback: string[]): string[] {
  // Reisgenoten worden per reis beheerd. Zodra deze lijst bestaat, is die
  // leidend voor de verrekening; de fallback bevat onder meer de eigenaar.
  const list = trip.members?.length
    ? [...fallback, ...trip.members.map((member) => member.name)]
    : trip.travelers?.length
      ? trip.travelers
      : fallback;
  return Array.from(new Set(list.filter(Boolean)));
}

export function balances(trip: Trip, people: string[], base: string, rates: Rates): Balance[] {
  const paid = new Map<string, number>();
  const owes = new Map<string, number>();
  people.forEach((p) => {
    paid.set(p, 0);
    owes.set(p, 0);
  });

  const shareOf = (e: Expense) => {
    const involved = e.splitWith?.length ? e.splitWith.filter((p) => people.includes(p)) : people;
    return involved.length ? involved : people;
  };

  for (const e of trip.expenses) {
    const amount = convert(e.amount, e.currency, base, rates);
    if (people.includes(e.paidBy)) paid.set(e.paidBy, (paid.get(e.paidBy) ?? 0) + amount);
    const involved = shareOf(e);
    const each = amount / involved.length;
    involved.forEach((p) => owes.set(p, (owes.get(p) ?? 0) + each));
  }

  return people.map((name) => {
    const p = paid.get(name) ?? 0;
    const o = owes.get(name) ?? 0;
    return { name, paid: p, owes: o, net: p - o };
  });
}

/** Minimaal aantal overboekingen om iedereen gelijk te zetten. */
export function settle(list: Balance[]): Transfer[] {
  const debtors = list
    .filter((b) => b.net < -0.01)
    .map((b) => ({ name: b.name, amount: -b.net }))
    .sort((a, b) => b.amount - a.amount);
  const creditors = list
    .filter((b) => b.net > 0.01)
    .map((b) => ({ name: b.name, amount: b.net }))
    .sort((a, b) => b.amount - a.amount);

  const out: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i]!;
    const c = creditors[j]!;
    const amount = Math.min(d.amount, c.amount);
    if (amount > 0.01) out.push({ from: d.name, to: c.name, amount });
    d.amount -= amount;
    c.amount -= amount;
    if (d.amount <= 0.01) i++;
    if (c.amount <= 0.01) j++;
  }
  return out;
}
