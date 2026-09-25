import { useEffect, useRef } from "react";
import type { Stop } from "@/lib/types";
import { useLocale } from "@/lib/locale";
import { localizeCountry } from "@/lib/localized-values";

export type TripMapPoint = { id: string; lat: number; lon: number; title: string; detail?: string; kind: "booking" | "expense" | "journal" };
const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]!);

export default function TripMap({
  stops,
  activeStopId,
  onStopSelect,
  points = [],
}: {
  stops: Stop[];
  activeStopId?: string;
  onStopSelect?: (id: string) => void;
  points?: TripMapPoint[];
}) {
  const { locale } = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !ref.current) return;

      let map = mapRef.current as any;
      if (!map) {
        map = L.map(ref.current, { scrollWheelZoom: false }).setView([20, 10], 2);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap",
          maxZoom: 18,
        }).addTo(map);
        mapRef.current = map;
      }

      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline || layer instanceof L.CircleMarker) map.removeLayer(layer);
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
            .bindPopup(`<b>${escapeHtml(s.name)}</b><br/>${escapeHtml(localizeCountry(s.country, locale))}`)
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
      points.forEach((point) => {
        L.circleMarker([point.lat, point.lon], {
          radius: 7,
          color: point.kind === "expense" ? "#f59e0b" : point.kind === "journal" ? "#db2777" : "#2563eb",
          fillColor: point.kind === "expense" ? "#f59e0b" : point.kind === "journal" ? "#db2777" : "#2563eb",
          fillOpacity: 0.85,
          weight: 2,
        }).addTo(map).bindPopup(`<b>${escapeHtml(point.title)}</b>${point.detail ? `<br/>${escapeHtml(point.detail)}` : ""}`);
      });
      setTimeout(() => map.invalidateSize(), 60);
    })();

    return () => {
      cancelled = true;
    };
  }, [activeStopId, locale, onStopSelect, points, stops]);

  useEffect(() => {
    return () => {
      const map = mapRef.current as any;
      if (map) {
        map.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return <div ref={ref} className="trip-map h-[500px] max-w-full overflow-hidden rounded-xl bg-muted sm:h-[560px]" />;
}
