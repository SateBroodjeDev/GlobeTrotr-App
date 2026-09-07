import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PACKING_TEMPLATES, type PackingItem } from "@/lib/types";
import { uid } from "@/lib/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLocale } from "@/lib/locale";

export function Packing({
  items,
  editable,
  onChange,
}: {
  items: PackingItem[];
  editable: boolean;
  onChange: (next: PackingItem[]) => void;
}) {
  const { text } = useLocale();
  const [label, setLabel] = useState("");
  const done = items.filter((i) => i.done).length;
  const pct = items.length ? (done / items.length) * 100 : 0;

  function load(templateId: string) {
    const tpl = PACKING_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    const existing = new Set(items.map((i) => i.label.toLowerCase()));
    const added = tpl.items
      .filter((l) => !existing.has(l.toLowerCase()))
      .map((l) => ({ id: uid(), label: l, done: false }));
    onChange([...items, ...added]);
    toast.success(text(`${added.length} punten toegevoegd uit ${tpl.label}`, `${added.length} items added from ${tpl.label}`));
  }

  return (
    <div className="space-y-4">
      <Card className="surface">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{text("Paklijst-sjablonen (1 klik)", "Packing list templates (one click)")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {PACKING_TEMPLATES.map((t) => (
            <Button key={t.id} variant="outline" size="sm" disabled={!editable} onClick={() => load(t.id)}>
              <span className="mr-1">{t.emoji}</span>
              {t.label}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card className="surface">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            Checklist — {done}/{items.length} {text("afgevinkt", "checked")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={pct} />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={label}
              disabled={!editable}
              placeholder={text("Eigen punt toevoegen", "Add your own item")}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && label.trim()) {
                  onChange([...items, { id: uid(), label: label.trim(), done: false }]);
                  setLabel("");
                }
              }}
            />
            <Button
              disabled={!editable || !label.trim()}
              onClick={() => {
                onChange([...items, { id: uid(), label: label.trim(), done: false }]);
                setLabel("");
              }}
            >
              <Plus className="size-4" /> {text("Toevoegen", "Add")}
            </Button>
          </div>
          <ul className="grid gap-1 sm:grid-cols-2">
            {items.map((i) => (
              <li
                key={i.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm"
              >
                <label className="flex flex-1 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={i.done}
                    disabled={!editable}
                    onChange={(e) =>
                      onChange(items.map((x) => (x.id === i.id ? { ...x, done: e.target.checked } : x)))
                    }
                  />
                  <span className={i.done ? "text-muted-foreground line-through" : ""}>{i.label}</span>
                </label>
                {editable && (
                  <button
                    aria-label={text("Verwijder punt", "Delete item")}
                    onClick={() => onChange(items.filter((x) => x.id !== i.id))}
                  >
                    <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                  </button>
                )}
              </li>
            ))}
          </ul>
          {!items.length && (
            <p className="text-sm text-muted-foreground">
              {text("Nog niets ingepakt — laad hierboven een sjabloon.", "Nothing packed yet — load a template above.")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
