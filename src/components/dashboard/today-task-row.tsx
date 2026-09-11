"use client";

import { addDays, format, isSameDay, parseISO, startOfDay } from "date-fns";
import { Calendar, CheckCircle2, Circle, Flag, MoreHorizontal, Play, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Item } from "@/lib/schema";
import { dayKey } from "@/lib/today";
import { cn } from "@/lib/utils";

export function TaskMeta({ item, now }: { item: Item; now: Date }) {
  if (!item.tags.length && !item.dueDate && item.priority !== "high") return null;
  return (
    <span className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
      {item.tags.map(tag => <span key={tag} className="rounded-sm bg-muted px-1.5 py-0.5">#{tag}</span>)}
      {item.dueDate && <span className={cn("inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5", item.status !== "done" && item.dueDate < startOfDay(now)
        ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400" : "bg-muted/50")}>
        <Calendar className="size-3" aria-hidden />
        {isSameDay(item.dueDate, now) ? "Heute fällig" : `Fällig ${format(item.dueDate, "dd.MM.yyyy")}`}
      </span>}
      {item.priority === "high" && item.status !== "done" && <span aria-label="Hohe Priorität" title="Hohe Priorität"><Flag className="size-3 text-red-500" /></span>}
    </span>
  );
}

export type TodayRowMode = "planned" | "suggestion" | "review" | "done";

export function TodayTaskRow({ item, mode, now, disabled, onEdit, onComplete, onStart, onPlan }: {
  item: Item;
  mode: TodayRowMode;
  now: Date;
  disabled: boolean;
  onEdit: (item: Item) => void;
  onComplete: (item: Item) => void;
  onStart: (item: Item) => void;
  onPlan: (item: Item, day: string | null) => void;
}) {
  const done = item.status === "done";
  const selected = item.plannedFor === dayKey(now);
  return (
    <div className={cn("flex min-w-0 items-start gap-2 rounded-lg border bg-card p-3 transition-colors hover:border-primary/30", done && "bg-muted/20 opacity-60")}>
      <Button type="button" variant="ghost" size="icon-sm" disabled={disabled}
        className="-ml-1 -mt-0.5 shrink-0 text-muted-foreground"
        aria-label={done ? `„${item.content}“ wieder öffnen` : `„${item.content}“ erledigen`}
        onClick={() => onComplete(item)}>
        {done ? <CheckCircle2 className="size-4 text-green-600" /> : <Circle className="size-4" />}
      </Button>
      <div className="flex min-w-0 flex-1 flex-wrap items-start gap-x-3 gap-y-2">
        <button type="button" className="min-w-0 flex-1 basis-full rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:basis-0"
          onClick={() => onEdit(item)}>
          <span className={cn("block text-sm font-medium leading-snug [overflow-wrap:anywhere]", done && "line-through")}>{item.content}</span>
          <TaskMeta item={item} now={now} />
          {mode === "review" && item.plannedFor && item.plannedFor !== dayKey(now) && <span className="mt-1 block text-[11px] text-muted-foreground">Eingeplant {format(parseISO(item.plannedFor), "dd.MM.")}</span>}
        </button>
        {!done && !item.waitingFor && (mode === "planned"
          ? <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" disabled={disabled} onClick={() => onStart(item)}><Play className="size-3" />Starten</Button>
          : selected ? <span className="py-1 text-[11px] text-muted-foreground">Für heute ausgewählt</span>
            : <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" disabled={disabled} onClick={() => onPlan(item, dayKey(now))}><Plus className="size-3" />Heute</Button>)}
      </div>
      {!done && <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" disabled={disabled} className="-mr-1 -mt-0.5 text-muted-foreground" aria-label={`Aktionen für „${item.content}“`}><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => onEdit(item)}>Details bearbeiten</DropdownMenuItem>
          {!item.waitingFor && <DropdownMenuItem onSelect={() => onPlan(item, dayKey(addDays(now, 1)))}>Für morgen einplanen</DropdownMenuItem>}
          {item.plannedFor && <DropdownMenuItem onSelect={() => onPlan(item, null)}>Aus der Tagesplanung nehmen</DropdownMenuItem>}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => onComplete(item)}>Erledigen</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>}
    </div>
  );
}
