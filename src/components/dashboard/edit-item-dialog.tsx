"use client";

import { useEffect, useState } from "react";
import { Item, ItemStatus } from "@/lib/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";

interface EditItemDialogProps {
  item: Item | null;
  open: boolean;
  onClose: () => void;
  onSave: (item: Item) => void;
  onDelete: (id: string) => void;
}

export function EditItemDialog({ item, open, onClose, onSave, onDelete }: EditItemDialogProps) {
  const [formData, setFormData] = useState<Item | null>(null);

  // Sync state with props when modal opens
  useEffect(() => {
    if (item) {
      setFormData({ ...item });
    }
  }, [item]);

  const handleSave = () => {
    if (formData) {
      onSave(formData);
    }
  };

  const handleDelete = () => {
    if (formData) {
      onDelete(formData.id);
    }
  };

  if (!formData) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center pr-4">
            <span>Details bearbeiten</span>
            <div className="flex gap-2 items-center">
              <Badge variant="outline">{formData.type.toUpperCase()}</Badge>
              <button onClick={handleDelete} className="text-muted-foreground hover:text-red-500 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Titel */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Titel</label>
            <Input
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
          </div>

          {/* Status (Nur für Todos sichtbar) */}
          {formData.type === 'todo' && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select
                value={formData.status}
                onValueChange={(val: ItemStatus) =>
                  setFormData({ ...formData, status: val, isCompleted: val === 'done' })
                }
              >
                <SelectTrigger>
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

          {/* Beschreibung */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Beschreibung / Notizen</label>
            <Textarea
              className="min-h-[150px] resize-none"
              placeholder="Füge hier Details hinzu..."
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Tags (Read-only Anzeige, könnte man später editierbar machen) */}
          {formData.tags.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Tags</label>
              <div className="flex gap-1 flex-wrap">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="font-normal text-xs">#{tag}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Abbrechen</Button>
          <Button onClick={handleSave}>Speichern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}