import { useMemo, useState } from "react";
import { ArrowRight, Plus, Users, X } from "lucide-react";
import { balances, settle, travelersOf } from "@/lib/settle";
import { formatMoney, type Rates } from "@/lib/services";
import type { Trip } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Settlement({
  trip,
  base,
  rates,
  fallback,
  editable,
  onTravelers,
}: {
  trip: Trip;
  base: string;
  rates: Rates;
  fallback: string[];
  editable: boolean;
  onTravelers: (people: string[]) => void;
}) {
  const [name, setName] = useState("");
  const people = useMemo(() => travelersOf(trip, fallback), [trip, fallback]);
  const list = useMemo(() => balances(trip, people, base, rates), [trip, people, base, rates]);
  const transfers = useMemo(() => settle(list), [list]);

  return (
    <Card className="surface">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Users className="size-4" /> Slimme verrekening
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {people.map((p) => (
            <Badge key={p} variant="secondary" className="gap-1">
              {p}
              {editable && people.length > 1 && (
                <button
                  aria-label={`Verwijder ${p}`}
                  onClick={() => onTravelers(people.filter((x) => x !== p))}
                >
                  <X className="size-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>

        {editable && (
          <div className="flex gap-2">
            <Input
              value={name}
              placeholder="Reisgenoot toevoegen"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                const v = name.trim();
                if (!v || people.includes(v)) return;
                onTravelers([...people, v]);
                setName("");
              }}
            />
            <Button
              variant="outline"
              onClick={() => {
                const v = name.trim();
                if (!v || people.includes(v)) return;
                onTravelers([...people, v]);
                setName("");
              }}
            >
              <Plus className="size-4" />
            </Button>
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Persoon</th>
                <th className="p-3 text-right">Betaald</th>
                <th className="p-3 text-right">Aandeel</th>
                <th className="p-3 text-right">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {list.map((b) => (
                <tr key={b.name} className="border-t border-border">
                  <td className="p-3">{b.name}</td>
                  <td className="p-3 text-right">{formatMoney(b.paid, base)}</td>
                  <td className="p-3 text-right">{formatMoney(b.owes, base)}</td>
                  <td
                    className={`p-3 text-right font-medium ${
                      b.net < -0.01 ? "text-destructive" : ""
                    }`}
                  >
                    {formatMoney(b.net, base)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Minimale overboekingen
          </p>
          {transfers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Alles staat gelijk — niets te verrekenen.</p>
          ) : (
            <ul className="space-y-2">
              {transfers.map((t, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm"
                >
                  <span className="font-medium">{t.from}</span>
                  <ArrowRight className="size-4 text-muted-foreground" />
                  <span className="font-medium">{t.to}</span>
                  <span className="ml-auto">{formatMoney(t.amount, base)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
