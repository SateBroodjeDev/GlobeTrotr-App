import assert from "node:assert/strict";
import test from "node:test";
import { convertOptionToBooking, normalizeTravelOption, safeOptionUrl } from "./trip-options.ts";
import type { TravelOption } from "./types.ts";

const option: TravelOption = {
  id: "option-1",
  type: "lodging",
  title: " Hotel Centrum ",
  startDate: "2026-10-10",
  endDate: "2026-10-12",
  provider: " Example ",
  amount: 240,
  currency: "EUR",
  status: "candidate",
  createdAt: "2026-09-22T12:00:00.000Z",
};

test("travel options keep valid comparison fields and reject unsafe links", () => {
  const normalized = normalizeTravelOption({
    ...option,
    sourceUrl: "javascript:alert(1)",
    durationMinutes: -4,
  });
  assert.equal(normalized.title, "Hotel Centrum");
  assert.equal(normalized.provider, "Example");
  assert.equal(normalized.sourceUrl, undefined);
  assert.equal(normalized.durationMinutes, undefined);
  assert.equal(safeOptionUrl("https://example.com/hotel"), "https://example.com/hotel");
});

test("converting an option creates exactly one booking", () => {
  const first = convertOptionToBooking([option], [], option.id, () => "booking-1");
  assert.equal(first.changed, true);
  assert.equal(first.travelItems.length, 1);
  assert.equal(first.options[0].convertedTravelItemId, "booking-1");
  const second = convertOptionToBooking(
    first.options,
    first.travelItems,
    option.id,
    () => "booking-2",
  );
  assert.equal(second.changed, false);
  assert.equal(second.travelItems.length, 1);
});
