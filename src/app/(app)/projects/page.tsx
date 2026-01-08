"use client";

import { useState } from "react";
import { useItems } from "@/hooks/use-items";
import { KanbanBoard } from "@/components/dashboard/kanban-board";
import { EditItemDialog } from "@/components/dashboard/edit-item-dialog";
import { Item } from "@/lib/schema";
import { List as ListIcon, Columns as ColumnsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { stackClientApp } from "@/stack/client";

export default function ProjectsPage() {
  const user = stackClientApp.useUser({ or: 'redirect' });
  const { items, isLoaded, updateItem, deleteItem } = useItems();
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban");

  if (!isLoaded) return null;

  // Nur Todos anzeigen, Notizen haben im Kanban nichts verloren
  const projectTasks = items.filter(i => i.type === "todo");

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

      {/* Board View */}
      <div className="flex-1 overflow-hidden border rounded-xl bg-muted/10">
        <KanbanBoard
          items={projectTasks}
          mode={viewMode}
          onEdit={setEditingItem}
          onUpdateStatus={(id, status) => {
            const item = items.find(i => i.id === id);
            if (item) updateItem({ ...item, status, isCompleted: status === 'done' });
          }}
        />
      </div>

      {/* Edit Modal (Wiederverwenden!) */}
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