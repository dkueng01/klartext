"use client";

import { Item } from "@/lib/schema";
import { format, isSameDay } from "date-fns";
import { de } from "date-fns/locale";
import { CheckCircle2, Circle, StickyNote, Trash2, Calendar, Flag, ImageIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface JournalViewProps {
  items: Item[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (item: Item) => void;
  onTagClick: (tag: string) => void;
}

export function JournalView({ items, onToggle, onDelete, onEdit, onTagClick }: JournalViewProps) {
  const [viewerState, setViewerState] = useState<{ open: boolean, images: string[], index: number }>({
    open: false, images: [], index: 0
  });

  if (items.length === 0) return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
      <StickyNote className="w-10 h-10 mb-2" />
      <p className="text-sm">Keine Einträge.</p>
    </div>
  );

  const getPrioIcon = (prio: string) => {
    switch (prio) {
      case 'high': return <Flag size={10} className="text-red-600 fill-red-100" />;
      case 'medium': return <Flag size={10} className="text-orange-500" />;
      case 'low': return <Flag size={10} className="text-blue-500" />;
      default: return null;
    }
  };

  return (
    <ScrollArea className="h-full px-2 w-full">
      <div className="pb-10 pt-2 space-y-2 max-w-full">
        {items.map((item, index) => {
          const isToday = isSameDay(item.createdAt, new Date());
          const prevItem = items[index - 1];
          const showSeparator = !prevItem || !isSameDay(item.createdAt, prevItem.createdAt);

          return (
            <div key={item.id} className="w-full max-w-full">

              {showSeparator && (
                <div className="sticky top-0 z-10 py-3 flex items-center justify-center pointer-events-none">
                  <div className="bg-background/95 border shadow-sm px-3 py-0.5 rounded-full flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                    {isToday ? "Heute" : format(item.createdAt, "EEE, d. MMM", { locale: de })}
                  </div>
                </div>
              )}

              <div
                onClick={() => onEdit(item)}
                className={cn(
                  "group relative flex items-start gap-3 p-3 rounded-lg border bg-card transition-all duration-200",
                  "hover:border-primary/30 cursor-pointer w-full max-w-full overflow-hidden",
                  item.status === 'done' && "opacity-60 bg-muted/20 border-transparent"
                )}
              >

                <div className="pt-0.5 shrink-0">
                  {item.type === 'todo' ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggle(item.id); }}
                      className="text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                    >
                      {item.status === 'done'
                        ? <CheckCircle2 size={18} className="text-green-600" />
                        : <Circle size={18} strokeWidth={2} />
                      }
                    </button>
                  ) : (
                    <StickyNote size={18} className="text-orange-400 mt-0.5" />
                  )}
                </div>

                <div className="flex-1 min-w-0 grid gap-1">

                  <div className="pr-6">
                    <span className={cn(
                      "text-sm font-medium leading-tight block truncate",
                      item.status === 'done' && "line-through text-muted-foreground"
                    )} title={item.content}>
                      {item.content}
                    </span>
                  </div>

                  {item.description && (
                    <p className="text-[11px] text-muted-foreground truncate">
                      {item.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 mt-0.5">

                    <span className="text-[10px] text-muted-foreground/50 font-mono shrink-0">
                      {format(item.createdAt, "HH:mm")}
                    </span>

                    {item.tags.map(tag => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        onClick={(e) => { e.stopPropagation(); onTagClick(tag); }}
                        className="text-[9px] px-1 h-4 font-normal text-muted-foreground bg-muted hover:text-primary hover:bg-primary/10 border-0 cursor-pointer shrink-0"
                      >
                        #{tag}
                      </Badge>
                    ))}

                    {item.priority !== 'none' && !item.isCompleted && (
                      <div className="flex items-center shrink-0">
                        {getPrioIcon(item.priority)}
                      </div>
                    )}

                    {item.dueDate && !item.isCompleted && (
                      <span className={cn(
                        "flex items-center gap-0.5 text-[9px] px-1 rounded border shrink-0",
                        new Date(item.dueDate) < new Date() ? "text-red-600 bg-red-50 border-red-100" : "text-green-600 bg-green-50 border-green-100"
                      )}>
                        <Calendar size={8} />
                        {format(new Date(item.dueDate), "dd.MM")}
                      </span>
                    )}

                    {item.images && item.images.length > 0 && (
                      <Badge variant="secondary" className="px-1.5 h-4 font-normal text-[9px] text-muted-foreground bg-muted hover:bg-primary/10 border-0 flex items-center gap-1 shrink-0">
                        <ImageIcon size={10} />
                        {item.images.length}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}