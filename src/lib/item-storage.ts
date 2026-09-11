import type { Item } from "./schema";

// Calendar dates remain YYYY-MM-DD strings; timestamps remain instants.
export function itemFromRow(row: Record<string, any>): Item {
  return {
    id: row.id,
    content: row.content,
    description: row.description ?? "",
    type: row.type,
    status: row.status,
    tags: row.tags ?? [],
    images: row.images ?? [],
    priority: row.priority ?? "none",
    createdAt: new Date(row.created_at),
    dueDate: row.due_date ? new Date(row.due_date) : null,
    plannedFor: row.planned_for ?? null,
    focusedOn: row.focused_on ?? null,
    completedAt: row.completed_at ? new Date(row.completed_at) : null,
    nextStep: row.next_step ?? null,
    pinned: row.pinned ?? false,
    waitingFor: row.waiting_for ?? null,
    reviewOn: row.review_on ?? null,
    sourceNoteId: row.source_note_id ?? null,
  };
}

export function itemToRow(item: Partial<Item>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  const fields = {
    content: "content", description: "description", type: "type", status: "status",
    tags: "tags", images: "images", priority: "priority", plannedFor: "planned_for",
    focusedOn: "focused_on", nextStep: "next_step", pinned: "pinned",
    waitingFor: "waiting_for", reviewOn: "review_on", sourceNoteId: "source_note_id",
  } as const;
  for (const [key, column] of Object.entries(fields)) {
    const value = item[key as keyof typeof fields];
    if (value !== undefined) row[column] = value;
  }
  if (item.dueDate !== undefined) row.due_date = item.dueDate?.toISOString() ?? null;
  // completed_at is maintained by the database, including older app clients.
  return row;
}
