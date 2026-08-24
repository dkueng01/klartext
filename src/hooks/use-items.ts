"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useStackApp } from "@stackframe/stack";
import { Item } from "@/lib/schema";
import { ItemService } from "@/services/item-service";
import { useToast } from "@/components/ui/toast";

export function useItems() {
  const app = useStackApp();
  const user = app.useUser(); // Get the currently logged-in user
  const { toast, dismiss } = useToast();

  const [items, setItems] = useState<Item[]>([]);
  const [isLoaded, setIsLoaded] = useState(false); // Controls loading skeletons/spinners
  const [error, setError] = useState<Error | null>(null);
  const itemsRef = useRef<Item[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // --- 1. Fetch Items on Load ---
  useEffect(() => {
    async function loadItems() {
      if (!user) {
        // If no user is logged in, we are technically "loaded" but have no data
        setItems([]);
        setIsLoaded(true);
        return;
      }

      try {
        const data = await ItemService.getAll(user);
        setItems(data);
      } catch (err) {
        console.error("Failed to load items:", err);
        setError(err as Error);
        toast({
          title: "Einträge konnten nicht geladen werden",
          description: "Bitte prüfe deine Verbindung und lade die Seite erneut.",
          variant: "error",
        });
      } finally {
        setIsLoaded(true);
      }
    }

    loadItems();
  }, [user, toast]);

  // --- 2. Add Item (Optimistic) ---
  const addItem = useCallback(async (newItem: Item) => {
    if (!user) return;

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
    } catch (err) {
      console.error("Failed to create item:", err);
      // D. Rollback on failure: Remove the item
      setItems((prev) => prev.filter((item) => item.id !== tempId));
      toast({
        title: "Eintrag wurde nicht gespeichert",
        description: "Deine Eingabe wurde zurückgesetzt. Bitte versuche es erneut.",
        variant: "error",
      });
    }
  }, [user, toast]);

  // --- 3. Update Item (Optimistic) ---
  const updateItem = useCallback(async (updatedItem: Item) => {
    if (!user) return;

    // Snapshot previous state in case we need to rollback
    // (React state updates don't give us easy access to 'previous' outside the setter, 
    // so we assume the UI state was correct before this call)

    setItems((prev) => {
      return prev.map((item) => (item.id === updatedItem.id ? updatedItem : item));
    });

    try {
      await ItemService.update(user, updatedItem.id, updatedItem);
    } catch (err) {
      console.error("Failed to update item:", err);

      // Rollback: Since we don't have the old item easily available here without 
      // passing it in arguments, a safe fallback is to reload the list from server.
      try {
        const freshData = await ItemService.getAll(user);
        setItems(freshData);
      } catch (reloadError) {
        console.error("Failed to reload items after update error:", reloadError);
      }

      toast({
        title: "Änderung wurde nicht gespeichert",
        description: "Der letzte gespeicherte Stand wurde wiederhergestellt.",
        variant: "error",
      });
    }
  }, [user, toast]);

  // --- 4. Delete Item (Optimistic) ---
  const deleteItem = useCallback((id: string) => {
    if (!user) return;

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
    error,
    addItem,
    updateItem,
    deleteItem
  };
}
