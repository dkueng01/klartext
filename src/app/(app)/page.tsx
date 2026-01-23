"use client";

import { useMemo, useState } from "react";
import { OmniBar } from "@/components/dashboard/omni-bar";
import { JournalView } from "@/components/dashboard/journal-view";
import { EditItemDialog } from "@/components/dashboard/edit-item-dialog";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { useItems } from "@/hooks/use-items";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { Item } from "@/lib/schema";
import { ParsedResult } from "@/lib/parser";
import { stackClientApp } from "@/stack/client";
import { isSameDay, isPast } from "date-fns";

export default function Home() {
  const user = stackClientApp.useUser({ or: 'redirect' });

  const { items, isLoaded, addItem, updateItem, deleteItem } = useItems();

  // Neuer Hook für URL-Filter statt lokalem State
  const { activeTag, activePrio, activeDate } = useUrlFilters();

  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Derived State: Alle verfügbaren Tags sammeln für die FilterBar
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    items.forEach(item => item.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [items]);

  // KOMPLEXE FILTER LOGIK
  const filteredItems = useMemo(() => {
    return items.filter(i => {
      // 1. Tag Filter
      if (activeTag && !i.tags.includes(activeTag)) return false;

      // 2. Prio Filter
      if (activePrio && i.priority !== activePrio) return false;

      // 3. Date Filter
      if (activeDate) {
        if (!i.dueDate) return false;
        const due = new Date(i.dueDate);
        const today = new Date();

        if (activeDate === 'today' && !isSameDay(due, today)) return false;
        if (activeDate === 'overdue' && (isPast(due) && !isSameDay(due, today))) return false;
      }

      return true;
    });
  }, [items, activeTag, activePrio, activeDate]);

  const journalItems = [...filteredItems].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const handleOmniAdd = (parsed: ParsedResult) => {
    addItem({
      id: Math.random().toString(36).substr(2, 9),
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

  if (!isLoaded) return null;

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-6rem)]">

      {/* Neue Filter Bar Component */}
      <FilterBar allTags={allTags} />

      {/* Omni Bar */}
      <OmniBar onAddItem={handleOmniAdd} allTags={allTags} />

      {/* Journal View */}
      <div className="flex-1 overflow-hidden border rounded-xl bg-muted/10 relative">
        <JournalView
          items={journalItems}
          onDelete={deleteItem}
          onToggle={(id) => {
            const item = items.find(i => i.id === id);
            if (item) updateItem({ ...item, status: item.status === 'done' ? 'todo' : 'done', isCompleted: !item.isCompleted });
          }}
          onEdit={setEditingItem}
          onTagClick={() => { }}
        />
      </div>

      {/* Edit Modal */}
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