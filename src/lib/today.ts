import { addDays, format, isSameDay, startOfDay } from "date-fns";
import type { Item } from "./schema";

export function dayKey(date: Date): string { return format(date, "yyyy-MM-dd"); }

export function descriptionPreview(item: Item): string {
  return (item.description ?? "").split(/\r?\n/)
    .map(line => line.trim().replace(/^[-*]\s+|^\d+[.)]\s+/, ""))
    .find(line => line && !/^https?:\/\/|^[{\[}\]]/.test(line)) ?? "";
}

const weight: Record<Item["priority"], number> = { high: 3, medium: 2, low: 1, none: 0 };
export function sortTasks(a: Item, b: Item): number {
  return Number(b.status === "in_progress") - Number(a.status === "in_progress")
    || weight[b.priority] - weight[a.priority]
    || (a.dueDate?.getTime() ?? Infinity) - (b.dueDate?.getTime() ?? Infinity)
    || b.createdAt.getTime() - a.createdAt.getTime();
}

export function selectToday(items: Item[], now: Date, tag: string | null = null) {
  const today = dayKey(now);
  const matches = (item: Item) => !tag || item.tags.includes(tag);
  const tasks = items.filter(item => item.type === "todo");
  const open = tasks.filter(item => item.status !== "done");
  const available = open.filter(item => !item.waitingFor);
  const planned = tasks.filter(item => item.plannedFor === today);
  const visiblePlan = planned.filter(matches);
  const focus = available.find(item => item.focusedOn === today && item.plannedFor === today) ?? null;
  const dueToday = open.filter(item => item.dueDate && isSameDay(item.dueDate, now)).filter(matches).sort(sortTasks);
  const overdue = open.filter(item => item.dueDate && item.dueDate < startOfDay(now)).filter(matches)
    .sort((a, b) => a.dueDate!.getTime() - b.dueDate!.getTime());
  const carryOver = available.filter(item => item.plannedFor && item.plannedFor < today).filter(matches).sort(sortTasks);
  const suggestions = available.filter(item => matches(item)
    && !item.plannedFor
    && (!item.dueDate || !isSameDay(item.dueDate, now) && item.dueDate > startOfDay(now) && item.dueDate <= addDays(startOfDay(now), 14)))
    .sort(sortTasks);
  const nextDate = (item: Item) => [item.plannedFor, item.dueDate && dayKey(item.dueDate)]
    .filter((date): date is string => !!date && date > today).sort()[0];
  const upcoming = open.filter(item => matches(item) && (
    item.plannedFor && item.plannedFor > today
    || item.dueDate && item.dueDate >= addDays(startOfDay(now), 1)
  )).sort((a, b) => nextDate(a).localeCompare(nextDate(b)) || sortTasks(a, b));
  const completed = tasks.filter(item => item.status === "done" && item.completedAt && isSameDay(item.completedAt, now))
    .filter(matches).sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime());
  const notes = items.filter(item => item.type === "note" && matches(item))
    .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.createdAt.getTime() - a.createdAt.getTime());
  const waiting = open.filter(item => item.waitingFor && matches(item))
    .sort((a, b) => (a.reviewOn ?? "9999").localeCompare(b.reviewOn ?? "9999"));
  return { today, focus, planned: visiblePlan, openPlan: visiblePlan.filter(item => item.status !== "done" && !item.waitingFor),
    completed, completedPlanCount: visiblePlan.filter(item => item.status === "done").length,
    dueToday, overdue, carryOver, suggestions, upcoming, notes, waiting,
    openCount: open.filter(matches).length };
}
