import assert from "node:assert/strict";
import test from "node:test";
import {
  fuelTravelItemIdForExpense,
  linkFuelExpense,
  remainingFuelEstimate,
} from "./fuel-costs.ts";
import type { Expense, TravelItem } from "./types.ts";

const tripItem: TravelItem = {
  id: "drive-1",
  type: "transport",
  title: "Rit naar Oslo",
  date: "2026-09-08",
  details: {
    distanceKm: 500,
    consumptionPer100Km: 6,
    fuelPricePerLiter: 2,
    fuelCurrency: "EUR",
  },
};

const expense: Expense = {
  id: "fuel-1",
  date: "2026-09-08",
  title: "Tanken",
  category: "transport",
  amount: 55,
  currency: "EUR",
  paidBy: "owner:test",
  billable: false,
};

test("een prognose blijft staan zolang er geen werkelijke brandstofuitgave bestaat", () => {
  assert.equal(remainingFuelEstimate([tripItem], [], "EUR", { EUR: 1 }), 60);
});

test("lopen, fietsen en openbaar vervoer leveren geen eigen brandstofprognose op", () => {
  for (const transportMode of ["walking", "bicycle", "public_transport"] as const) {
    assert.equal(
      remainingFuelEstimate(
        [{ ...tripItem, details: { ...tripItem.details, transportMode } }],
        [],
        "EUR",
        { EUR: 1 },
      ),
      0,
    );
  }
});

test("een gekoppelde werkelijke uitgave vervangt de prognose", () => {
  const linked = linkFuelExpense([tripItem], expense.id, tripItem.id);
  assert.equal(fuelTravelItemIdForExpense(linked, expense.id), tripItem.id);
  assert.equal(remainingFuelEstimate(linked, [expense], "EUR", { EUR: 1 }), 0);
});

test("meerdere tankuitgaven kunnen dezelfde rit vervangen en veilig worden losgemaakt", () => {
  const first = linkFuelExpense([tripItem], "fuel-1", tripItem.id);
  const second = linkFuelExpense(first, "fuel-2", tripItem.id);
  const removed = linkFuelExpense(second, "fuel-1");

  assert.deepEqual(second[0]?.details?.fuelActualExpenseIds, ["fuel-1", "fuel-2"]);
  assert.deepEqual(removed[0]?.details?.fuelActualExpenseIds, ["fuel-2"]);
});
