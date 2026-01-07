"use client";

import { useState } from "react";
import { Item, ItemStatus } from "@/lib/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GripVertical } from "lucide-react";
import { createPortal } from "react-dom";

// DND Kit Imports
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  useDraggable,
  useDroppable,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DropAnimation
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

interface KanbanBoardProps {
  items: Item[];
  mode: "list" | "kanban";
  onEdit: (item: Item) => void;
  onUpdateStatus: (id: string, status: ItemStatus) => void;
}

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5',
      },
    },
  }),
};

export function KanbanBoard({ items, mode, onEdit, onUpdateStatus }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const newStatus = over.id as ItemStatus;
      onUpdateStatus(active.id as string, newStatus);
    }
    setActiveId(null);
  };

  const activeItem = items.find(i => i.id === activeId);

  if (items.length === 0) {
    return <div className="text-center text-muted-foreground mt-10">Keine Aufgaben in diesem Filter.</div>;
  }

  // --- LIST VIEW (Bleibt gleich) ---
  if (mode === "list") {
    // ... (Code wie vorher für List View) ...
    // Der Einfachheit halber hier gekürzt, da es um Kanban geht.
    // Falls du den List-Code brauchst, sag Bescheid, aber er war im vorherigen Snippet korrekt.
    const active = items.filter(i => i.status !== 'done');
    const done = items.filter(i => i.status === 'done');
    return (
      <ScrollArea className="h-full p-4">
        {/* ... Liste ... */}
        <div className="space-y-2">
          {active.map(item => (
            <div key={item.id} onClick={() => onEdit(item)} className="cursor-pointer bg-background border p-3 rounded-lg shadow-sm flex items-center gap-3 hover:border-primary/50">
              <span className="text-sm font-medium">{item.content}</span>
            </div>
          ))}
        </div>
      </ScrollArea>
    )
  }

  // --- KANBAN VIEW ---
  const columns: Record<ItemStatus, Item[]> = {
    todo: items.filter(i => i.status === "todo"),
    in_progress: items.filter(i => i.status === "in_progress"),
    done: items.filter(i => i.status === "done")
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <ScrollArea className="h-full">
        <div className="flex h-full gap-4 p-4 min-w-[800px]">
          <KanbanColumn id="todo" title="Zu tun" items={columns.todo} onEdit={onEdit} colorClass="text-muted-foreground" />
          <KanbanColumn id="in_progress" title="In Arbeit" items={columns.in_progress} onEdit={onEdit} colorClass="text-yellow-600 bg-yellow-100/10 border-yellow-200/20" />
          <KanbanColumn id="done" title="Erledigt" items={columns.done} onEdit={onEdit} colorClass="text-green-600 bg-green-100/10 border-green-200/20 opacity-80" />
        </div>
      </ScrollArea>

      {/* Das ist der Trick: Ein Overlay, das immer über allem schwebt */}
      {createPortal(
        <DragOverlay dropAnimation={dropAnimation}>
          {activeItem ? (
            <Card className="cursor-grabbing shadow-xl ring-2 ring-primary/20 rotate-2 bg-background w-[250px]">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <GripVertical size={14} className="text-muted-foreground/30 mt-0.5" />
                  <div className="text-sm font-medium leading-tight select-none">
                    {activeItem.content}
                  </div>
                </div>
                {(activeItem.tags.length > 0) && (
                  <div className="flex gap-2 items-center flex-wrap pt-1 pl-5">
                    {activeItem.tags.map(t => (
                      <span key={t} className="text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground border">#{t}</span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}

// --- SUB COMPONENTS ---

function KanbanColumn({ id, title, items, onEdit, colorClass }: { id: ItemStatus, title: string, items: Item[], onEdit: (i: Item) => void, colorClass?: string }) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className={`flex-1 min-w-[250px] bg-muted/30 rounded-lg p-2 flex flex-col gap-2 h-full border border-transparent transition-colors ${colorClass}`}>
      <div className={`text-xs font-semibold uppercase tracking-wider px-2 py-1 flex justify-between ${colorClass?.split(" ")[0]}`}>
        <span>{title}</span>
        <span className="bg-background/50 px-1.5 rounded text-[10px]">{items.length}</span>
      </div>
      <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1">
        {items.map(item => (
          <DraggableCard key={item.id} item={item} onEdit={onEdit} />
        ))}
        {items.length === 0 && <div className="h-20 border-2 border-dashed border-muted/50 rounded-lg flex items-center justify-center text-xs text-muted-foreground">Hier ablegen</div>}
      </div>
    </div>
  );
}

function DraggableCard({ item, onEdit }: { item: Item, onEdit: (i: Item) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0 : 1, // WICHTIG: Das Original-Item wird unsichtbar
  } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none">
      <Card
        onClick={() => { if (!isDragging) onEdit(item); }}
        className="cursor-grab active:cursor-grabbing hover:shadow-md transition-all group bg-background"
      >
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start gap-2">
            <GripVertical size={14} className="text-muted-foreground/30 mt-0.5" />
            <div className="text-sm font-medium leading-tight group-hover:text-primary transition-colors select-none">
              {item.content}
            </div>
          </div>

          {(item.tags.length > 0 || item.description) && (
            <div className="flex gap-2 items-center flex-wrap pt-1 pl-5">
              {item.tags.map(t => (
                <span key={t} className="text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground border">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}