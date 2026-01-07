"use client";

import { Item } from "@/lib/schema";
import { format, isSameDay } from "date-fns";
import { de } from "date-fns/locale";
import { CheckCircle2, Circle, StickyNote, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface JournalViewProps {
  items: Item[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (item: Item) => void;
  onTagClick: (tag: string) => void;
}

export function JournalView({ items, onToggle, onDelete, onEdit, onTagClick }: JournalViewProps) {
  if (items.length === 0) return <div className="text-center text-muted-foreground mt-10">Keine Einträge.</div>;

  return (
    <ScrollArea className="h-full p-4">
      <div className="space-y-3 pb-10">
        {items.map((item, index) => {
          const isToday = isSameDay(item.createdAt, new Date());
          const prevItem = items[index - 1];
          const showSeparator = !prevItem || !isSameDay(item.createdAt, prevItem.createdAt);

          return (
            <div key={item.id}>
              {showSeparator && (
                <div className="flex items-center py-6">
                  <div className="flex-grow h-px bg-border/60"></div>
                  <span className="flex-shrink-0 mx-4 text-xs font-medium text-muted-foreground bg-background/50 px-3 py-1 rounded-full border shadow-sm">
                    {isToday ? "Heute" : format(item.createdAt, "EEEE, d. MMMM", { locale: de })}
                  </span>
                  <div className="flex-grow h-px bg-border/60"></div>
                </div>
              )}
              <div
                onClick={() => onEdit(item)}
                className="group cursor-pointer relative bg-background border rounded-lg p-3 shadow-sm hover:shadow-md hover:border-primary/40 transition-all"
              >
                <button onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="absolute right-2 top-2 text-muted-foreground/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>

                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {item.type === 'todo' ? (
                      <div onClick={(e) => { e.stopPropagation(); onToggle(item.id); }}>
                        {item.status === 'done'
                          ? <CheckCircle2 size={18} className="text-green-600" />
                          : <Circle size={18} className="text-muted-foreground hover:text-primary" />
                        }
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-orange-100 flex items-center justify-center"><StickyNote size={10} className="text-orange-500" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`block text-sm font-medium truncate ${item.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {item.content}
                    </span>
                    {item.description && <p className="text-xs text-muted-foreground mt-1 truncate">{item.description}</p>}

                    <div className="flex gap-2 mt-2 flex-wrap items-center">
                      <span className="text-[10px] text-muted-foreground font-mono">{format(item.createdAt, "HH:mm")}</span>
                      {item.tags.map(tag => (
                        <span
                          key={tag}
                          onClick={(e) => { e.stopPropagation(); onTagClick(tag); }}
                          className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 hover:bg-blue-100"
                        >#{tag}</span>
                      ))}
                      {item.status === 'in_progress' && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 rounded">In Arbeit</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}