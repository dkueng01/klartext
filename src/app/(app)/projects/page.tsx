"use client";

import { useMemo, useState } from "react";
import { useItems } from "@/hooks/use-items";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { KanbanBoard } from "@/components/dashboard/kanban-board";
import { EditItemDialog } from "@/components/dashboard/edit-item-dialog";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { Item } from "@/lib/schema";
import { List as ListIcon, Columns as ColumnsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { stackClientApp } from "@/stack/client";
import { isSameDay, isPast } from "date-fns";

export default function ProjectsPage() {
  const user = stackClientApp.useUser({ or: 'redirect' });

  const { items, isLoaded, updateItem, deleteItem } = useItems();
  const { activeTag, activePrio, activeDate } = useUrlFilters();

  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban");

  // Derived State: Tags sammeln
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    items.forEach(item => item.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [items]);

  // KOMPLEXE FILTER LOGIK (für Tasks)
  const filteredTasks = useMemo(() => {
    // 1. Basis-Filter: Nur Todos
    let tasks = items.filter(i => i.type === "todo");

    // 2. Tag Filter
    if (activeTag) tasks = tasks.filter(i => i.tags.includes(activeTag));

    // 3. Prio Filter
    if (activePrio) tasks = tasks.filter(i => i.priority === activePrio);

    // 4. Date Filter
    if (activeDate) {
      tasks = tasks.filter(i => {
        if (!i.dueDate) return false;
        const due = new Date(i.dueDate);
        const today = new Date();

        if (activeDate === 'today') return isSameDay(due, today);
        if (activeDate === 'overdue') return isPast(due) && !isSameDay(due, today);
        return true;
      });
    }

    return tasks;
  }, [items, activeTag, activePrio, activeDate]);

  if (!isLoaded) return null;

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-6rem)]">

      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Meine Projekte</h1>

        <div className="flex bg-muted rounded-md p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("list")}
            className={`h-7 px-2 ${viewMode === 'list' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
          >
            <ListIcon size={14} className="mr-1" /> Liste
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("kanban")}
            className={`h-7 px-2 ${viewMode === 'kanban' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
          >
            <ColumnsIcon size={14} className="mr-1" /> Board
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar allTags={allTags} />

      {/* Board View */}
      <div className="flex-1 overflow-hidden border rounded-xl bg-muted/10">
        <KanbanBoard
          items={filteredTasks}
          mode={viewMode}
          onEdit={setEditingItem}
          onUpdateStatus={(id, status) => {
            const item = items.find(i => i.id === id);
            if (item) updateItem({ ...item, status, isCompleted: status === 'done' });
          }}
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