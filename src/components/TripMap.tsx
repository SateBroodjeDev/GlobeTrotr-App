import { useEffect, useRef } from "react";
import type { Stop } from "@/lib/types";

export default function TripMap({
  stops,
  activeStopId,
  onStopSelect,
}: {
  stops: Stop[];
  activeStopId?: string;
  onStopSelect?: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !ref.current) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let map = mapRef.current as any;
      if (!map) {
        map = L.map(ref.current, { scrollWheelZoom: false }).setView([20, 10], 2);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap",
          maxZoom: 18,
        }).addTo(map);
        mapRef.current = map;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) map.removeLayer(layer);
      });

      if (stops.length) {
        const latlngs = stops.map((s) => [s.lat, s.lon] as [number, number]);
        stops.forEach((s, i) => {
          const active = s.id === activeStopId;
          const size = active ? 34 : 28;
          L.marker([s.lat, s.lon], {
            icon: L.divIcon({
              className: "",
              html: `<div style="display:grid;place-items:center;width:${size}px;height:${size}px;border-radius:999px;background:${active ? "#111827" : "oklch(0.52 0.115 var(--brand-hue))"};color:#fff;font:600 12px/1 system-ui;box-shadow:0 2px 8px rgba(0,0,0,.35)">${i + 1}</div>`,
              iconSize: [size, size],
              iconAnchor: [size / 2, size / 2],
            }),
          })
            .addTo(map)
            .bindPopup(`<b>${s.name}</b><br/>${s.country}`)
            .on("click", () => onStopSelect?.(s.id));
        });
        if (latlngs.length > 1) {
          L.polyline(latlngs, {
            color: "#0f9b8e",
            weight: 3,
            dashArray: "6 8",
          }).addTo(map);
        }
        map.fitBounds(L.latLngBounds(latlngs).pad(0.35), { maxZoom: 8 });
        const activeStop = stops.find((stop) => stop.id === activeStopId);
        if (activeStop) map.setView([activeStop.lat, activeStop.lon], Math.max(map.getZoom(), 7));
      }
      setTimeout(() => map.invalidateSize(), 60);
    })();

    return () => {
      cancelled = true;
    };
  }, [activeStopId, onStopSelect, stops]);

  useEffect(() => {
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const map = mapRef.current as any;
      if (map) {
        map.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return <div ref={ref} className="h-[500px] w-full rounded-xl bg-muted sm:h-[560px]" />;
}
