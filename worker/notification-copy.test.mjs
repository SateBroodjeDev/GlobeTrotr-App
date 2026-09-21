import test from "node:test";
import assert from "node:assert/strict";
import { notificationCopy } from "./notification-copy.mjs";

test("kritieke platformmail gebruikt juiste taal en geen interne scheidingstekens", () => {
  const payload = {
    title: "Storing",
    body: "status|critical|Service incident|Er is een storing.|There is an incident.|123",
  };
  const nl = notificationCopy({ templateKey: "platform", locale: "nl", payload });
  const en = notificationCopy({ templateKey: "platform", locale: "en", payload });
  assert.equal(nl.subject, "Storing");
  assert.equal(nl.body, "Er is een storing.");
  assert.equal(en.subject, "Service incident");
  assert.equal(en.body, "There is an incident.");
  assert.equal(en.severity, "critical");
  assert.equal(en.actionUrl, "https://globetrotr.nl/status");
});

test("plan- en toegangsberichten worden als begrijpelijke zinnen verstuurd", () => {
  const plan = notificationCopy({
    templateKey: "account",
    locale: "en",
    payload: { title: "Plan", body: "plan|pro" },
  });
  const access = notificationCopy({
    templateKey: "trip_access",
    locale: "nl",
    payload: { title: "Toegang", body: "revoked|Noordreis|" },
  });
  assert.equal(plan.body, "Your current plan is pro.");
  assert.equal(plan.actionUrl, "https://globetrotr.nl/billing");
  assert.equal(access.body, "De uitnodiging voor Noordreis is ingetrokken.");
});

test("Agency- en betaalverzoeken lekken geen interne berichtcodes", () => {
  const agency = notificationCopy({
    templateKey: "agency_access",
    locale: "en",
    payload: {
      title: "Agency-rol gewijzigd / Agency role changed",
      body: "role|Nordic Travel|advisor",
    },
  });
  const settlement = notificationCopy({
    templateKey: "trip_settlement",
    locale: "nl",
    payload: {
      title: "Betaalverzoek / Payment request",
      body: "request|Scandinavië|Sanne|42.50|EUR",
      tripId: "trip-1",
    },
  });
  assert.equal(agency.subject, "Agency role changed");
  assert.equal(agency.body, "Your role in Nordic Travel is now advisor.");
  assert.equal(agency.actionUrl, "https://globetrotr.nl/agency-admin");
  assert.equal(
    settlement.body,
    "Sanne stuurde je een betaalverzoek van 42.50 EUR voor Scandinavië.",
  );
  assert.equal(settlement.actionUrl, "https://globetrotr.nl/trips/trip-1");
  assert.doesNotMatch(`${agency.body}${settlement.body}`, /role\||request\|/);
});

test("accountmail zonder tweetalige brontekst krijgt de profieltaal", () => {
  const blocked = notificationCopy({
    templateKey: "account",
    locale: "en",
    payload: { title: "Agency-toegang geblokkeerd", body: "Nordic Travel" },
  });
  assert.equal(blocked.subject, "Agency access suspended");
  assert.equal(blocked.body, "Your access to Nordic Travel has been suspended.");
});
