"use client";

import { useEffect, useMemo, useState } from "react";
import { isPast, isSameDay } from "date-fns";
import { Columns as ColumnsIcon, List as ListIcon } from "lucide-react";
import { EditItemDialog } from "@/components/dashboard/edit-item-dialog";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { KanbanBoard } from "@/components/dashboard/kanban-board";
import { Button } from "@/components/ui/button";
import { useItems } from "@/hooks/use-items";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { Item } from "@/lib/schema";
import { stackClientApp } from "@/stack/client";

export default function TasksPage() {
  stackClientApp.useUser({ or: "redirect" });

  const { items, isLoaded, updateItem, deleteItem } = useItems();
  const { activeTag, activePrio, activeDate } = useUrlFilters();
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban");

  useEffect(() => {
    if (window.matchMedia("(max-width: 639px)").matches) {
      setViewMode("list");
    }
  }, []);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    items.forEach((item) => item.tags?.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [items]);

  const filteredTasks = useMemo(() => {
    let tasks = items.filter((item) => item.type === "todo");

    if (activeTag) tasks = tasks.filter((item) => item.tags.includes(activeTag));
    if (activePrio) tasks = tasks.filter((item) => item.priority === activePrio);

    if (activeDate) {
      tasks = tasks.filter((item) => {
        if (!item.dueDate) return false;
        const dueDate = new Date(item.dueDate);
        const today = new Date();

        if (activeDate === "today") return isSameDay(dueDate, today);
        if (activeDate === "overdue") return isPast(dueDate) && !isSameDay(dueDate, today);
        return true;
      });
    }

    return tasks;
  }, [items, activeTag, activePrio, activeDate]);

  if (!isLoaded) return null;

  return (
    <div className="flex h-[calc(100dvh-11rem)] flex-col gap-5 sm:h-[calc(100vh-6rem)]">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Offen → In Arbeit → Erledigt</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Aufgaben</h1>
        </div>

        <div className="flex shrink-0 bg-muted rounded-md p-1" role="group" aria-label="Aufgabenansicht">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("list")}
            aria-pressed={viewMode === "list"}
            className={`h-7 px-2 ${viewMode === "list" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
          >
            <ListIcon size={14} className="mr-1" /> Liste
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("kanban")}
            aria-pressed={viewMode === "kanban"}
            className={`h-7 px-2 ${viewMode === "kanban" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
          >
            <ColumnsIcon size={14} className="mr-1" /> Board
          </Button>
        </div>
      </div>

      <FilterBar allTags={allTags} />

      <div className="flex-1 overflow-hidden rounded-xl border bg-muted/10">
        <KanbanBoard
          items={filteredTasks}
          mode={viewMode}
          onEdit={setEditingItem}
          onUpdateStatus={(id, status) => {
            const item = items.find((entry) => entry.id === id);
            if (item) updateItem({ ...item, status });
          }}
        />
      </div>

      <EditItemDialog
        item={editingItem}
        open={!!editingItem}
        onClose={() => setEditingItem(null)}
        onSave={updateItem}
        onDelete={deleteItem}
        onOpenSource={items.some(item => item.id === editingItem?.sourceNoteId && item.type === "note")
          ? () => setEditingItem(items.find(item => item.id === editingItem?.sourceNoteId) ?? null) : undefined}
      />
    </div>
  );
}
