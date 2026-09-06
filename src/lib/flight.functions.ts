import { createServerFn } from "@tanstack/react-start";

export type FlightLookup = {
  flightNumber: string;
  airline?: string;
  status?: string;
  departure?: {
    airport?: string;
    airportFull?: string;
    scheduled?: string;
    actual?: string;
    terminal?: string;
    gate?: string;
    checkin?: string;
  };
  arrival?: {
    airport?: string;
    airportFull?: string;
    scheduled?: string;
    estimated?: string;
    terminal?: string;
    gate?: string;
    baggage?: string;
  };
};

/** Looks up one flight while keeping the provider key on the server. */
export const lookupFlight = createServerFn({ method: "GET" })
  .inputValidator((input: { flightNumber: string; flightDate?: string }) => input)
  .handler(async ({ data }): Promise<FlightLookup> => {
    const flightNumber = data.flightNumber.trim().toUpperCase().replace(/\s+/g, "");
    if (!/^[A-Z]{2,3}\d{1,7}$/.test(flightNumber)) {
      throw new Error("Vul een geldig vluchtnummer in, bijvoorbeeld KL1234.");
    }

    const apiKey = process.env.SKYLINK_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Live vluchtdata is nog niet geconfigureerd. Voeg SKYLINK_API_KEY toe aan Lovable Cloud Secrets.",
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    let response: Response;
    try {
      response = await fetch(
        `https://data.skylinkapi.com/v3.1/flight_status/${encodeURIComponent(flightNumber)}`,
        { headers: { "x-api-key": apiKey }, signal: controller.signal },
      );
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("SkyLinkAPI reageert te langzaam. Probeer het opnieuw.");
      }
      throw new Error("Live vluchtdata is tijdelijk niet bereikbaar. Probeer het opnieuw.");
    } finally {
      clearTimeout(timeout);
    }

    const payload = (await response.json().catch(() => null)) as SkyLinkFlightResponse | null;
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("De SkyLinkAPI-sleutel is ongeldig of niet geactiveerd.");
      }
      if (response.status === 404) {
        throw new Error(
          "Geen actuele vlucht gevonden. Controleer het vluchtnummer; voor toekomstige vluchten is de dienstregeling mogelijk nog niet beschikbaar.",
        );
      }
      if (response.status === 422) {
        throw new Error("SkyLinkAPI herkent dit vluchtnummer niet.");
      }
      if (response.status === 429) {
        throw new Error("De limiet voor live vluchtdata is bereikt. Probeer het later opnieuw.");
      }
      if (response.status >= 500) {
        throw new Error("SkyLinkAPI is tijdelijk niet beschikbaar. Probeer het later opnieuw.");
      }
      throw new Error("Vluchtdata kon niet worden opgehaald.");
    }
    if (!payload?.flight_number) throw new Error("SkyLinkAPI gaf geen bruikbare vluchtdata terug.");

    return {
      flightNumber: payload.flight_number.replace(/\s+/g, " ").trim(),
      airline: value(payload.airline),
      status: value(payload.status),
      departure: mapDeparture(payload.departure),
      arrival: mapArrival(payload.arrival),
    };
  });

type SkyLinkFlightResponse = {
  flight_number?: string;
  airline?: string;
  status?: string;
  departure?: {
    airport?: string;
    airport_full?: string;
    scheduled_time?: string;
    actual_time?: string;
    terminal?: string;
    gate?: string;
    checkin?: string;
  };
  arrival?: {
    airport?: string;
    airport_full?: string;
    scheduled_time?: string;
    estimated_time?: string;
    terminal?: string;
    gate?: string;
    baggage?: string;
  };
};

const value = (field?: string) => field?.trim() || undefined;

function mapDeparture(departure: SkyLinkFlightResponse["departure"]): FlightLookup["departure"] {
  if (!departure) return undefined;
  return {
    airport: value(departure.airport),
    airportFull: value(departure.airport_full),
    scheduled: value(departure.scheduled_time),
    actual: value(departure.actual_time),
    terminal: value(departure.terminal),
    gate: value(departure.gate),
    checkin: value(departure.checkin),
  };
}

function mapArrival(arrival: SkyLinkFlightResponse["arrival"]): FlightLookup["arrival"] {
  if (!arrival) return undefined;
  return {
    airport: value(arrival.airport),
    airportFull: value(arrival.airport_full),
    scheduled: value(arrival.scheduled_time),
    estimated: value(arrival.estimated_time),
    terminal: value(arrival.terminal),
    gate: value(arrival.gate),
    baggage: value(arrival.baggage),
  };
}
