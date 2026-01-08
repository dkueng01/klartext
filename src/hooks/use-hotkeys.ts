"use client";

import { useEffect } from "react";

export function useHotkeys(key: string, callback: () => void, ctrlKey = true) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const modifier = ctrlKey ? (e.ctrlKey || e.metaKey) : true;

      if (e.key.toLowerCase() === key.toLowerCase() && modifier) {
        e.preventDefault();
        callback();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [key, callback, ctrlKey]);
}