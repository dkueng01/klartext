"use client";

import { useEffect, useState } from "react";
import { Item } from "@/lib/schema";
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Trash2, Calendar as CalendarIcon, Flag, Clock, Plus, X, Circle, Hash, ImageIcon, ExternalLink, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ImageUpload } from "../ui/image-upload";
import { deleteImageFromCloudinary } from "@/actions/cloudinary";

interface EditItemDialogProps {
  item: Item | null;
  open: boolean;
  onClose: () => void;
  onSave: (item: Item) => void;
  onDelete: (id: string) => void;
}

export function EditItemDialog({ item, open, onClose, onSave, onDelete }: EditItemDialogProps) {
  const [formData, setFormData] = useState<Item | null>(null);
  const [newTag, setNewTag] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const [deletingImages, setDeletingImages] = useState<string[]>([]);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Error state for validation
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setFormData({ ...item });
      setError(null); // Reset error when opening
    }
  }, [item]);

  const handleSave = () => {
    if (formData) {
      if (!formData.content.trim()) {
        setError("Der Titel darf nicht leer sein.");
        return;
      }
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

  const addTag = () => {
    if (newTag.trim() && formData) {
      const tag = newTag.replace("#", "").trim();
      if (!formData.tags.includes(tag)) {
        setFormData({ ...formData, tags: [...formData.tags, tag] });
      }
      setNewTag("");
      setShowTagInput(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    if (formData) {
      setFormData({ ...formData, tags: formData.tags.filter(t => t !== tagToRemove) });
    }
  };

  const handleImageUpload = (newUrl: string) => {
    if (!formData) return;

    const updatedImages = [...formData.images, newUrl];
    const updatedItem = { ...formData, images: updatedImages };

    // 1. UI Update sofort
    setFormData(updatedItem);

    // 2. DB Update sofort (Auto-Save)
    onSave(updatedItem);
  };

  const handleRemoveImage = async (urlToRemove: string) => {
    if (!formData) return;
    setIsProcessingImage(true);

    try {
      // 1. Cloudinary Delete aufrufen (Server Action)
      await deleteImageFromCloudinary(urlToRemove);

      // 2. Lokalen State berechnen
      const updatedImages = formData.images.filter(url => url !== urlToRemove);
      const updatedItem = { ...formData, images: updatedImages };

      // 3. Aus Form State entfernen
      setFormData(updatedItem);

      // 4. DB Update sofort (Auto-Save)
      onSave(updatedItem);
    } catch (error) {
      console.error("Fehler beim Löschen des Bildes:", error);
      alert("Bild konnte nicht vollständig gelöscht werden.");
    } finally {
      setIsProcessingImage(false);
    }
  };

  const getPrioColor = (prio: string) => {
    switch (prio) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-orange-600';
      case 'low': return 'text-blue-600';
      default: return 'text-muted-foreground';
    }
  };

  if (!formData) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] p-0 gap-0 overflow-hidden flex flex-col outline-none">

        {/* HEADER - No changes needed, shrink-0 prevents it from collapsing */}
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <div className="flex items-center justify-start gap-2">
            <Badge variant={formData.type === 'todo' ? 'default' : 'secondary'} className="uppercase text-[10px] tracking-wider font-semibold">
              {formData.type}
            </Badge>
            <DialogTitle className="text-xs font-normal text-muted-foreground flex items-center gap-2">
              <Clock size={12} />
              {formData.createdAt && format(new Date(formData.createdAt), "d. MMM yyyy, HH:mm", { locale: de })}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden overflow-y-auto relative flex flex-col">
          <div className="px-6 pb-6">

            {/* TITLE */}
            <div className="my-3">
              <Input
                className="text-xl font-bold border-0 px-0 shadow-none focus-visible:ring-0 h-auto bg-transparent"
                value={formData.content}
                placeholder="Titel..."
                onChange={(e) => {
                  setFormData({ ...formData, content: e.target.value });
                  if (error) setError(null); // Clear error on change
                }}
              />
              {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
            </div>

            {/* PROPERTIES LIST */}
            <div className="space-y-1 mb-6">
              {/* Status */}
              {formData.type === 'todo' && (
                <div className="flex items-center h-9">
                  <div className="w-[120px] flex items-center gap-2 text-muted-foreground text-xs font-medium"><Circle size={14} /> Status</div>
                  <div className="flex-1">
                    <Select value={formData.status} onValueChange={(val: any) => setFormData({ ...formData, status: val, isCompleted: val === 'done' })}>
                      <SelectTrigger className="h-7 w-auto min-w-[140px] border-0 shadow-none hover:bg-muted/50 px-2 text-xs -ml-2"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">Zu erledigen</SelectItem>
                        <SelectItem value="in_progress">In Arbeit</SelectItem>
                        <SelectItem value="done">Erledigt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Priority */}
              <div className="flex items-center h-9">
                <div className="w-[120px] flex items-center gap-2 text-muted-foreground text-xs font-medium"><Flag size={14} /> Priorität</div>
                <div className="flex-1">
                  <Select value={formData.priority} onValueChange={(val: any) => setFormData({ ...formData, priority: val })}>
                    <SelectTrigger className={cn("h-7 w-auto min-w-[140px] border-0 shadow-none hover:bg-muted/50 px-2 text-xs -ml-2", getPrioColor(formData.priority))}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Keine</SelectItem>
                      <SelectItem value="low">Niedrig</SelectItem>
                      <SelectItem value="medium">Mittel</SelectItem>
                      <SelectItem value="high">Hoch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-center h-9">
                <div className="w-[120px] flex items-center gap-2 text-muted-foreground text-xs font-medium"><CalendarIcon size={14} /> Datum</div>
                <div className="flex-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant={"ghost"} className={cn("h-7 w-auto min-w-[140px] justify-start text-left font-normal text-xs px-2 -ml-2 hover:bg-muted/50", !formData.dueDate && "text-muted-foreground")}>
                        {formData.dueDate ? format(new Date(formData.dueDate), "PPP", { locale: de }) : <span>Kein Datum</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={formData.dueDate ? new Date(formData.dueDate) : undefined} onSelect={(date) => setFormData({ ...formData, dueDate: date || null })} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Tags */}
              <div className="flex items-center min-h-[36px] py-1">
                <div className="w-[120px] flex items-center gap-2 text-muted-foreground text-xs font-medium self-start pt-1.5"><Hash size={14} /> Tags</div>
                <div className="flex-1 flex flex-wrap gap-1.5 items-center">
                  {formData.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="pl-2 pr-1 h-6 font-normal text-xs flex items-center gap-1 bg-muted hover:bg-muted/80">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="text-muted-foreground hover:text-red-500 rounded-full p-0.5 ml-0.5"><X size={10} /></button>
                    </Badge>
                  ))}
                  {showTagInput ? (
                    <Input autoFocus className="h-6 w-24 text-xs" placeholder="Tag..." value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addTag(); if (e.key === 'Escape') setShowTagInput(false); }} onBlur={addTag} />
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => setShowTagInput(true)} className="h-6 w-6 p-0 text-muted-foreground hover:text-primary rounded-full"><Plus size={14} /></Button>
                  )}
                </div>
              </div>
            </div>

            {/* DESCRIPTION */}
            <div className="space-y-2 pt-4 border-t">
              <Textarea
                className="min-h-[150px] resize-none border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 text-sm leading-relaxed"
                placeholder="Notizen hinzufügen..."
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* IMAGES & UPLOAD */}
            <div className="mt-4 border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
                  <ImageIcon size={12} /> Anhänge ({formData.images?.length || 0})
                </label>
                {isProcessingImage && <Loader2 size={12} className="animate-spin text-muted-foreground" />}
              </div>

              <div className="space-y-3">
                {/* Gallery */}
                {formData.images && formData.images.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.images.map((url) => {
                      return (
                        <div key={url} className={cn("relative w-16 h-16 rounded-md overflow-hidden border bg-muted group", isProcessingImage && "opacity-50 pointer-events-none")}>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemoveImage(url); }}
                            className="absolute top-0.5 right-0.5 z-10 bg-black/60 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all"
                          >
                            <X size={10} />
                          </button>
                          <a href={url} target="_blank" rel="noopener noreferrer" className="block w-full h-full cursor-pointer relative">
                            <img src={url} alt="Attachment" className="object-cover w-full h-full hover:opacity-80 transition-opacity" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                              <ExternalLink size={12} className="text-white drop-shadow-md" />
                            </div>
                          </a>
                        </div>
                      )
                    })}
                  </div>
                )}

                <ImageUpload
                  disabled={isProcessingImage}
                  onUpload={handleImageUpload}
                />
              </div>
            </div>

          </div>
        </div>

        {/* FOOTER */}
        <DialogFooter className="px-6 py-3 bg-muted/20 border-t flex sm:justify-between items-center w-full shrink-0">
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
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 text-xs">Abbrechen</Button>
            <Button onClick={handleSave} size="sm" className="h-8 text-xs">Fertig</Button>
          </div>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}