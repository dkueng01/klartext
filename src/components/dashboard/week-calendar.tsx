"use client";

import { useState } from "react";
import { addDays, addWeeks, format, startOfWeek } from "date-fns";
import { de } from "date-fns/locale";
import { ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Item } from "@/lib/schema";
import { dayKey } from "@/lib/today";
import { calendarItemsForDay } from "@/lib/week-calendar";
import { cn } from "@/lib/utils";

export function WeekCalendar({ items, now, activeTag, onEdit }: {
  items: Item[]; now: Date; activeTag: string | null; onEdit: (item: Item) => void;
}) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selected, setSelected] = useState<Date | null>(null);
  const [showAll, setShowAll] = useState(false);
  const today = dayKey(now);
  const start = startOfWeek(addWeeks(now, weekOffset), { weekStartsOn: 1 });
  const end = addDays(start, 6);
  const selectedKey = selected ? dayKey(selected) : today;
  const entries = selected ? calendarItemsForDay(items, selectedKey, activeTag) : [];
  const monthLabel = format(start, "yyyy-MM") === format(end, "yyyy-MM")
    ? format(start, "MMMM yyyy", { locale: de })
    : `${format(start, start.getFullYear() === end.getFullYear() ? "MMM" : "MMM yyyy", { locale: de })} – ${format(end, "MMM yyyy", { locale: de })}`;

  const changeWeek = (offset: number) => {
    setWeekOffset(offset);
    setSelected(null);
    setShowAll(false);
  };

  return <section aria-label="Wochenkalender" className="overflow-hidden rounded-xl border bg-muted/10">
    <div className="flex h-9 items-center justify-between px-3">
      <p className="text-xs font-medium text-muted-foreground" aria-live="polite">{monthLabel}</p>
      <div className="flex items-center gap-0.5">
        {(weekOffset !== 0 || selected) && <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={() => changeWeek(0)}>Heute</Button>}
        <Button variant="ghost" size="icon-sm" className="size-7 text-muted-foreground" aria-label="Vorherige Woche" onClick={() => changeWeek(weekOffset - 1)}><ChevronLeft className="size-3.5" /></Button>
        <Button variant="ghost" size="icon-sm" className="size-7 text-muted-foreground" aria-label="Nächste Woche" onClick={() => changeWeek(weekOffset + 1)}><ChevronRight className="size-3.5" /></Button>
      </div>
    </div>
    <div className="grid grid-cols-7 gap-1 px-2 pb-2" role="group" aria-label="Tag auswählen">
      {Array.from({ length: 7 }, (_, index) => {
        const date = addDays(start, index);
        const key = dayKey(date);
        const count = calendarItemsForDay(items, key, activeTag).length;
        const isToday = key === today;
        return <button key={key} type="button" aria-pressed={selectedKey === key} aria-current={isToday ? "date" : undefined}
          aria-label={`${format(date, "EEEE, d. MMMM yyyy", { locale: de })}${isToday ? ", heute" : ""}, ${count} ${count === 1 ? "Aufgabe" : "Aufgaben"}`}
          title={count ? `${count} ${count === 1 ? "Aufgabe mit Planung, Frist oder Wiedervorlage" : "Aufgaben mit Planung, Frist oder Wiedervorlage"}` : undefined}
          className={cn("relative flex h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-md border border-transparent pb-1.5 text-xs transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-10 sm:flex-row sm:gap-2",
            selectedKey === key ? "border-border bg-background font-semibold shadow-sm" : "text-muted-foreground",
            isToday && "font-semibold text-foreground")}
          onClick={() => { setSelected(key === today || (selected && selectedKey === key) ? null : date); setShowAll(false); }}>
          <span className="text-[10px] sm:text-xs">{format(date, "EEE", { locale: de }).replace(/\.$/, "")}</span>
          <time dateTime={key} className="tabular-nums">{format(date, "d")}</time>
          {count > 0 && <span aria-hidden className="absolute bottom-1 h-1 w-1 rounded-full bg-current opacity-60" />}
        </button>;
      })}
    </div>
    {selected && <div className="space-y-2 border-t p-3" aria-label="Aufgaben am ausgewählten Tag">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold">{format(selected, "EEEE, d. MMMM", { locale: de })}</h2>
        <Button variant="ghost" size="icon-sm" className="size-7 text-muted-foreground" aria-label="Tagesübersicht schließen" onClick={() => setSelected(null)}><X className="size-3.5" /></Button>
      </div>
      {(showAll ? entries : entries.slice(0, 3)).map(item => <button key={item.id} type="button" onClick={() => onEdit(item)}
        className="block w-full rounded-lg border bg-card px-3 py-2.5 text-left transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="block text-sm font-medium [overflow-wrap:anywhere]">{item.content}</span>
        <span className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-muted-foreground">
          {item.plannedFor === selectedKey && <span>Eingeplant</span>}
          {item.dueDate && dayKey(item.dueDate) === selectedKey && <span>Fällig</span>}
          {item.waitingFor && item.reviewOn === selectedKey && <span>Wiedervorlage</span>}
          {item.tags.map(tag => <span key={tag}>#{tag}</span>)}
        </span>
      </button>)}
      {!entries.length && <p className="pb-1 text-xs text-muted-foreground">Für diesen Tag ist nichts eingeplant oder fällig{activeTag ? ` in #${activeTag}` : ""}.</p>}
      {entries.length > 3 && <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" aria-expanded={showAll} onClick={() => setShowAll(open => !open)}><ChevronDown className={cn("size-3", showAll && "rotate-180")} />{showAll ? "Weniger anzeigen" : `${entries.length - 3} weitere anzeigen`}</Button>}
    </div>}
  </section>;
}
