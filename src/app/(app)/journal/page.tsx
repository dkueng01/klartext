"use client";

import { useMemo, useState } from "react";
import { isPast, isSameDay } from "date-fns";
import { EditItemDialog } from "@/components/dashboard/edit-item-dialog";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { JournalView } from "@/components/dashboard/journal-view";
import { OmniBar } from "@/components/dashboard/omni-bar";
import { useItems } from "@/hooks/use-items";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { ParsedResult } from "@/lib/parser";
import { Item } from "@/lib/schema";
import { stackClientApp } from "@/stack/client";
import { Button } from "@/components/ui/button";

type EntryTypeFilter = "all" | Item["type"];

export default function JournalPage() {
  stackClientApp.useUser({ or: "redirect" });

  const { items, isLoaded, addItem, updateItem, deleteItem } = useItems();
  const { activeTag, activePrio, activeDate, setFilter } = useUrlFilters();
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [entryTypeFilter, setEntryTypeFilter] = useState<EntryTypeFilter>("all");

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    items.forEach((item) => item.tags?.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (entryTypeFilter !== "all" && item.type !== entryTypeFilter) return false;
      if (activeTag && !item.tags.includes(activeTag)) return false;
      if (activePrio && item.priority !== activePrio) return false;

      if (activeDate) {
        if (!item.dueDate) return false;
        const dueDate = new Date(item.dueDate);
        const today = new Date();

        if (activeDate === "today" && !isSameDay(dueDate, today)) return false;
        if (activeDate === "overdue" && !(isPast(dueDate) && !isSameDay(dueDate, today))) return false;
      }

      return true;
    });
  }, [items, entryTypeFilter, activeTag, activePrio, activeDate]);

  const journalItems = [...filteredItems].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  const handleOmniAdd = (parsed: ParsedResult) => {
    addItem({
      id: Math.random().toString(36).slice(2, 11),
      content: parsed.content,
      type: parsed.type,
      tags: parsed.tags,
      priority: parsed.priority,
      dueDate: parsed.dueDate,
      status: "todo",
      createdAt: new Date(),
      description: "",
      images: [],
    });
  };

  if (!isLoaded) return <JournalSkeleton />;

  return (
    <div className="flex h-[calc(100dvh-11rem)] flex-col gap-5 sm:h-[calc(100vh-6rem)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Alle Einträge chronologisch</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Journal</h1>
        </div>
        <div className="inline-flex self-start rounded-lg bg-muted p-1" role="group" aria-label="Einträge nach Art filtern">
          {([
            ["all", "Alle"],
            ["note", "Notizen"],
            ["todo", "Aufgaben"],
          ] as const).map(([value, label]) => (
            <Button
              key={value}
              type="button"
              variant={entryTypeFilter === value ? "secondary" : "ghost"}
              size="sm"
              className={`h-7 px-2.5 text-xs ${entryTypeFilter === value ? "bg-background shadow-sm" : ""}`}
              onClick={() => setEntryTypeFilter(value)}
              aria-pressed={entryTypeFilter === value}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <FilterBar allTags={allTags} />
      <section className="space-y-2" aria-labelledby="new-entry-title">
        <h2 id="new-entry-title" className="px-1 text-xs font-semibold text-muted-foreground">Neuer Eintrag</h2>
        <OmniBar onAddItem={handleOmniAdd} allTags={allTags} defaultType="note" />
      </section>

      <div className="relative flex-1 overflow-hidden rounded-xl border bg-muted/10">
        <JournalView
          items={journalItems}
          onDelete={deleteItem}
          onToggle={(id) => {
            const item = items.find((entry) => entry.id === id);
            if (!item) return;
            updateItem({
              ...item,
              status: item.status === "done" ? "todo" : "done",
            });
          }}
          onEdit={setEditingItem}
          onTagClick={(tag) => setFilter("tag", tag)}
        />
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

function JournalSkeleton() {
  return (
    <div className="space-y-5" aria-label="Journal wird geladen">
      <div className="h-14 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="h-10 animate-pulse rounded-lg bg-muted" />
      <div className="h-64 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
