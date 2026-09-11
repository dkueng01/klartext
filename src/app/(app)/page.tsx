"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { ArrowRight, CalendarClock, Check, CheckCircle2, ChevronDown, Hash, MoreHorizontal, Pause, Pin, Plus, StickyNote, type LucideIcon } from "lucide-react";
import { EditItemDialog } from "@/components/dashboard/edit-item-dialog";
import { TaskMeta, TodayTaskRow, type TodayRowMode } from "@/components/dashboard/today-task-row";
import { OmniBar } from "@/components/dashboard/omni-bar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/toast";
import { useItems } from "@/hooks/use-items";
import { useCurrentDay } from "@/hooks/use-current-day";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { ParsedResult } from "@/lib/parser";
import { Item } from "@/lib/schema";
import { nextStepPreview, selectToday } from "@/lib/today";
import { cn } from "@/lib/utils";
import { stackClientApp } from "@/stack/client";

export default function TodayPage() {
  stackClientApp.useUser({ or: "redirect" });
  const { items, isLoaded, isSaving, error, addItem, updateItem, patchItem, focusItem, deleteItem } = useItems();
  const { activeTag, setFilter } = useUrlFilters();
  const { toast } = useToast();
  const now = useCurrentDay();
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [draft, setDraft] = useState<Item | null>(null);
  const [captureToday, setCaptureToday] = useState(true);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [completedOpen, setCompletedOpen] = useState(false);
  const day = useMemo(() => selectToday(items, now, activeTag), [items, now, activeTag]);
  const tags = useMemo(() => Array.from(new Set(items.flatMap(item => item.tags))).sort(), [items]);
  const visibleFocus = day.focus && (!activeTag || day.focus.tags.includes(activeTag)) ? day.focus : null;
  const plannedRows = day.openPlan.filter(item => item.id !== visibleFocus?.id);
  const unplannedDue = day.dueToday.filter(item => item.plannedFor !== day.today && !item.waitingFor);
  const followUps = day.waiting.filter(item => item.reviewOn && item.reviewOn <= day.today);
  const currentItem = draft ?? editingItem;
  const sourceNote = items.find(item => item.id === currentItem?.sourceNoteId && item.type === "note");
  const tasksHref = activeTag ? `/tasks?tag=${encodeURIComponent(activeTag)}` : "/tasks";
  const journalHref = activeTag ? `/journal?tag=${encodeURIComponent(activeTag)}` : "/journal";

  const changePlan = async (item: Item, plannedFor: string | null) => {
    const saved = await patchItem(item.id, { plannedFor, focusedOn: plannedFor === day.today ? item.focusedOn : null });
    if (saved) toast({
      title: plannedFor === day.today ? "Für heute ausgewählt" : plannedFor ? "Für morgen eingeplant" : "Aus der Tagesauswahl genommen",
      duration: 8000,
      action: { label: "Rückgängig", onClick: () => { void patchItem(item.id, { plannedFor: item.plannedFor ?? null, focusedOn: null }); } },
    });
  };
  const complete = async (item: Item) => {
    const done = item.status !== "done";
    const saved = await patchItem(item.id, { status: done ? "done" : "todo" });
    if (saved && done) toast({ title: "Aufgabe erledigt", variant: "success", duration: 8000, action: {
      label: "Rückgängig", onClick: () => { void patchItem(item.id, { status: item.status, waitingFor: item.waitingFor, reviewOn: item.reviewOn, focusedOn: null }); },
    } });
  };
  const capture = async (parsed: ParsedResult) => {
    const created = await addItem({
      id: crypto.randomUUID(), content: parsed.content, type: parsed.type,
      tags: parsed.tags.length ? parsed.tags : activeTag ? [activeTag] : [],
      priority: parsed.priority, dueDate: parsed.dueDate, status: "todo", createdAt: new Date(),
      description: "", images: [], plannedFor: parsed.type === "todo" && captureToday ? day.today : null,
    });
    if (created) toast({ title: created.type === "note" ? "Notiz gespeichert" : created.plannedFor ? "Für heute ausgewählt" : "Aufgabe gespeichert" });
    return !!created;
  };
  const deriveTask = (note: Item) => {
    setDraft({ id: crypto.randomUUID(), content: note.content, type: "todo", status: "todo", tags: [...note.tags],
      priority: "none", dueDate: null, createdAt: new Date(), description: "", images: [],
      plannedFor: day.today, sourceNoteId: note.id });
  };
  const save = async (item: Item) => {
    if (draft) {
      const created = await addItem(item);
      if (created) toast({ title: "Aufgabe aus Notiz erstellt", variant: "success" });
      return !!created;
    }
    return updateItem(item);
  };
  const row = (item: Item, mode: TodayRowMode = "suggestion") => (
    <TodayTaskRow key={item.id} item={item} mode={mode} now={now} disabled={isSaving}
      onEdit={setEditingItem} onComplete={complete} onStart={item => { void focusItem(item.id, day.today); }}
      onPlan={changePlan} />
  );

  if (!isLoaded) return <TodaySkeleton />;
  if (error) return <div role="alert" className="rounded-xl border p-6">
    <h1 className="font-semibold">Heute konnte nicht geladen werden</h1>
    <p className="mt-2 text-sm text-muted-foreground">Bitte prüfe deine Verbindung und versuche es erneut.</p>
    <Button className="mt-4" onClick={() => window.location.reload()}>Erneut laden</Button>
  </div>;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{format(now, "EEEE, d. MMMM", { locale: de })}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Heute</h1>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className={cn("h-7 max-w-full gap-1.5 px-2.5 text-xs shadow-none", !activeTag && "border-dashed text-muted-foreground")}
              aria-label={activeTag ? `Bereich: ${activeTag}` : "Bereich auswählen"}>
              <Hash className="size-3.5" /><span className="truncate">{activeTag ? `#${activeTag}` : "Alle Bereiche"}</span><ChevronDown className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto">
            <DropdownMenuRadioGroup value={activeTag ?? ""} onValueChange={tag => setFilter("tag", tag || null)}>
              <DropdownMenuRadioItem value="">Alle Bereiche</DropdownMenuRadioItem>
              {Array.from(new Set([...tags, ...(activeTag ? [activeTag] : [])])).map(tag => <DropdownMenuRadioItem key={tag} value={tag}>#{tag}</DropdownMenuRadioItem>)}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <section aria-label="Schnell festhalten">
        <OmniBar onAddItem={capture} allTags={tags} defaultType="todo" disabled={isSaving} compact>
          <label className="flex min-h-8 cursor-pointer items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={captureToday} onChange={event => setCaptureToday(event.target.checked)} className="accent-primary" />
            Neue Aufgaben für heute auswählen{activeTag ? ` · #${activeTag}` : ""}
          </label>
        </OmniBar>
      </section>

      <section aria-labelledby="plan-title" className="overflow-hidden rounded-xl border bg-muted/10">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <h2 id="plan-title" className="text-sm font-semibold">Für heute</h2>
            {day.openPlan.length > 0 && <span className="rounded border bg-background px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground" aria-label={`${day.openPlan.length} offene ${day.openPlan.length === 1 ? "Aufgabe" : "Aufgaben"}`}>{day.openPlan.length}</span>}
          </div>
          <Button variant={day.openPlan.length || plannerOpen ? "ghost" : "default"} size="sm" className="h-8 text-xs"
            aria-expanded={plannerOpen} aria-controls="today-planner" onClick={() => setPlannerOpen(open => !open)}>
            {plannerOpen ? <ChevronDown className="size-3.5 rotate-180" /> : <Plus className="size-3.5" />}
            {plannerOpen ? "Auswahl schließen" : "Aufgaben auswählen"}
          </Button>
        </div>

        {(unplannedDue.length > 0 || followUps.length > 0) && <div className="flex flex-wrap gap-x-4 gap-y-1 border-b px-4 py-2 text-xs">
          {unplannedDue.length > 0 && <button type="button" onClick={() => setReviewOpen(true)} className="flex min-h-7 items-center gap-1.5 rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><CalendarClock className="size-3.5" />{unplannedDue.length} heute fällig <ArrowRight className="size-3" /></button>}
          {followUps.length > 0 && <button type="button" onClick={() => setReviewOpen(true)} className="flex min-h-7 items-center gap-1.5 rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{followUps.length} zum Nachfassen <ArrowRight className="size-3" /></button>}
        </div>}

        <div className="space-y-2 p-2 sm:p-3">
          {visibleFocus && <div className="rounded-lg border bg-card p-4 sm:p-5">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold text-muted-foreground"><span className="size-1.5 rounded-full bg-green-600" />Jetzt</h3>
            <button type="button" className="block w-full rounded text-left text-base font-semibold leading-snug [overflow-wrap:anywhere] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setEditingItem(visibleFocus)}>{visibleFocus.content}</button>
            <TaskMeta item={visibleFocus} now={now} />
            {nextStepPreview(visibleFocus) && <p className="mt-3 line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">{nextStepPreview(visibleFocus)}</p>}
            <div className="mt-4 flex items-center gap-2">
              <Button size="sm" disabled={isSaving} onClick={() => void complete(visibleFocus)}><Check />Erledigt</Button>
              <Button size="sm" variant="ghost" disabled={isSaving} onClick={() => void patchItem(visibleFocus.id, { focusedOn: null })}><Pause />Pause</Button>
              <Button size="sm" variant="ghost" className="ml-auto text-xs text-muted-foreground" onClick={() => setEditingItem(visibleFocus)}>Details</Button>
            </div>
          </div>}
          {!visibleFocus && day.focus && <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-2 text-xs text-muted-foreground">
            <span>Dein Fokus liegt in einem anderen Bereich.</span>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setFilter("tag", null)}>Fokus anzeigen <ArrowRight className="size-3" /></Button>
          </div>}
          <ItemList items={plannedRows} render={item => row(item, "planned")} limit={5} />
          {!day.openPlan.length && <div className="px-4 py-8 text-center">
            <p className="text-sm font-medium">{day.planned.length && day.completedPlanCount === day.planned.length ? "Deine Tagesauswahl ist erledigt." : "Noch nichts für heute ausgewählt."}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{day.planned.some(item => item.waitingFor && item.status !== "done")
              ? "Deine geplanten Aufgaben warten auf Rückmeldung."
              : day.carryOver.length ? `${day.carryOver.length} ${day.carryOver.length === 1 ? "Aufgabe aus früheren Tagen kannst" : "Aufgaben aus früheren Tagen kannst"} du erneut auswählen.`
              : "Wähle eine bestehende Aufgabe aus oder halte oben etwas Neues fest."}</p>
          </div>}
        </div>

        <div id="today-planner" hidden={!plannerOpen}>
          {plannerOpen && <div className="space-y-5 border-t p-3 sm:p-4">
            {unplannedDue.length > 0 && <TaskGroup title="Heute fällig" items={unplannedDue} render={row} />}
            {day.carryOver.length > 0 && <TaskGroup title="Aus früheren Tagesplänen" items={day.carryOver} render={item => row(item, "review")} />}
            <TaskGroup title="Vorschläge" items={day.suggestions} render={row} />
            {!day.suggestions.length && !day.carryOver.length && !unplannedDue.length && <p className="text-xs text-muted-foreground">Keine weiteren Vorschläge{activeTag ? ` in #${activeTag}` : ""}.</p>}
            <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground"><Link href={tasksHref}>Alle Aufgaben öffnen <ArrowRight className="size-3" /></Link></Button>
          </div>}
        </div>
      </section>

      <div className="divide-y rounded-xl border bg-muted/10">
        <Disclosure id="today-notes" title="Notizen" icon={StickyNote} open={notesOpen} onToggle={() => setNotesOpen(open => !open)}
          detail={day.notes.some(note => note.pinned) ? `${day.notes.filter(note => note.pinned).length} angeheftet` : undefined}>
          <ItemList items={day.notes} render={note => <div key={note.id} className="flex items-start gap-3 rounded-lg border bg-card p-3">
            <StickyNote className="mt-0.5 size-4 shrink-0 text-orange-400" aria-hidden />
            <button type="button" onClick={() => setEditingItem(note)} className="min-w-0 flex-1 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span className="block text-sm font-medium leading-snug [overflow-wrap:anywhere]">{note.content}</span>
              <span className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                {note.pinned && <Pin className="size-3" aria-label="Angeheftet" />}
                {note.tags.map(tag => <span key={tag} className="rounded-sm bg-muted px-1.5 py-0.5">#{tag}</span>)}
                <span>{format(note.createdAt, "dd.MM.")}</span>
              </span>
            </button>
            <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" className="-mr-1 -mt-1 text-muted-foreground" disabled={isSaving} aria-label={`Aktionen für Notiz „${note.content}“`}><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setEditingItem(note)}>Notiz öffnen</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => void patchItem(note.id, { pinned: !note.pinned })}>{note.pinned ? "Anheften aufheben" : "Anheften"}</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => deriveTask(note)}>Aufgabe ableiten</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>} />
          {!day.notes.length && <p className="text-xs text-muted-foreground">Noch keine Notizen{activeTag ? ` in #${activeTag}` : ""}.</p>}
          <Button asChild variant="ghost" size="sm" className="mt-2 text-xs text-muted-foreground"><Link href={journalHref}>Journal öffnen <ArrowRight className="size-3" /></Link></Button>
        </Disclosure>

        <Disclosure id="today-review" title="Fristen & Rückmeldungen" icon={CalendarClock} open={reviewOpen} onToggle={() => setReviewOpen(open => !open)}
          detail={day.overdue.length ? `${day.overdue.length} überfällig` : undefined}>
          <div className="space-y-5">
            <TaskGroup title="Heute fällig" items={day.dueToday} render={item => row(item, "review")} />
            {day.overdue.length > 0 && <details className="group/overdue">
              <summary className="flex min-h-8 cursor-pointer list-none items-center gap-2 rounded text-xs font-semibold text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden"><ChevronDown className="size-3.5 transition-transform group-open/overdue:rotate-180" />Überfällige Fristen <span className="font-normal">{day.overdue.length}</span></summary>
              <div className="mt-2"><ItemList items={day.overdue} render={item => row(item, "review")} /></div>
            </details>}
            {day.upcoming.length > 0 && <div className="space-y-2">
              <h3 className="px-1 text-xs font-semibold text-muted-foreground">Nächste Tage</h3>
              <ItemList items={day.upcoming} render={item => <button key={item.id} type="button" className="block w-full rounded-lg border bg-card p-3 text-left transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setEditingItem(item)}>
                <span className="block text-sm font-medium [overflow-wrap:anywhere]">{item.content}</span><TaskMeta item={item} now={now} />
                {item.plannedFor && item.plannedFor > day.today && <span className="mt-1 block text-[11px] text-muted-foreground">Eingeplant {format(parseISO(item.plannedFor), "dd.MM.")}</span>}
              </button>} />
            </div>}
            {day.waiting.length > 0 && <div className="space-y-2">
              <h3 className="px-1 text-xs font-semibold text-muted-foreground">Wartet auf Rückmeldung</h3>
              <ItemList items={day.waiting} render={item => <div key={item.id} className="rounded-lg border bg-card p-3">
                <button type="button" className="block w-full rounded text-left text-sm font-medium [overflow-wrap:anywhere] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setEditingItem(item)}>{item.content}</button>
                <p className="mt-1 text-xs text-muted-foreground [overflow-wrap:anywhere]">{item.waitingFor}</p>
                {item.reviewOn && <p className={cn("mt-1 text-[11px]", item.reviewOn <= day.today ? "font-medium text-amber-700 dark:text-amber-400" : "text-muted-foreground")}>{item.reviewOn <= day.today ? "Jetzt nachfassen" : `Wiedervorlage ${format(parseISO(item.reviewOn), "dd.MM.")}`}</p>}
                <Button size="sm" variant="ghost" className="mt-2 h-7 text-xs" disabled={isSaving} onClick={() => void patchItem(item.id, { waitingFor: null, reviewOn: null, plannedFor: day.today })}>Für heute freigeben <ArrowRight className="size-3" /></Button>
              </div>} />
            </div>}
            {!day.dueToday.length && !day.overdue.length && !day.upcoming.length && !day.waiting.length && <p className="text-xs text-muted-foreground">Keine offenen Fristen oder Rückmeldungen{activeTag ? ` in #${activeTag}` : ""}.</p>}
          </div>
        </Disclosure>

        {day.completed.length > 0 && <Disclosure id="today-completed" title="Heute erledigt" icon={CheckCircle2} detail={`${day.completed.length}`}
          open={completedOpen} onToggle={() => setCompletedOpen(open => !open)}>
          <ItemList items={day.completed} render={item => row(item, "done")} />
        </Disclosure>}
      </div>

      <EditItemDialog item={currentItem} open={!!currentItem} onClose={() => { setEditingItem(null); setDraft(null); }}
        onSave={save} onDelete={id => { if (!draft) deleteItem(id); }} isNew={!!draft}
        onOpenSource={sourceNote ? () => { setDraft(null); setEditingItem(sourceNote); } : undefined} />
    </div>
  );
}

function Disclosure({ id, title, icon: Icon, detail, open, onToggle, children }: {
  id: string; title: string; icon: LucideIcon; detail?: string; open: boolean; onToggle: () => void; children: ReactNode;
}) {
  return <section>
    <h2><button id={`${id}-trigger`} type="button" onClick={onToggle} aria-expanded={open} aria-controls={id}
      className="flex w-full items-center gap-2.5 rounded-lg px-4 py-4 text-left text-sm font-medium transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden /><span className="min-w-0 flex-1">{title}</span>
      {detail && <span className="shrink-0 text-[11px] font-normal text-muted-foreground">{detail}</span>}
      <ChevronDown className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} aria-hidden />
    </button></h2>
    <div id={id} role="region" aria-labelledby={`${id}-trigger`} hidden={!open}>{open && <div className="px-3 pb-3 sm:px-4 sm:pb-4">{children}</div>}</div>
  </section>;
}

function ItemList({ items, render, limit = 4 }: { items: Item[]; render: (item: Item) => ReactNode; limit?: number }) {
  const [expanded, setExpanded] = useState(false);
  if (!items.length) return null;
  return <div className="space-y-2">
    {(expanded ? items : items.slice(0, limit)).map(render)}
    {items.length > limit && <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" aria-expanded={expanded} onClick={() => setExpanded(current => !current)}>
      <ChevronDown className={cn("size-3", expanded && "rotate-180")} />{expanded ? "Weniger anzeigen" : `${items.length - limit} weitere anzeigen`}
    </Button>}
  </div>;
}

function TaskGroup({ title, items, render }: { title: string; items: Item[]; render: (item: Item) => ReactNode }) {
  if (!items.length) return null;
  return <div className="space-y-2"><h3 className="px-1 text-xs font-semibold text-muted-foreground">{title}</h3><ItemList items={items} render={render} /></div>;
}

function TodaySkeleton() {
  return <div className="space-y-5" aria-label="Heute wird geladen"><div className="h-14 w-48 animate-pulse rounded-lg bg-muted" /><div className="h-12 animate-pulse rounded-lg bg-muted" /><div className="h-40 animate-pulse rounded-xl bg-muted" /><div className="h-24 animate-pulse rounded-xl bg-muted" /></div>;
}
