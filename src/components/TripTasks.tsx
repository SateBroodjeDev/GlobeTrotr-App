import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ListChecks, ListTodo, PlaneTakeoff, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteTripTask, listTripTasks, saveTripTask, type TripTask } from "@/lib/trip-task.functions";

export function TripTasks({ tripId, editable, text }: { tripId: string; editable: boolean; text: (nl: string, en: string) => string }) {
  const [tasks, setTasks] = useState<TripTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [assigneeName, setAssigneeName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [category, setCategory] = useState<TripTask["category"]>("task");
  const [listName, setListName] = useState("");
  const load = useCallback(async () => {
    try { setTasks(await listTripTasks({ data: { tripId } })); }
    catch { toast.error(text("Taken konden niet worden geladen.", "Tasks could not be loaded.")); }
    finally { setLoading(false); }
  }, [text, tripId]);
  useEffect(() => { void load(); }, [load]);
  const visibleTasks = useMemo(() => tasks.filter((task) => task.category === category), [category, tasks]);
  const open = useMemo(() => visibleTasks.filter((task) => !task.completed).length, [visibleTasks]);
  const save = async () => {
    if (title.trim().length < 2) return;
    setSaving(true);
    try {
      await saveTripTask({ data: { tripId, title, assigneeName, dueDate: dueDate || null, completed: false, category, listName } });
      setTitle(""); setAssigneeName(""); setDueDate(""); await load();
      toast.success(text("Taak toegevoegd", "Task added"));
    } catch { toast.error(text("Taak kon niet worden opgeslagen.", "Task could not be saved.")); }
    finally { setSaving(false); }
  };
  const update = async (task: TripTask, completed: boolean) => {
    try {
      await saveTripTask({ data: { tripId, id: task.id, title: task.title, assigneeName: task.assigneeName, dueDate: task.dueDate, completed, category: task.category, listName: task.listName } });
      setTasks((current) => current.map((item) => item.id === task.id ? { ...item, completed } : item));
    } catch { toast.error(text("Taak kon niet worden gewijzigd.", "Task could not be updated.")); }
  };
  const remove = async (id: string) => {
    if (!window.confirm(text("Deze taak verwijderen?", "Delete this task?"))) return;
    try { await deleteTripTask({ data: { tripId, id } }); setTasks((current) => current.filter((task) => task.id !== id)); }
    catch { toast.error(text("Taak kon niet worden verwijderd.", "Task could not be deleted.")); }
  };
  return <Card className="surface">
    <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><ListTodo className="size-4"/>{text("Taken en checklists", "Tasks and checklists")}<span className="ml-auto text-xs font-normal text-muted-foreground">{open} {text("open", "open")}</span></CardTitle></CardHeader>
    <CardContent className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {([
          ["task", ListTodo, text("Taken", "Tasks")],
          ["departure", PlaneTakeoff, text("Vertrek", "Departure")],
          ["shopping", ShoppingCart, text("Boodschappen", "Shopping")],
          ["custom", ListChecks, text("Eigen lijst", "Custom list")],
        ] as const).map(([value, Icon, label]) => <Button key={value} type="button" size="sm" variant={category === value ? "default" : "outline"} onClick={() => setCategory(value)}><Icon className="size-4"/>{label}</Button>)}
      </div>
      {editable && <div className="grid gap-3 rounded-xl border bg-muted/20 p-3 md:grid-cols-[1fr_180px_150px_auto] md:items-end">
        {category === "custom" && <div className="space-y-1 md:col-span-full"><Label>{text("Naam van de lijst", "List name")}</Label><Input value={listName} maxLength={80} onChange={(event)=>setListName(event.target.value)} placeholder={text("Bijvoorbeeld boodschappen voor de camping", "For example campsite supplies")}/></div>}
        <div className="space-y-1"><Label>{text("Taak", "Task")}</Label><Input value={title} maxLength={160} onChange={(event)=>setTitle(event.target.value)} placeholder={text("Bijvoorbeeld tickets downloaden", "For example download tickets")}/></div>
        <div className="space-y-1"><Label>{text("Verantwoordelijke", "Assignee")}</Label><Input value={assigneeName} maxLength={100} onChange={(event)=>setAssigneeName(event.target.value)} placeholder={text("Naam (optioneel)", "Name (optional)")}/></div>
        <div className="space-y-1"><Label>{text("Deadline", "Due date")}</Label><Input type="date" value={dueDate} onChange={(event)=>setDueDate(event.target.value)}/></div>
        <Button disabled={saving || title.trim().length < 2 || (category === "custom" && listName.trim().length < 2)} onClick={save}><Plus className="size-4"/>{text("Toevoegen", "Add")}</Button>
      </div>}
      {loading ? <p className="text-sm text-muted-foreground">{text("Taken laden…", "Loading tasks…")}</p> : visibleTasks.length === 0 ? <p className="text-sm text-muted-foreground">{text("Deze lijst is nog leeg.", "This list is empty.")}</p> : <div className="divide-y rounded-xl border">{visibleTasks.map((task)=><div key={task.id} className="flex items-center gap-3 p-3">
        <Button type="button" size="icon" variant={task.completed ? "secondary" : "outline"} disabled={!editable} onClick={()=>update(task,!task.completed)} aria-label={task.completed ? text("Heropenen", "Reopen") : text("Afronden", "Complete")}><Check className="size-4"/></Button>
        <div className="min-w-0 flex-1"><p className={task.completed ? "truncate text-sm line-through text-muted-foreground" : "truncate text-sm font-medium"}>{task.title}</p><p className="text-xs text-muted-foreground">{[task.listName, task.assigneeName, task.dueDate ? new Intl.DateTimeFormat(undefined,{dateStyle:"medium"}).format(new Date(`${task.dueDate}T12:00:00`)) : ""].filter(Boolean).join(" · ")}</p></div>
        {editable && <Button type="button" size="icon" variant="ghost" onClick={()=>remove(task.id)} aria-label={text("Verwijderen", "Delete")}><Trash2 className="size-4"/></Button>}
      </div>)}</div>}
    </CardContent>
  </Card>;
}
