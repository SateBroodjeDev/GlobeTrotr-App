import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  findScheduledFlight,
  formatScheduleDate,
  isScheduleDateSupported,
  type ScheduleResponse,
} from "./flight-schedule";

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
  .middleware([requireSupabaseAuth])
  .validator(
    (input: { flightNumber: string; flightDate?: string; departureIata?: string }) => input,
  )
  .handler(async ({ data, context }): Promise<FlightLookup> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: workspace, error: workspaceError } = await supabaseAdmin
      .from("workspaces")
      .select("workspace_uuid,plan")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (workspaceError || !workspace) throw new Error("WORKSPACE_NOT_FOUND");
    const { consumeProviderQuota } = await import("@/lib/provider-quota.server");
    await consumeProviderQuota(supabaseAdmin, workspace.workspace_uuid, context.userId, workspace.plan, "flight_lookup");
    const { data: allowed, error: quotaError } = await supabaseAdmin.rpc(
      "consume_flight_lookup_quota" as never,
      { p_user_id: context.userId, p_limit: 20 } as never,
    );
    if (quotaError) {
      throw new Error(
        "De beveiligingsupdate voor vluchtinformatie ontbreekt. Voer de nieuwste migratie uit.",
      );
    }
    if (!allowed) {
      throw new Error("Je hebt de limiet van 20 vluchtcontroles per uur bereikt.");
    }
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
        const scheduled = await lookupScheduledFlight({
          apiKey,
          flightNumber,
          flightDate: data.flightDate,
          departureIata: data.departureIata,
        });
        if (scheduled) return scheduled;
        throw new Error(
          "Geen actuele of geplande vlucht gevonden. Controleer het vluchtnummer, de datum en de vertrekluchthaven.",
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

async function lookupScheduledFlight({
  apiKey,
  flightNumber,
  flightDate,
  departureIata,
}: {
  apiKey: string;
  flightNumber: string;
  flightDate?: string;
  departureIata?: string;
}): Promise<FlightLookup | undefined> {
  const iata = departureIata?.trim().toUpperCase();
  if (!iata || !/^[A-Z]{3}$/.test(iata) || !flightDate) return undefined;
  if (!isScheduleDateSupported(flightDate)) return undefined;
  const date = formatScheduleDate(flightDate);
  if (!date) return undefined;

  const parameters = new URLSearchParams({ iata, date });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  let response: Response;
  try {
    response = await fetch(
      `https://data.skylinkapi.com/v3/schedules/departures?${parameters.toString()}`,
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

  if (response.status === 401) {
    throw new Error("De SkyLinkAPI-sleutel is ongeldig of niet geactiveerd.");
  }
  if (response.status === 429) {
    throw new Error("De limiet voor live vluchtdata is bereikt. Probeer het later opnieuw.");
  }
  if (!response.ok) return undefined;

  const payload = (await response.json().catch(() => null)) as ScheduleResponse | null;
  const flight = payload ? findScheduledFlight(payload, flightNumber) : undefined;
  if (!flight) return undefined;
  return {
    flightNumber: value(flight.Flight) ?? flightNumber,
    airline: value(flight.Airline),
    status: value(flight.Status),
    departure: {
      airport: iata,
      scheduled: value(flight.Time),
    },
    arrival: {
      airport: value(flight.IATA),
      airportFull: value(flight.Destination),
    },
  };
}

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
