"use client";

import { useEffect, useState } from "react";
import { dayKey } from "@/lib/today";

export function useCurrentDay() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const refresh = () => setNow(current => {
      const next = new Date();
      return dayKey(current) === dayKey(next) ? current : next;
    });
    const timer = window.setInterval(refresh, 30_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  return now;
}
