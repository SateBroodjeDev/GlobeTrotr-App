import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { searchPlaces, type GeoResult } from "@/lib/services";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function PlaceSearch({
  onPick,
  disabled,
}: {
  onPick: (r: GeoResult) => void;
  disabled?: boolean;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      setResults(await searchPlaces(q));
    } catch {
      setError("Zoeken lukte niet, probeer opnieuw.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={run} className="flex gap-2">
        <Input
          value={q}
          disabled={disabled}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek elk dorp, stad of land ter wereld…"
        />
        <Button type="submit" disabled={disabled || loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      {results.length > 0 && (
        <ul className="mt-2 divide-y rounded-xl border border-border bg-card">
          {results.map((r) => (
            <li key={`${r.lat}-${r.lon}`}>
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => {
                  onPick(r);
                  setResults([]);
                  setQ("");
                }}
              >
                <span className="font-medium">{r.name}</span>
                <span className="text-xs text-muted-foreground">{r.country}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
