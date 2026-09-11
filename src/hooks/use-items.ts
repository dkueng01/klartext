"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useStackApp } from "@stackframe/stack";
import { Item } from "@/lib/schema";
import { ItemService } from "@/services/item-service";
import { useToast } from "@/components/ui/toast";
import { TASK_COMPLETED_EVENT } from "@/lib/events";

export function useItems() {
  const app = useStackApp();
  const user = app.useUser(); // Get the currently logged-in user
  const { toast, dismiss } = useToast();

  const [items, setItems] = useState<Item[]>([]);
  const [isLoaded, setIsLoaded] = useState(false); // Controls loading skeletons/spinners
  const [error, setError] = useState<Error | null>(null);
  const itemsRef = useRef<Item[]>([]);
  const busyRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // --- 1. Fetch Items on Load ---
  useEffect(() => {
    let active = true;
    async function loadItems() {
      if (!user) {
        // If no user is logged in, we are technically "loaded" but have no data
        setItems([]);
        setIsLoaded(true);
        return;
      }

      try {
        const data = await ItemService.getAll(user);
        if (!active) return;
        setItems(data);
        setError(null);
      } catch (err) {
        if (!active) return;
        console.error("Failed to load items:", err);
        setError(err as Error);
        toast({
          title: "Einträge konnten nicht geladen werden",
          description: "Bitte prüfe deine Verbindung und lade die Seite erneut.",
          variant: "error",
        });
      } finally {
        if (active) setIsLoaded(true);
      }
    }

    loadItems();
    return () => { active = false; };
  }, [user, toast]);

  // --- 2. Add Item (Optimistic) ---
  const addItem = useCallback(async (newItem: Item) => {
    if (!user || busyRef.current) return;
    busyRef.current = true;
    setIsSaving(true);

    // A. Optimistic Update: Add to UI immediately with the temporary ID
    const tempId = newItem.id;
    setItems((prev) => [newItem, ...prev]);

    try {
      // B. Server Call
      const createdItem = await ItemService.create(user, newItem);

      // C. Reconcile: Swap the temporary item with the real database item (real UUID)
      setItems((prev) =>
        prev.map((item) => (item.id === tempId ? createdItem : item))
      );
      return createdItem;
    } catch (err) {
      console.error("Failed to create item:", err);
      // D. Rollback on failure: Remove the item
      setItems((prev) => prev.filter((item) => item.id !== tempId));
      toast({
        title: "Eintrag wurde nicht gespeichert",
        description: "Bitte versuche es erneut.",
        variant: "error",
      });
    } finally {
      busyRef.current = false;
      setIsSaving(false);
    }
  }, [user, toast]);

  // --- 3. Update Item (Optimistic) ---
  const updateItem = useCallback(async (updatedItem: Item) => {
    if (!user) return false;
    if (busyRef.current) {
      toast({ title: "Eine Änderung wird noch gespeichert", description: "Bitte versuche es gleich noch einmal." });
      return false;
    }
    busyRef.current = true;
    setIsSaving(true);

    const previousItem = itemsRef.current.find((item) => item.id === updatedItem.id);
    const wasJustCompleted =
      previousItem?.type === "todo" &&
      previousItem.status !== "done" &&
      updatedItem.status === "done";

    const optimisticItem = {
      ...updatedItem,
      completedAt: updatedItem.type === "todo" && updatedItem.status === "done"
        ? (wasJustCompleted ? new Date() : previousItem?.completedAt) : null,
      focusedOn: updatedItem.type === "note" || updatedItem.status === "done" || updatedItem.waitingFor
        || updatedItem.plannedFor !== updatedItem.focusedOn ? null : updatedItem.focusedOn,
    };

    setItems((prev) => {
      return prev.map((item) => (item.id === updatedItem.id ? optimisticItem : item));
    });

    try {
      const saved = await ItemService.update(user, updatedItem.id, updatedItem);
      setItems(prev => prev.map(item => item.id === saved.id ? saved : item));
      if (wasJustCompleted) document.dispatchEvent(new CustomEvent(TASK_COMPLETED_EVENT));
      return true;
    } catch (err) {
      console.error("Failed to update item:", JSON.stringify(err));

      // Prefer the authoritative server state after an uncertain response.
      try {
        const freshData = await ItemService.getAll(user);
        setItems(freshData);
      } catch (reloadError) {
        console.error("Failed to reload items after update error:", reloadError);
        if (previousItem) setItems(prev => prev.map(item => item.id === previousItem.id ? previousItem : item));
      }

      toast({
        title: "Änderung wurde nicht gespeichert",
        description: "Der letzte gespeicherte Stand wurde wiederhergestellt.",
        variant: "error",
      });
      return false;
    } finally {
      busyRef.current = false;
      setIsSaving(false);
    }
  }, [user, toast]);

  const patchItem = useCallback((id: string, patch: Partial<Item>) => {
    const current = itemsRef.current.find(item => item.id === id);
    return current ? updateItem({ ...current, ...patch }) : Promise.resolve(false);
  }, [updateItem]);

  const focusItem = useCallback(async (id: string, day: string) => {
    if (!user || busyRef.current) return false;
    busyRef.current = true;
    setIsSaving(true);
    const previous = itemsRef.current;
    setItems(current => current.map(item => item.id === id
      ? { ...item, focusedOn: day, plannedFor: day, status: "in_progress" }
      : { ...item, focusedOn: null }));
    try {
      const changed = await ItemService.focus(user, id, day);
      setItems(current => current.map(item => changed.find(saved => saved.id === item.id) ?? item));
      return true;
    } catch (err) {
      console.error("Failed to set focus:", JSON.stringify(err));
      try { setItems(await ItemService.getAll(user)); } catch { setItems(previous); }
      toast({ title: "Fokus wurde nicht gespeichert", description: "Bitte versuche es erneut.", variant: "error" });
      return false;
    } finally {
      busyRef.current = false;
      setIsSaving(false);
    }
  }, [user, toast]);

  // --- 4. Delete Item (Optimistic) ---
  const deleteItem = useCallback((id: string) => {
    if (!user) return;
    if (busyRef.current) {
      toast({ title: "Eine Änderung wird noch gespeichert", description: "Bitte versuche es gleich noch einmal." });
      return;
    }

    const previousItems = itemsRef.current;
    const deletedIndex = previousItems.findIndex((item) => item.id === id);
    const deletedItem = previousItems[deletedIndex];
    if (!deletedItem) return;

    const restoreLocally = (item: Item) => {
      setItems((current) => {
        if (current.some((existing) => existing.id === item.id)) return current;
        const restored = [...current];
        restored.splice(Math.min(deletedIndex, restored.length), 0, item);
        return restored;
      });
    };

    // A. Optimistic Update
    setItems((prev) => prev.filter((item) => item.id !== id));

    let toastId = "";
    const deletion = ItemService.delete(user, id)
      .then(() => true)
      .catch((err) => {
        console.error("Failed to delete item:", err);
        restoreLocally(deletedItem);
        if (toastId) dismiss(toastId);
        toast({
          title: "Eintrag konnte nicht gelöscht werden",
          description: "Der Eintrag wurde wiederhergestellt.",
          variant: "error",
        });
        return false;
      });

    const undoDelete = async () => {
      const wasDeleted = await deletion;
      if (!wasDeleted) return;

      try {
        const restoredItem = await ItemService.restore(user, deletedItem);
        restoreLocally(restoredItem);
        toast({
          title: "Löschen rückgängig gemacht",
          variant: "success",
        });
      } catch (err) {
        console.error("Failed to restore item:", err);
        toast({
          title: "Eintrag konnte nicht wiederhergestellt werden",
          description: "Bitte lade die Seite neu und versuche es erneut.",
          variant: "error",
        });
      }
    };

    toastId = toast({
      title: "Eintrag gelöscht",
      description: "Du kannst diese Aktion für kurze Zeit rückgängig machen.",
      action: {
        label: "Rückgängig",
        onClick: undoDelete,
      },
      duration: 8000,
    });
  }, [dismiss, toast, user]);

  return {
    items,
    isLoaded,
    isSaving,
    error,
    addItem,
    updateItem,
    patchItem,
    focusItem,
    deleteItem
  };
}
