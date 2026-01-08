"use client";

import { useState } from "react";
import { Item, ItemStatus } from "@/lib/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Circle, CheckCircle2, Flag, Calendar, Clock } from "lucide-react";
import { createPortal } from "react-dom";
import { format, isPast, isSameDay } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";

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
      active: { opacity: '0.4' },
    },
  }),
};

// Helper für Prio Farben & Icons
const getPrioIcon = (prio: string) => {
  switch (prio) {
    case 'high': return <Flag size={12} className="text-red-500 fill-red-500/10" />;
    case 'medium': return <Flag size={12} className="text-orange-500" />;
    case 'low': return <Flag size={12} className="text-blue-500" />;
    default: return null;
  }
};

export function KanbanBoard({ items, mode, onEdit, onUpdateStatus }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onUpdateStatus(active.id as string, over.id as ItemStatus);
    }
    setActiveId(null);
  };

  const activeItem = items.find(i => i.id === activeId);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
        <div className="border-2 border-dashed border-muted rounded-xl p-8 mb-4">
          <KanbanIconPlaceholder />
        </div>
        <p className="text-sm font-medium">Keine Aufgaben gefunden</p>
        <p className="text-xs">Passe den Filter an oder erstelle neue Tasks.</p>
      </div>
    );
  }

  // --- LIST VIEW ---
  if (mode === "list") {
    const active = items.filter(i => i.status !== 'done');
    const done = items.filter(i => i.status === 'done');

    return (
      <ScrollArea className="h-full px-4">
        <div className="max-w-4xl mx-auto py-4 space-y-6">
          {/* Active Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1 mb-3">Zu erledigen ({active.length})</h3>
            {active.map(item => (
              <ListItem key={item.id} item={item} onEdit={onEdit} onUpdateStatus={onUpdateStatus} />
            ))}
            {active.length === 0 && <div className="text-sm text-muted-foreground italic pl-1">Alles erledigt! 🎉</div>}
          </div>

          {/* Done Section */}
          {done.length > 0 && (
            <div className="space-y-2 pt-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1 mb-3">Erledigt ({done.length})</h3>
              {done.map(item => (
                <ListItem key={item.id} item={item} onEdit={onEdit} onUpdateStatus={onUpdateStatus} isDone />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    );
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
        <div className="flex h-full gap-4 p-4 min-w-[900px]"> {/* Min-Width erhöht für mehr Platz */}
          <KanbanColumn id="todo" title="Zu tun" items={columns.todo} onEdit={onEdit} />
          <KanbanColumn id="in_progress" title="In Arbeit" items={columns.in_progress} onEdit={onEdit} isWarning />
          <KanbanColumn id="done" title="Erledigt" items={columns.done} onEdit={onEdit} isSuccess />
        </div>
      </ScrollArea>

      {createPortal(
        <DragOverlay dropAnimation={dropAnimation}>
          {activeItem ? <KanbanCardContent item={activeItem} isOverlay /> : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}

// --- SUB COMPONENTS ---

function KanbanColumn({ id, title, items, onEdit, isWarning, isSuccess }: { id: ItemStatus, title: string, items: Item[], onEdit: (i: Item) => void, isWarning?: boolean, isSuccess?: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-1 min-w-[280px] bg-muted/20 rounded-xl p-2 flex flex-col gap-3 h-full border border-transparent transition-colors",
        isOver && "bg-muted/50 border-primary/20"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2 pt-1">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", isWarning ? "bg-yellow-500" : isSuccess ? "bg-green-500" : "bg-slate-400")} />
          <span className="text-xs font-semibold uppercase tracking-wide text-foreground/80">{title}</span>
        </div>
        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 min-w-[20px] justify-center bg-background border shadow-sm">
          {items.length}
        </Badge>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto px-1 pb-2">
        {items.map(item => (
          <DraggableCard key={item.id} item={item} onEdit={onEdit} />
        ))}
        {items.length === 0 && (
          <div className="h-32 border-2 border-dashed border-muted/40 rounded-lg flex flex-col items-center justify-center text-muted-foreground/40 gap-2">
            <div className="w-8 h-8 rounded-full bg-muted/30" />
            <span className="text-[10px] font-medium uppercase">Leer</span>
          </div>
        )}
      </div>
    </div>
  );
}

function DraggableCard({ item, onEdit }: { item: Item, onEdit: (i: Item) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: item.id });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0 : 1,
  } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none group">
      <div onClick={() => !isDragging && onEdit(item)}>
        <KanbanCardContent item={item} />
      </div>
    </div>
  );
}

// Separate Content Component für Card & Overlay (DRY)
function KanbanCardContent({ item, isOverlay }: { item: Item, isOverlay?: boolean }) {
  const isOverdue = item.dueDate && isPast(new Date(item.dueDate)) && !isSameDay(new Date(item.dueDate), new Date());

  return (
    <Card className={cn(
      "cursor-grab active:cursor-grabbing hover:shadow-md transition-all bg-background border-muted-foreground/10 group-hover:border-primary/40 py-0",
      isOverlay && "cursor-grabbing shadow-xl ring-2 ring-primary/10 rotate-2 w-[280px]"
    )}>
      <CardContent className="p-3.5 space-y-2.5">
        {/* Header: Grip & Title */}
        <div className="flex items-start gap-2.5">
          <GripVertical size={14} className="text-muted-foreground/20 mt-0.5 shrink-0 group-hover:text-muted-foreground/50 transition-colors" />
          <span className="text-sm font-medium leading-snug select-none text-foreground/90">
            {item.content}
          </span>
        </div>

        {/* Tags & Meta */}
        <div className="pl-6 flex flex-wrap items-center gap-2">
          {/* Priority Icon */}
          {item.priority !== 'none' && (
            <div title={`Prio: ${item.priority}`}>{getPrioIcon(item.priority)}</div>
          )}

          {/* Due Date Badge */}
          {item.dueDate && (
            <div className={cn(
              "flex items-center gap-1 text-[10px] border px-1.5 py-0.5 rounded-sm font-medium",
              isOverdue ? "text-red-600 bg-red-50 border-red-100" : "text-muted-foreground bg-muted/30 border-transparent"
            )}>
              <Calendar size={10} />
              {format(new Date(item.dueDate), "dd.MM.")}
            </div>
          )}

          {/* Tags */}
          {item.tags.map(t => (
            <span key={t} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm border border-transparent">
              #{t}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// --- LIST ITEM COMPONENT ---
function ListItem({ item, onEdit, onUpdateStatus, isDone }: { item: Item, onEdit: (i: Item) => void, onUpdateStatus: (id: string, status: ItemStatus) => void, isDone?: boolean }) {
  return (
    <div
      onClick={() => onEdit(item)}
      className={cn(
        "group flex items-center gap-4 p-3 rounded-lg border bg-card transition-all hover:shadow-sm hover:border-primary/30 cursor-pointer",
        isDone && "bg-muted/10 opacity-70"
      )}
    >
      {/* Checkbox Action */}
      <div
        onClick={(e) => { e.stopPropagation(); onUpdateStatus(item.id, isDone ? 'todo' : 'done'); }}
        className="text-muted-foreground hover:text-primary transition-colors pt-0.5"
      >
        {isDone ? <CheckCircle2 size={20} className="text-green-600" /> : <Circle size={20} />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-medium truncate", isDone && "line-through text-muted-foreground")}>
            {item.content}
          </span>
          {item.priority !== 'none' && !isDone && getPrioIcon(item.priority)}
        </div>

        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          {item.dueDate && (
            <span className={cn("flex items-center gap-1", isPast(new Date(item.dueDate)) && !isDone ? "text-red-500" : "")}>
              <Clock size={10} /> {format(new Date(item.dueDate), "dd.MM.")}
            </span>
          )}
          {item.tags.length > 0 && (
            <div className="flex gap-1">
              {item.tags.map(t => <span key={t}>#{t}</span>)}
            </div>
          )}
        </div>
      </div>

      {/* Status Badge (in List View) */}
      {item.status === 'in_progress' && (
        <Badge variant="secondary" className="text-[10px] bg-yellow-50 text-yellow-700 hover:bg-yellow-100">In Arbeit</Badge>
      )}
    </div>
  )
}

function KanbanIconPlaceholder() {
  return (
    <div className="flex gap-1 opacity-20">
      <div className="w-4 h-6 bg-current rounded-sm" />
      <div className="w-4 h-4 bg-current rounded-sm mt-2" />
      <div className="w-4 h-5 bg-current rounded-sm" />
    </div>
  )
}