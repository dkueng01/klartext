"use client";

import { useState, useEffect, useCallback } from "react";
import { useStackApp } from "@stackframe/stack";
import { Item } from "@/lib/schema";
import { ItemService } from "@/services/item-service";

export function useItems() {
  const app = useStackApp();
  const user = app.useUser(); // Get the currently logged-in user

  const [items, setItems] = useState<Item[]>([]);
  const [isLoaded, setIsLoaded] = useState(false); // Controls loading skeletons/spinners
  const [error, setError] = useState<Error | null>(null);

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
      } finally {
        setIsLoaded(true);
      }
    }

    loadItems();
  }, [user]);

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
      // Optional: Add a toast notification here
    }
  }, [user]);

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
      const freshData = await ItemService.getAll(user);
      setItems(freshData);
    }
  }, [user]);

  // --- 4. Delete Item (Optimistic) ---
  const deleteItem = useCallback(async (id: string) => {
    if (!user) return;

    // A. Optimistic Update
    const previousItems = [...items];
    setItems((prev) => prev.filter((item) => item.id !== id));

    try {
      // B. Server Call
      await ItemService.delete(user, id);
    } catch (err) {
      console.error("Failed to delete item:", err);
      // C. Rollback
      setItems(previousItems);
    }
  }, [items, user]);

  return {
    items,
    isLoaded,
    error,
    addItem,
    updateItem,
    deleteItem
  };
}