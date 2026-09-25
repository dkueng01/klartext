import type { Item } from "./schema";
import { format } from "date-fns";

export function calendarItemsForDay(items: Item[], day: string, tag: string | null = null): Item[] {
  return items.filter(item => item.type === "todo" && item.status !== "done"
    && (!tag || item.tags.includes(tag))
    && (item.plannedFor === day || (item.dueDate && format(item.dueDate, "yyyy-MM-dd") === day)
      || (item.waitingFor && item.reviewOn === day)));
}
