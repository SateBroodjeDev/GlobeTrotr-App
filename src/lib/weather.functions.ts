import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Weather } from "@/lib/services";

type OpenMeteoResponse = {
  current?: { temperature_2m?: number; wind_speed_10m?: number; weather_code?: number };
  daily?: {
    time?: string[];
    temperature_2m_min?: number[];
    temperature_2m_max?: number[];
    weather_code?: number[];
  };
};

type MetResponse = {
  properties?: { timeseries?: Array<{
    time: string;
    data?: {
      instant?: { details?: { air_temperature?: number; wind_speed?: number } };
      next_1_hours?: { summary?: { symbol_code?: string } };
      next_6_hours?: { summary?: { symbol_code?: string } };
    };
  }> };
};

function metCode(symbol = "") {
  if (symbol.includes("thunder")) return 95;
  if (symbol.includes("snow") || symbol.includes("sleet")) return 75;
  if (symbol.includes("rain")) return symbol.includes("showers") ? 80 : 63;
  if (symbol.includes("fog")) return 45;
  if (symbol.includes("cloudy")) return symbol.includes("partly") ? 2 : 3;
  return 0;
}

async function getMetFallback(lat: number, lon: number): Promise<Weather> {
  const params = new URLSearchParams({ lat: String(lat), lon: String(lon) });
  const response = await fetch(
    `https://api.met.no/weatherapi/locationforecast/2.0/compact?${params}`,
    {
      headers: {
        Accept: "application/json",
        "User-Agent": "GlobeTrotr/1.0 info@globetrotr.nl",
      },
      signal: AbortSignal.timeout(8_000),
    },
  );
  if (!response.ok) throw new Error("WEATHER_PROVIDER_UNAVAILABLE");
  const timeseries = ((await response.json()) as MetResponse).properties?.timeseries ?? [];
  const first = timeseries[0];
  const current = first?.data?.instant?.details;
  if (!first || !Number.isFinite(current?.air_temperature) || !Number.isFinite(current?.wind_speed)) {
    throw new Error("WEATHER_RESPONSE_INVALID");
  }
  const days = new Map<string, { values: number[]; codes: number[] }>();
  for (const point of timeseries) {
    const temperature = point.data?.instant?.details?.air_temperature;
    if (!Number.isFinite(temperature)) continue;
    const date = point.time.slice(0, 10);
    const day = days.get(date) ?? { values: [], codes: [] };
    day.values.push(temperature!);
    day.codes.push(metCode(
      point.data?.next_1_hours?.summary?.symbol_code ??
      point.data?.next_6_hours?.summary?.symbol_code,
    ));
    days.set(date, day);
  }
  return {
    temperature: current!.air_temperature!,
    windspeed: current!.wind_speed! * 3.6,
    code: metCode(first.data?.next_1_hours?.summary?.symbol_code ?? first.data?.next_6_hours?.summary?.symbol_code),
    daily: [...days.entries()].slice(0, 5).map(([date, day]) => ({
      date,
      min: Math.min(...day.values),
      max: Math.max(...day.values),
      code: day.codes[Math.floor(day.codes.length / 2)] ?? 0,
    })),
  };
}

export const getWeather = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { lat: number; lon: number }) => input)
  .handler(async ({ data, context }) => {
    if (
      !Number.isFinite(data.lat) ||
      !Number.isFinite(data.lon) ||
      data.lat < -90 ||
      data.lat > 90 ||
      data.lon < -180 ||
      data.lon > 180
    ) {
      throw new Error("INVALID_COORDINATES");
    }
    const { data: workspace, error: workspaceError } = await context.supabase
      .from("workspaces")
      .select("plan")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (workspaceError || !workspace || workspace.plan === "free") {
      throw new Error("WEATHER_PLAN_REQUIRED");
    }
    const params = new URLSearchParams({
      latitude: String(data.lat),
      longitude: String(data.lon),
      current: "temperature_2m,wind_speed_10m,weather_code",
      daily: "temperature_2m_min,temperature_2m_max,weather_code",
      forecast_days: "5",
      timezone: "auto",
    });
    let payload: OpenMeteoResponse;
    try {
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
        headers: { Accept: "application/json", "User-Agent": "GlobeTrotr-Weather" },
        signal: AbortSignal.timeout(8_000),
      });
      if (!response.ok) throw new Error("WEATHER_PROVIDER_UNAVAILABLE");
      payload = (await response.json()) as OpenMeteoResponse;
    } catch {
      return getMetFallback(data.lat, data.lon);
    }
    const current = payload.current;
    const daily = payload.daily;
    if (
      !current ||
      !daily?.time ||
      !daily.temperature_2m_min ||
      !daily.temperature_2m_max ||
      !daily.weather_code ||
      !Number.isFinite(current.temperature_2m) ||
      !Number.isFinite(current.wind_speed_10m) ||
      !Number.isFinite(current.weather_code)
    ) {
      return getMetFallback(data.lat, data.lon);
    }
    return {
      temperature: current.temperature_2m!,
      windspeed: current.wind_speed_10m!,
      code: current.weather_code!,
      daily: daily.time.map((date, index) => ({
        date,
        min: daily.temperature_2m_min![index]!,
        max: daily.temperature_2m_max![index]!,
        code: daily.weather_code![index]!,
      })),
    } satisfies Weather;
  });
