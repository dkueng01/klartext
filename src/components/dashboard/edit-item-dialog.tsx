"use client";

import { useEffect, useState } from "react";
import { Item, ItemStatus } from "@/lib/schema";
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogHeader } from "@/components/ui/dialog"; // DialogHeader/Title importieren
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Calendar as CalendarIcon, Flag, Clock, Tag } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface EditItemDialogProps {
  item: Item | null;
  open: boolean;
  onClose: () => void;
  onSave: (item: Item) => void;
  onDelete: (id: string) => void;
}

export function EditItemDialog({ item, open, onClose, onSave, onDelete }: EditItemDialogProps) {
  const [formData, setFormData] = useState<Item | null>(null);

  useEffect(() => {
    if (item) {
      setFormData({ ...item });
    }
  }, [item]);

  const handleSave = () => {
    if (formData) {
      onSave(formData);
      onClose();
    }
  };

  const handleDelete = () => {
    if (formData) {
      onDelete(formData.id);
      onClose();
    }
  };

  // Helper für Prio Farben
  const getPrioColor = (prio: string) => {
    switch (prio) {
      case 'high': return 'text-red-600 bg-red-50 hover:bg-red-100 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 hover:bg-orange-100 border-orange-200';
      case 'low': return 'text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-200';
      default: return 'text-muted-foreground bg-background';
    }
  };

  if (!formData) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden block">

        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center justify-start gap-2">
            <Badge variant={formData.type === 'todo' ? 'default' : 'secondary'} className="uppercase text-[10px] tracking-wider font-semibold">
              {formData.type}
            </Badge>
            <DialogTitle className="text-sm font-normal text-muted-foreground flex items-center gap-2">
              <Clock size={14} />
              {formData.createdAt && format(new Date(formData.createdAt), "d. MMMM yyyy, HH:mm", { locale: de })}
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* MAIN CONTENT AREA */}
        <div className="px-6 pb-6">

          {/* 1. RIESIGER TITEL (Wie in Notion) */}
          <div className="my-4">
            <Input
              className="text-2xl font-bold border-0 px-0 shadow-none focus-visible:ring-0 h-auto placeholder:text-muted-foreground/40 bg-transparent"
              value={formData.content}
              placeholder="Titel der Aufgabe..."
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
          </div>

          {/* 2. META DATEN BLOCK (Grauer Hintergrund) */}
          <div className="bg-muted/30 rounded-xl p-4 border grid grid-cols-2 gap-4 mb-6">

            {/* Linke Spalte: Status (nur Todo) oder Tags */}
            <div className="space-y-3">
              {formData.type === 'todo' && (
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 block">Status</label>
                  <Select
                    value={formData.status}
                    onValueChange={(val: any) =>
                      setFormData({ ...formData, status: val, isCompleted: val === 'done' })
                    }
                  >
                    <SelectTrigger className="h-8 bg-background text-xs w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">Zu erledigen</SelectItem>
                      <SelectItem value="in_progress">In Arbeit</SelectItem>
                      <SelectItem value="done">Erledigt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Tags hier rein, wenn Platz ist */}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 block flex items-center gap-1">
                  <Tag size={10} /> Projekte / Tags
                </label>
                {formData.tags.length > 0 ? (
                  <div className="flex gap-1.5 flex-wrap">
                    {formData.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="font-normal text-[10px] px-2 bg-background">#{tag}</Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground italic pl-1">Keine Tags</span>
                )}
              </div>
            </div>

            {/* Rechte Spalte: Prio & Datum */}
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 block">Priorität</label>
                <Select
                  value={formData.priority}
                  onValueChange={(val: any) => setFormData({ ...formData, priority: val })}
                >
                  <SelectTrigger className={`h-8 text-xs w-full ${getPrioColor(formData.priority)}`}>
                    <div className="flex items-center gap-2">
                      <Flag size={12} />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Keine</SelectItem>
                    <SelectItem value="low">Niedrig</SelectItem>
                    <SelectItem value="medium">Mittel</SelectItem>
                    <SelectItem value="high">Hoch</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.dueDate && (
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 block">Fällig am</label>
                  <div className="flex items-center h-8 px-3 border rounded-md text-xs bg-background text-foreground">
                    <CalendarIcon size={12} className="mr-2 text-muted-foreground" />
                    {format(new Date(formData.dueDate), "dd.MM.yyyy")}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. BESCHREIBUNG (Clean) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Beschreibung</label>
            <Textarea
              className="min-h-[150px] resize-none border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 text-sm leading-relaxed"
              placeholder="Schreibe hier deine Notizen..."
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </div>

        {/* FOOTER */}
        <DialogFooter className="px-6 py-3 bg-muted/20 border-t flex sm:justify-between items-center w-full">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-muted-foreground hover:text-red-600 hover:bg-red-50 h-8 px-2 text-xs"
          >
            <Trash2 size={14} className="mr-2" />
            Löschen
          </Button>

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8">Abbrechen</Button>
            <Button onClick={handleSave} size="sm" className="h-8">Speichern</Button>
          </div>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}