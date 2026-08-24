"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { addDays, format, isBefore, isSameDay, startOfDay } from "date-fns";
import { de } from "date-fns/locale";
import {
  ArrowRight,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock3,
  Flag,
  Inbox,
  Pause,
  Play,
  Sparkles,
  StickyNote,
  SunMedium,
} from "lucide-react";
import { EditItemDialog } from "@/components/dashboard/edit-item-dialog";
import { OmniBar } from "@/components/dashboard/omni-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useItems } from "@/hooks/use-items";
import { ParsedResult } from "@/lib/parser";
import { Item } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { stackClientApp } from "@/stack/client";

const priorityWeight: Record<Item["priority"], number> = {
  high: 3,
  medium: 2,
  low: 1,
  none: 0,
};

export default function TodayPage() {
  const user = stackClientApp.useUser({ or: "redirect" });
  const { items, isLoaded, addItem, updateItem, deleteItem } = useItems();
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showAllOverdue, setShowAllOverdue] = useState(false);

  const now = new Date();
  const today = startOfDay(now);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    items.forEach((item) => item.tags?.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [items]);

  const day = useMemo(() => {
    const tasks = items.filter((item) => item.type === "todo");
    const openTasks = tasks.filter((item) => item.status !== "done");
    const dueToday = tasks
      .filter((item) => item.dueDate && isSameDay(new Date(item.dueDate), today))
      .sort(sortTasks);
    const overdue = openTasks
      .filter((item) => item.dueDate && isBefore(new Date(item.dueDate), today))
      .sort(sortTasks);
    const inProgress = openTasks
      .filter((item) => item.status === "in_progress")
      .sort(sortTasks);
    const suggestions = openTasks
      .filter(
        (item) =>
          !dueToday.some((todayItem) => todayItem.id === item.id) &&
          !overdue.some((overdueItem) => overdueItem.id === item.id) &&
          !inProgress.some((progressItem) => progressItem.id === item.id)
      )
      .sort(sortTasks)
      .slice(0, 3);
    const notesToday = items
      .filter((item) => item.type === "note" && isSameDay(item.createdAt, today))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 4);

    return {
      dueToday,
      openToday: dueToday.filter((item) => item.status !== "done"),
      completedToday: dueToday.filter((item) => item.status === "done"),
      overdue,
      inProgress,
      suggestions,
      notesToday,
    };
  }, [items, today]);

  const completedCount = day.completedToday.length;
  const todayCount = day.dueToday.length;
  const progress = todayCount === 0 ? 0 : Math.round((completedCount / todayCount) * 100);

  const handleOmniAdd = (parsed: ParsedResult) => {
    addItem({
      id: Math.random().toString(36).slice(2, 11),
      content: parsed.content,
      type: parsed.type,
      tags: parsed.tags,
      priority: parsed.priority,
      dueDate: parsed.dueDate,
      status: "todo",
      isCompleted: false,
      createdAt: new Date(),
      description: "",
      images: [],
    });
  };

  const toggleComplete = (item: Item) => {
    const complete = item.status !== "done";
    updateItem({
      ...item,
      status: complete ? "done" : "todo",
      isCompleted: complete,
    });
  };

  const toggleProgress = (item: Item) => {
    updateItem({
      ...item,
      status: item.status === "in_progress" ? "todo" : "in_progress",
      isCompleted: false,
    });
  };

  const planFor = (item: Item, date: Date) => {
    updateItem({ ...item, dueDate: startOfDay(date) });
  };

  if (!isLoaded) return <TodaySkeleton />;

  const firstName = user.displayName?.trim().split(/\s+/)[0];

  return (
    <div className="mx-auto max-w-4xl space-y-7 pb-4 sm:space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <SunMedium className="size-4 text-amber-500" aria-hidden="true" />
            {format(now, "EEEE, d. MMMM", { locale: de })}
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {getGreeting(now.getHours())}{firstName ? `, ${firstName}` : ""}.
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Ein kurzer Blick, ein klarer Fokus – dann kannst du loslegen.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border bg-card px-3 py-1.5">
            {day.openToday.length} heute offen
          </span>
          {day.overdue.length > 0 && (
            <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
              {day.overdue.length} überfällig
            </span>
          )}
        </div>
      </header>

      <section aria-labelledby="quick-capture-title" className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 id="quick-capture-title" className="text-sm font-semibold">Schnell festhalten</h2>
            <p className="text-xs text-muted-foreground">Raus aus dem Kopf, ohne den Fokus zu verlieren.</p>
          </div>
          <span className="hidden text-[11px] text-muted-foreground sm:inline">Aufgaben mit „todo“ beginnen</span>
        </div>
        <OmniBar onAddItem={handleOmniAdd} allTags={allTags} />
      </section>

      <section aria-labelledby="progress-title">
        <Card className="gap-4 overflow-hidden border-primary/10 bg-gradient-to-br from-card via-card to-muted/40 py-0 shadow-sm">
          <CardContent className="grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  {todayCount > 0 && completedCount === todayCount ? <Check className="size-4" /> : <Sparkles className="size-4" />}
                </span>
                <div>
                  <h2 id="progress-title" className="font-semibold">Dein Tag</h2>
                  <p className="text-xs text-muted-foreground">
                    {todayCount === 0
                      ? "Noch nichts fest eingeplant"
                      : `${completedCount} von ${todayCount} geplanten Aufgaben erledigt`}
                  </p>
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted" aria-label={`${progress} Prozent erledigt`}>
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-4 border-t pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
              <Stat value={day.openToday.length} label="Offen" />
              <Stat value={day.inProgress.length} label="Im Fokus" />
              <Stat value={completedCount} label="Erledigt" />
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <main className="min-w-0 space-y-6">
          <TaskSection
            title="Heute"
            description={day.openToday.length > 0 ? "Das steht heute wirklich an." : "Für heute ist gerade nichts mehr offen."}
            icon={<SunMedium className="size-4 text-amber-500" />}
            count={day.openToday.length}
          >
            {day.openToday.length > 0 ? (
              day.openToday.map((item) => (
                <TodayTaskRow
                  key={item.id}
                  item={item}
                  onEdit={setEditingItem}
                  onComplete={toggleComplete}
                  onToggleProgress={toggleProgress}
                />
              ))
            ) : (
              <EmptyToday hasCompleted={completedCount > 0} />
            )}

            {day.completedToday.length > 0 && (
              <div className="border-t px-3 py-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between text-xs text-muted-foreground"
                  onClick={() => setShowCompleted((current) => !current)}
                  aria-expanded={showCompleted}
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-green-600" />
                    {day.completedToday.length} heute erledigt
                  </span>
                  {showCompleted ? <ChevronUp /> : <ChevronDown />}
                </Button>
                {showCompleted && (
                  <div className="mt-2 space-y-2 pb-1">
                    {day.completedToday.map((item) => (
                      <TodayTaskRow
                        key={item.id}
                        item={item}
                        onEdit={setEditingItem}
                        onComplete={toggleComplete}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </TaskSection>

          {day.overdue.length > 0 && (
            <TaskSection
              title="Kurz einordnen"
              description="Überfälliges bewusst neu planen oder direkt abschließen."
              icon={<CalendarClock className="size-4 text-red-500" />}
              count={day.overdue.length}
              tone="warning"
            >
              {(showAllOverdue ? day.overdue : day.overdue.slice(0, 3)).map((item) => (
                <TodayTaskRow
                  key={item.id}
                  item={item}
                  onEdit={setEditingItem}
                  onComplete={toggleComplete}
                  actions={
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-[11px]"
                        onClick={() => planFor(item, today)}
                      >
                        Heute
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[11px] text-muted-foreground"
                        onClick={() => planFor(item, addDays(today, 1))}
                      >
                        Morgen
                      </Button>
                    </div>
                  }
                />
              ))}
              {day.overdue.length > 3 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground"
                  onClick={() => setShowAllOverdue((current) => !current)}
                  aria-expanded={showAllOverdue}
                >
                  {showAllOverdue ? <ChevronUp /> : <ChevronDown />}
                  {showAllOverdue ? "Weniger anzeigen" : `${day.overdue.length - 3} weitere einordnen`}
                </Button>
              )}
            </TaskSection>
          )}
        </main>

        <aside className="min-w-0 space-y-5">
          <SideSection
            title="Im Fokus"
            description="Bereits gestartete Aufgaben"
            icon={<Play className="size-3.5" />}
          >
            {day.inProgress.length > 0 ? (
              day.inProgress.slice(0, 4).map((item) => (
                <CompactTask
                  key={item.id}
                  item={item}
                  onEdit={setEditingItem}
                  action={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground"
                      onClick={() => toggleProgress(item)}
                      aria-label={`Fokus für „${item.content}“ beenden`}
                    >
                      <Pause />
                    </Button>
                  }
                />
              ))
            ) : (
              <p className="px-1 py-2 text-xs leading-relaxed text-muted-foreground">
                Starte eine heutige Aufgabe, damit dein nächster Schritt sichtbar bleibt.
              </p>
            )}
          </SideSection>

          {day.suggestions.length > 0 && (
            <SideSection
              title="Als Nächstes"
              description="Aus deinen offenen Aufgaben"
              icon={<Inbox className="size-3.5" />}
            >
              {day.suggestions.map((item) => (
                <CompactTask
                  key={item.id}
                  item={item}
                  onEdit={setEditingItem}
                  action={
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                      onClick={() => planFor(item, today)}
                    >
                      + Heute
                    </Button>
                  }
                />
              ))}
              <Button asChild variant="ghost" size="sm" className="mt-1 w-full justify-between text-xs text-muted-foreground">
                <Link href="/projects">
                  Alle Aufgaben <ArrowRight />
                </Link>
              </Button>
            </SideSection>
          )}

          <SideSection
            title="Heute festgehalten"
            description="Deine neuen Notizen"
            icon={<StickyNote className="size-3.5" />}
          >
            {day.notesToday.length > 0 ? (
              day.notesToday.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setEditingItem(item)}
                  className="w-full rounded-lg px-2 py-2 text-left text-xs leading-relaxed transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="line-clamp-2">{item.content}</span>
                  <span className="mt-1 block text-[10px] text-muted-foreground">
                    {format(item.createdAt, "HH:mm")} Uhr
                  </span>
                </button>
              ))
            ) : (
              <p className="px-1 py-2 text-xs leading-relaxed text-muted-foreground">
                Noch keine Notiz heute – die Schnellablage wartet oben.
              </p>
            )}
            <Button asChild variant="ghost" size="sm" className="mt-1 w-full justify-between text-xs text-muted-foreground">
              <Link href="/journal">
                Journal öffnen <ArrowRight />
              </Link>
            </Button>
          </SideSection>
        </aside>
      </div>

      <EditItemDialog
        item={editingItem}
        open={!!editingItem}
        onClose={() => setEditingItem(null)}
        onSave={updateItem}
        onDelete={deleteItem}
      />
    </div>
  );
}

function TaskSection({
  title,
  description,
  icon,
  count,
  tone,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  count: number;
  tone?: "warning";
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "min-w-0 overflow-hidden rounded-xl border bg-card shadow-sm",
        tone === "warning" && "border-red-200/80 dark:border-red-900/50"
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b px-4 py-4 sm:px-5">
        <div className="min-w-0 flex items-start gap-3">
          <span className="mt-0.5 flex size-7 items-center justify-center rounded-md bg-muted">{icon}</span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">{title}</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
          </div>
        </div>
        <Badge variant="secondary" className="min-w-6 justify-center text-[10px]">{count}</Badge>
      </div>
      <div className="space-y-2 p-3">{children}</div>
    </section>
  );
}

function TodayTaskRow({
  item,
  onEdit,
  onComplete,
  onToggleProgress,
  actions,
}: {
  item: Item;
  onEdit: (item: Item) => void;
  onComplete: (item: Item) => void;
  onToggleProgress?: (item: Item) => void;
  actions?: React.ReactNode;
}) {
  const isDone = item.status === "done";

  return (
    <div className={cn("group flex min-w-0 items-center gap-3 rounded-lg border bg-background p-3 transition-colors hover:border-primary/25", isDone && "bg-muted/20 opacity-70")}>
      <button
        type="button"
        onClick={() => onComplete(item)}
        className="shrink-0 rounded-full text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={isDone ? `Aufgabe „${item.content}“ wieder öffnen` : `Aufgabe „${item.content}“ erledigen`}
      >
        {isDone ? <CheckCircle2 className="size-5 text-green-600" /> : <Circle className="size-5" />}
      </button>

      <button
        type="button"
        onClick={() => onEdit(item)}
        className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className={cn("block truncate text-sm font-medium", isDone && "line-through text-muted-foreground")}>
          {item.content}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
          {item.status === "in_progress" && !isDone && (
            <span className="font-medium text-amber-700 dark:text-amber-400">In Arbeit</span>
          )}
          {item.dueDate && (
            <span className="flex items-center gap-1">
              <Clock3 className="size-3" /> {format(new Date(item.dueDate), "dd.MM.")}
            </span>
          )}
          {item.priority !== "none" && !isDone && (
            <span className={cn("flex items-center gap-1", item.priority === "high" && "text-red-600 dark:text-red-400")}>
              <Flag className="size-3" /> {priorityLabel(item.priority)}
            </span>
          )}
          {item.tags.slice(0, 2).map((tag) => <span key={tag}>#{tag}</span>)}
        </span>
      </button>

      {actions ?? (!isDone && onToggleProgress ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={cn("text-muted-foreground", item.status === "in_progress" && "text-amber-700 dark:text-amber-400")}
          onClick={() => onToggleProgress(item)}
          aria-label={item.status === "in_progress" ? `Fokus für „${item.content}“ beenden` : `„${item.content}“ jetzt starten`}
          title={item.status === "in_progress" ? "Fokus beenden" : "Jetzt starten"}
        >
          {item.status === "in_progress" ? <Pause /> : <Play />}
        </Button>
      ) : null)}
    </div>
  );
}

function SideSection({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card p-3 shadow-sm">
      <div className="mb-2 flex items-center gap-2 px-1 py-1">
        <span className="flex size-6 items-center justify-center rounded-md bg-muted text-muted-foreground">{icon}</span>
        <div>
          <h2 className="text-xs font-semibold">{title}</h2>
          <p className="text-[10px] text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function CompactTask({ item, onEdit, action }: { item: Item; onEdit: (item: Item) => void; action: React.ReactNode }) {
  return (
    <div className="group flex items-center gap-1 rounded-lg hover:bg-muted">
      <button
        type="button"
        onClick={() => onEdit(item)}
        className="min-w-0 flex-1 px-2 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="block truncate text-xs font-medium">{item.content}</span>
        <span className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          {item.priority !== "none" && <span>{priorityLabel(item.priority)}</span>}
          {item.tags[0] && <span>#{item.tags[0]}</span>}
        </span>
      </button>
      {action}
    </div>
  );
}

function EmptyToday({ hasCompleted }: { hasCompleted: boolean }) {
  return (
    <div className="flex flex-col items-center px-4 py-8 text-center">
      <span className="mb-3 flex size-10 items-center justify-center rounded-full bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400">
        {hasCompleted ? <CheckCircle2 className="size-5" /> : <CalendarClock className="size-5" />}
      </span>
      <p className="text-sm font-medium">{hasCompleted ? "Für heute alles erledigt." : "Noch kein fester Plan für heute."}</p>
      <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
        {hasCompleted ? "Guter Zeitpunkt für einen kurzen Rückblick." : "Wähle rechts eine Aufgabe aus oder erfasse oben etwas Neues mit @heute."}
      </p>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="min-w-12 text-center">
      <div className="text-xl font-bold tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

function TodaySkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-7" aria-label="Heute wird geladen">
      <div className="h-24 w-full max-w-lg animate-pulse rounded-xl bg-muted" />
      <div className="h-12 animate-pulse rounded-lg bg-muted" />
      <div className="h-32 animate-pulse rounded-xl bg-muted" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="h-72 animate-pulse rounded-xl bg-muted" />
        <div className="h-56 animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}

function getGreeting(hour: number) {
  if (hour < 11) return "Guten Morgen";
  if (hour < 17) return "Guten Tag";
  return "Guten Abend";
}

function priorityLabel(priority: Item["priority"]) {
  if (priority === "high") return "Hoch";
  if (priority === "medium") return "Mittel";
  if (priority === "low") return "Niedrig";
  return "";
}

function sortTasks(a: Item, b: Item) {
  if (a.status === "done" && b.status !== "done") return 1;
  if (a.status !== "done" && b.status === "done") return -1;
  if (a.status === "in_progress" && b.status !== "in_progress") return -1;
  if (a.status !== "in_progress" && b.status === "in_progress") return 1;
  const priorityDifference = priorityWeight[b.priority] - priorityWeight[a.priority];
  if (priorityDifference !== 0) return priorityDifference;
  return b.createdAt.getTime() - a.createdAt.getTime();
}
