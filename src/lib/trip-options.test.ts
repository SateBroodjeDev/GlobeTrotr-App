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
  assert.equal(normalizeTravelOption({ ...option, amount: undefined }).amount, undefined);
  assert.equal(safeOptionUrl("https://example.com/hotel"), "https://example.com/hotel");
});

test("accommodation briefs retain bounded rooms, guests and taxes", () => {
  const normalized = normalizeTravelOption({
    ...option,
    details: { locationName: " Utrecht ", guests: 2, rooms: 1, taxesAndFees: 18.5 },
  });
  assert.equal(normalized.details?.locationName, "Utrecht");
  assert.equal(normalized.details?.guests, 2);
  assert.equal(normalized.details?.rooms, 1);
  assert.equal(normalized.details?.taxesAndFees, 18.5);
  assert.equal(normalizeTravelOption({ ...option, details: { rooms: -1, taxesAndFees: -4 } }).details, undefined);
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

test("category details survive normalisation and reach the booking", () => {
  const flight = normalizeTravelOption({
    ...option,
    type: "flight",
    details: {
      flightNumber: " KL123 ",
      departureName: "Amsterdam",
      arrivalName: "Rome",
      startTime: "09:30",
      endTime: "11:30",
    },
  });
  assert.equal(flight.details?.flightNumber, "KL123");
  const result = convertOptionToBooking([flight], [], flight.id, () => "flight-booking");
  assert.equal(result.travelItems[0].flightNumber, "KL123");
  assert.equal(result.travelItems[0].details?.startTime, "09:30");
  assert.match(result.travelItems[0].notes ?? "", /Amsterdam.*Rome/);
});
