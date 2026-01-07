"use client";

import { useState, useEffect, useMemo } from "react";
import { Item, ItemStatus } from "@/lib/schema";
import { ParsedResult } from "@/lib/parser";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { X, List as ListIcon, Columns as ColumnsIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { OmniBar } from "./omni-bar";
import { JournalView } from "./journal-view";
import { KanbanBoard } from "./kanban-board";
import { EditItemDialog } from "./edit-item-dialog";

export default function DashboardShell() {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [taskViewMode, setTaskViewMode] = useState<"list" | "kanban">("list");

  // Load & Save (Persistence Logic)
  useEffect(() => {
    const saved = localStorage.getItem("klartext-data");
    if (saved) {
      try {
        const parsed = JSON.parse(saved).map((i: any) => ({
          ...i,
          createdAt: new Date(i.createdAt),
          dueDate: i.dueDate ? new Date(i.dueDate) : null,
          status: i.status || (i.isCompleted ? "done" : "todo"),
          // Fallback für Zod Schema Kompatibilität
          tags: i.tags || [],
          priority: i.priority || "none",
          type: i.type || "note",
          description: i.description || ""
        }));
        setItems(parsed);
      } catch (e) { setItems([]); }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) localStorage.setItem("klartext-data", JSON.stringify(items));
  }, [items, isLoaded]);

  // Derived State
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    items.forEach(item => item.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [items]);

  const filteredItems = activeTagFilter ? items.filter(i => i.tags.includes(activeTagFilter)) : items;
  const journalItems = [...filteredItems].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const taskItems = filteredItems.filter(i => i.type === "todo");

  // Actions
  const handleAddItem = (parsed: ParsedResult) => {
    const newItem: Item = {
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
    };
    setItems([newItem, ...items]);
  };

  const handleUpdateItem = (updated: Item) => {
    setItems(items.map(i => i.id === updated.id ? updated : i));
    setEditingItem(null);
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
    setEditingItem(null);
  };

  const toggleStatus = (id: string) => {
    setItems(items.map(i => {
      if (i.id === id) {
        const newStatus = i.status === 'done' ? 'todo' : 'done';
        return { ...i, status: newStatus, isCompleted: newStatus === 'done' };
      }
      return i;
    }));
  };

  if (!isLoaded) return null;

  return (
    <div className="max-w-5xl mx-auto p-4 h-screen flex flex-col gap-6 font-sans">

      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 border-b pb-4">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Klartext<span className="text-primary">.</span></h1>
            <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, d. MMMM", { locale: de })}</p>
          </div>
          {activeTagFilter && (
            <Button variant="ghost" size="sm" onClick={() => setActiveTagFilter(null)}>
              <X size={14} className="mr-1" /> Filter: #{activeTagFilter}
            </Button>
          )}
        </div>
        <ScrollArea className="w-full whitespace-nowrap pb-2">
          <div className="flex gap-2">
            <Button variant={activeTagFilter === null ? "default" : "outline"} size="sm" onClick={() => setActiveTagFilter(null)} className="rounded-full h-7 text-xs">Alle</Button>
            {allTags.map(tag => (
              <Button key={tag} variant={activeTagFilter === tag ? "default" : "outline"} size="sm" onClick={() => setActiveTagFilter(tag === activeTagFilter ? null : tag)} className={`rounded-full h-7 text-xs ${activeTagFilter === tag ? "" : "border-dashed"}`}>#{tag}</Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* INPUT SECTION */}
      <OmniBar onAddItem={handleAddItem} allTags={allTags} />

      {/* MAIN VIEW */}
      <Tabs defaultValue="journal" className="flex-1 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="journal">Journal Stream</TabsTrigger>
            <TabsTrigger value="tasks">Projekt Board</TabsTrigger>
          </TabsList>

          <div className="flex bg-muted rounded-md p-1">
            <button onClick={() => setTaskViewMode("list")} className={`p-1.5 rounded-sm transition-all ${taskViewMode === 'list' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}><ListIcon size={14} /></button>
            <button onClick={() => setTaskViewMode("kanban")} className={`p-1.5 rounded-sm transition-all ${taskViewMode === 'kanban' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}><ColumnsIcon size={14} /></button>
          </div>
        </div>

        <TabsContent value="journal" className="flex-1 overflow-hidden relative rounded-xl border bg-muted/20">
          <JournalView
            items={journalItems}
            onDelete={handleDeleteItem}
            onToggle={toggleStatus}
            onEdit={setEditingItem}
            onTagClick={setActiveTagFilter}
          />
        </TabsContent>

        <TabsContent value="tasks" className="flex-1 overflow-hidden rounded-xl border bg-muted/20">
          <KanbanBoard
            items={taskItems}
            mode={taskViewMode}
            onEdit={setEditingItem}
            onUpdateStatus={(id: string, status: ItemStatus) => {
              const item = items.find(i => i.id === id);
              if (item) handleUpdateItem({ ...item, status, isCompleted: status === 'done' });
            }}
          />
        </TabsContent>
      </Tabs>

      {/* MODAL */}
      <EditItemDialog
        item={editingItem}
        open={!!editingItem}
        onClose={() => setEditingItem(null)}
        onSave={handleUpdateItem}
        onDelete={handleDeleteItem}
      />
    </div>
  );
}