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

export default function JournalPage() {
  stackClientApp.useUser({ or: "redirect" });

  const { items, isLoaded, addItem, updateItem, deleteItem } = useItems();
  const { activeTag, activePrio, activeDate, setFilter } = useUrlFilters();
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    items.forEach((item) => item.tags?.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
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
  }, [items, activeTag, activePrio, activeDate]);

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
      isCompleted: false,
      createdAt: new Date(),
      description: "",
      images: [],
    });
  };

  if (!isLoaded) return <JournalSkeleton />;

  return (
    <div className="flex h-[calc(100dvh-11rem)] flex-col gap-5 sm:h-[calc(100vh-6rem)]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Archiv & Gedanken</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Journal</h1>
      </div>

      <FilterBar allTags={allTags} />
      <OmniBar onAddItem={handleOmniAdd} allTags={allTags} />

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
              isCompleted: item.status !== "done",
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
