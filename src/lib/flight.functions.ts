import { createServerFn } from "@tanstack/react-start";

export type FlightLookup = {
  flightNumber: string;
  airline?: string;
  status?: string;
  departure?: { airport?: string; iata?: string; scheduled?: string; estimated?: string };
  arrival?: { airport?: string; iata?: string; scheduled?: string; estimated?: string };
};

/** Looks up one flight while keeping the provider key on the server. */
export const lookupFlight = createServerFn({ method: "GET" })
  .inputValidator((input: { flightNumber: string; flightDate?: string }) => input)
  .handler(async ({ data }): Promise<FlightLookup> => {
    const flightNumber = data.flightNumber.trim().toUpperCase().replace(/\s+/g, "");
    if (!flightNumber) throw new Error("Vul eerst een vluchtnummer in.");

    const apiKey = process.env.AVIATIONSTACK_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Live vluchtdata is nog niet geconfigureerd. Voeg AVIATIONSTACK_API_KEY toe aan de serverinstellingen.",
      );
    }

    const params = new URLSearchParams({ access_key: apiKey, flight_iata: flightNumber });
    if (data.flightDate) params.set("flight_date", data.flightDate);
    const response = await fetch(`https://api.aviationstack.com/v1/flights?${params}`);
    const payload = (await response.json().catch(() => null)) as {
      data?: Array<{
        flight?: { iata?: string };
        airline?: { name?: string };
        flight_status?: string;
        departure?: { airport?: string; iata?: string; scheduled?: string; estimated?: string };
        arrival?: { airport?: string; iata?: string; scheduled?: string; estimated?: string };
      }>;
      error?: { message?: string };
    } | null;

    if (!response.ok || payload?.error) {
      const providerMessage = payload?.error?.message || "";
      if (
        /subscription plan.*(does not support|not support)|not available.*plan/i.test(
          providerMessage,
        )
      ) {
        throw new Error(
          "Live vluchtdata is niet beschikbaar met het huidige Aviationstack-abonnement. Voeg de vlucht handmatig toe of gebruik een sleutel met toegang tot deze API-functie.",
        );
      }
      if (response.status === 429) {
        throw new Error("De limiet voor live vluchtdata is bereikt. Probeer het later opnieuw.");
      }
      throw new Error(providerMessage || "Vluchtdata kon niet worden opgehaald.");
    }
    const result = payload?.data?.[0];
    if (!result) throw new Error("Geen vlucht gevonden voor dit nummer en deze datum.");

    return {
      flightNumber: result.flight?.iata || flightNumber,
      airline: result.airline?.name,
      status: result.flight_status,
      departure: result.departure,
      arrival: result.arrival,
    };
  });
