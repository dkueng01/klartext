"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function useUrlFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Aktuelle Filter auslesen
  const activeTag = searchParams.get("tag");
  const activePrio = searchParams.get("prio");
  const activeDate = searchParams.get("date"); // 'today', 'overdue', 'upcoming'

  // Filter setzen (Update URL ohne Reload)
  const setFilter = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  // Alle Filter löschen
  const clearFilters = useCallback(() => {
    router.push("?", { scroll: false });
  }, [router]);

  return {
    activeTag,
    activePrio,
    activeDate,
    setFilter,
    clearFilters,
    hasFilters: !!activeTag || !!activePrio || !!activeDate
  };
}