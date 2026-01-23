import { z } from "zod";

export const inputSchema = z.object({
  raw: z.string().min(2, { message: "Bitte mindestens 2 Zeichen eingeben." }).max(500),
});

export const itemSchema = z.object({
  id: z.string(),
  content: z.string().min(1),
  description: z.string().optional(),
  images: z.array(z.string()).default([]),
  type: z.enum(["todo", "note"]),
  status: z.enum(["todo", "in_progress", "done"]),
  isCompleted: z.boolean(),
  createdAt: z.date(),
  tags: z.array(z.string()),
  priority: z.enum(["low", "medium", "high", "none"]),
  dueDate: z.date().nullable(),
});

export type Item = z.infer<typeof itemSchema>;
export type ItemStatus = Item["status"];