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
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
      headers: { Accept: "application/json", "User-Agent": "GlobeTrotr-Weather" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error("WEATHER_PROVIDER_UNAVAILABLE");
    const payload = (await response.json()) as OpenMeteoResponse;
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
      throw new Error("WEATHER_RESPONSE_INVALID");
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
