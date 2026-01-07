"use client";

import { useState, useEffect } from "react";
import { Item } from "@/lib/schema";

export function useItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("klartext-data");
    if (saved) {
      try {
        const parsed = JSON.parse(saved).map((i: any) => ({
          ...i,
          createdAt: new Date(i.createdAt),
          dueDate: i.dueDate ? new Date(i.dueDate) : null,
          status: i.status || (i.isCompleted ? "done" : "todo"),
          tags: i.tags || [],
          priority: i.priority || "none",
          type: i.type || "note",
          description: i.description || ""
        }));
        setItems(parsed);
      } catch (e) { setItems([]); }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) localStorage.setItem("klartext-data", JSON.stringify(items));
  }, [items, isLoaded]);

  // Actions
  const addItem = (item: Item) => setItems([item, ...items]);
  const updateItem = (updated: Item) => setItems(items.map(i => i.id === updated.id ? updated : i));
  const deleteItem = (id: string) => setItems(items.filter(i => i.id !== id));

  return { items, isLoaded, addItem, updateItem, deleteItem };
}