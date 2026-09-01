import { useQuery } from "@tanstack/react-query";
import { fetchWeather, weatherLabel } from "@/lib/services";
import type { Stop } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function WeatherWidget({ stop, enabled }: { stop?: Stop; enabled: boolean }) {
  const q = useQuery({
    queryKey: ["weather", stop?.lat, stop?.lon],
    queryFn: () => fetchWeather(stop!.lat, stop!.lon),
    enabled: !!stop && enabled,
    staleTime: 1000 * 60 * 30,
  });

  return (
    <Card className="surface">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          Weer · {stop ? `${stop.name}, ${stop.country}` : "geen bestemming"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!enabled ? (
          <p className="text-sm text-muted-foreground">
            Live weer is onderdeel van Pro. Upgrade om de verwachting per bestemming te zien.
          </p>
        ) : !stop ? (
          <p className="text-sm text-muted-foreground">Voeg een bestemming toe op de kaart.</p>
        ) : q.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : q.isError ? (
          <p className="text-sm text-destructive">Weerdata tijdelijk niet beschikbaar.</p>
        ) : q.data ? (
          <div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl">{weatherLabel(q.data.code).icon}</span>
              <span className="font-display text-3xl font-semibold">
                {Math.round(q.data.temperature)}°C
              </span>
              <span className="text-sm text-muted-foreground">
                {weatherLabel(q.data.code).text} · {Math.round(q.data.windspeed)} km/u
              </span>
            </div>
            <div className="mt-4 grid grid-cols-5 gap-2 text-center text-xs">
              {q.data.daily.map((d) => (
                <div key={d.date} className="rounded-lg bg-muted/70 py-2">
                  <div className="text-muted-foreground">
                    {new Date(d.date).toLocaleDateString("nl-NL", { weekday: "short" })}
                  </div>
                  <div className="text-base">{weatherLabel(d.code).icon}</div>
                  <div className="font-medium">
                    {Math.round(d.max)}° / {Math.round(d.min)}°
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
