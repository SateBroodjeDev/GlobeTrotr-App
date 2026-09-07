import { useMemo, useState } from "react";
import { ArrowRight, Plus, Users, X } from "lucide-react";
import { balances, settle, travelersOf } from "@/lib/settle";
import { formatMoney, type Rates } from "@/lib/services";
import type { Trip } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/locale";

export function Settlement({
  trip,
  base,
  rates,
  fallback,
  editable,
  onTravelers,
  manageTravelersInSettings = false,
}: {
  trip: Trip;
  base: string;
  rates: Rates;
  fallback: string[];
  editable: boolean;
  onTravelers?: (people: string[]) => void;
  /** Reisgenoten worden in de instellingen beheerd, niet in de geldtool. */
  manageTravelersInSettings?: boolean;
}) {
  const { text } = useLocale();
  const [name, setName] = useState("");
  const people = useMemo(() => travelersOf(trip, fallback), [trip, fallback]);
  const list = useMemo(() => balances(trip, people, base, rates), [trip, people, base, rates]);
  const transfers = useMemo(() => settle(list), [list]);

  return (
    <Card className="surface">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Users className="size-4" /> {text("Slimme verrekening", "Smart settlement")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {people.map((p) => (
            <Badge key={p} variant="secondary" className="gap-1">
              {p}
              {editable && !manageTravelersInSettings && people.length > 1 && onTravelers && (
                <button
                  aria-label={`${text("Verwijder", "Remove")} ${p}`}
                  onClick={() => onTravelers(people.filter((x) => x !== p))}
                >
                  <X className="size-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>

        {editable && !manageTravelersInSettings && onTravelers && (
          <div className="flex gap-2">
            <Input
              value={name}
              placeholder={text("Reisgenoot toevoegen", "Add traveller")}
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

        {manageTravelersInSettings && (
          <p className="text-xs text-muted-foreground">
            {text(
              "Beheer deelnemers via Reisinstellingen → Reisgenoten. Dezelfde personen worden hier gebruikt voor kosten en verrekening.",
              "Manage participants under Trip settings → Travellers. The same people are used for expenses and settlement.",
            )}
          </p>
        )}

        <div className="space-y-2 sm:hidden">
          {list.map((balance) => (
            <div key={balance.name} className="rounded-xl border border-border p-3">
              <p className="break-words font-medium">{balance.name}</p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="min-w-0">
                  <dt className="text-muted-foreground">{text("Betaald", "Paid")}</dt>
                  <dd className="mt-1 break-words font-medium">
                    {formatMoney(balance.paid, base)}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-muted-foreground">{text("Aandeel", "Share")}</dt>
                  <dd className="mt-1 break-words font-medium">
                    {formatMoney(balance.owes, base)}
                  </dd>
                </div>
                <div className="col-span-2 mt-1 flex min-w-0 items-baseline justify-between gap-3 border-t border-border pt-2">
                  <dt className="text-muted-foreground">{text("Saldo", "Balance")}</dt>
                  <dd
                    className={`min-w-0 break-words text-right font-semibold ${
                      balance.net < -0.01 ? "text-destructive" : ""
                    }`}
                  >
                    {formatMoney(balance.net, base)}
                  </dd>
                </div>
              </dl>
            </div>
          ))}
        </div>

        <div className="hidden overflow-hidden rounded-xl border border-border sm:block">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">{text("Persoon", "Person")}</th>
                <th className="p-3 text-right">{text("Betaald", "Paid")}</th>
                <th className="p-3 text-right">{text("Aandeel", "Share")}</th>
                <th className="p-3 text-right">{text("Saldo", "Balance")}</th>
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
            {text("Minimale overboekingen", "Minimum transfers")}
          </p>
          {transfers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {text(
                "Alles staat gelijk — niets te verrekenen.",
                "Everything is settled — no transfers needed.",
              )}
            </p>
          ) : (
            <ul className="space-y-2">
              {transfers.map((t, i) => (
                <li
                  key={i}
                  className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm"
                >
                  <span className="min-w-0 break-words font-medium">{t.from}</span>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 break-words font-medium">{t.to}</span>
                  <span className="ml-auto shrink-0 font-medium">
                    {formatMoney(t.amount, base)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
