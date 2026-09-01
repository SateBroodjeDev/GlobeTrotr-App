import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/lib/workspace";
import { canBill, hasFeature } from "@/lib/plans";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

export const Route = createFileRoute("/branding")({
  head: () => ({
    meta: [
      { title: "White-label branding — AtlasLedger" },
      {
        name: "description",
        content:
          "Geef de reisplanner je eigen merknaam, domein, tagline en accentkleur voor je agency.",
      },
      { property: "og:title", content: "White-label branding — AtlasLedger" },
      {
        property: "og:description",
        content: "Custom branding voor touroperators en travel agencies.",
      },
    ],
  }),
  component: BrandingPage,
});

function BrandingPage() {
  const { state, update } = useWorkspace();
  const allowed = hasFeature(state.plan, "white_label") && canBill(state.role);
  const b = state.branding;

  const set = (patch: Partial<typeof b>) =>
    update((s) => ({ ...s, branding: { ...s.branding, ...patch } }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">White-label & custom branding</h1>
        <p className="text-sm text-muted-foreground">
          Lever het platform onder je eigen merk aan klanten en reizigers.
        </p>
      </div>

      {!allowed && (
        <p className="flex items-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm text-accent-foreground">
          <Lock className="size-4" /> White-label vereist het Business/Agency-plan en de
          eigenaarsrol.{" "}
          <Link to="/billing" className="underline">
            Bekijk plannen
          </Link>
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="surface">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Merkinstellingen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <label className="block">
              <span className="text-muted-foreground">Merknaam</span>
              <Input
                className="mt-1"
                disabled={!allowed}
                value={b.brandName}
                onChange={(e) => set({ brandName: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="text-muted-foreground">Domein / subdomein</span>
              <Input
                className="mt-1"
                disabled={!allowed}
                value={b.domain}
                onChange={(e) => set({ domain: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="text-muted-foreground">Tagline</span>
              <Input
                className="mt-1"
                disabled={!allowed}
                value={b.tagline}
                onChange={(e) => set({ tagline: e.target.value })}
              />
            </label>
            <div>
              <span className="text-muted-foreground">Accentkleur (hue {b.accent})</span>
              <Slider
                className="mt-3"
                disabled={!allowed}
                min={0}
                max={360}
                step={1}
                value={[b.accent]}
                onValueChange={([v]) => set({ accent: v })}
              />
            </div>
            <Button disabled={!allowed} onClick={() => toast.success("Branding opgeslagen")}>
              Opslaan
            </Button>
          </CardContent>
        </Card>

        <Card className="surface">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Live voorbeeld</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aurora rounded-2xl p-6">
              <p className="text-xs opacity-80">{b.domain}</p>
              <p className="font-display text-2xl font-semibold">{b.brandName}</p>
              <p className="mt-1 text-sm opacity-90">{b.tagline}</p>
              <div className="mt-4 flex gap-2">
                <span className="rounded-lg bg-white/15 px-3 py-1.5 text-xs">Reisschema</span>
                <span className="rounded-lg bg-white/15 px-3 py-1.5 text-xs">Declaraties</span>
                <span className="rounded-lg bg-white/15 px-3 py-1.5 text-xs">Kaart</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              De accentkleur werkt direct door in de hele app, exports en PDF-declaraties.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
