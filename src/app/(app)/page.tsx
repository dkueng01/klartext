"use client";

import { useMemo, useState } from "react";
import { OmniBar } from "@/components/dashboard/omni-bar";
import { JournalView } from "@/components/dashboard/journal-view";
import { EditItemDialog } from "@/components/dashboard/edit-item-dialog";
import { useItems } from "@/hooks/use-items";
import { Item } from "@/lib/schema";
import { ParsedResult } from "@/lib/parser";
import { Button } from "@/components/ui/button";
import { stackClientApp } from "@/stack/client";

export default function Home() {
  const user = stackClientApp.useUser({ or: 'redirect' });
  const { items, isLoaded, addItem, updateItem, deleteItem } = useItems();
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Derived State
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    items.forEach(item => item.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [items]);

  const filteredItems = activeTagFilter
    ? items.filter(i => i.tags.includes(activeTagFilter))
    : items;

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
      description: ""
    });
  };

  if (!isLoaded) return null;

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-6rem)]">

      {/* Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-xs font-medium text-muted-foreground mr-2">Filter:</span>
        <Button
          variant={activeTagFilter === null ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTagFilter(null)}
          className="rounded-full h-6 text-xs px-3"
        >
          Alle
        </Button>
        {allTags.map(tag => (
          <Button
            key={tag}
            variant={activeTagFilter === tag ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTagFilter(tag === activeTagFilter ? null : tag)}
            className={`rounded-full h-6 text-xs px-3 ${activeTagFilter === tag ? "" : "border-dashed"}`}
          >
            #{tag}
          </Button>
        ))}
      </div>

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
          onTagClick={setActiveTagFilter}
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