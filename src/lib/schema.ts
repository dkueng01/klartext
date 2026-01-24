import { z } from "zod";

export const inputSchema = z.object({
  raw: z.string().min(2, { message: "Bitte mindestens 2 Zeichen eingeben." }).max(500),
});

// Base schema parts for reuse
const itemBase = {
  content: z.string().trim().min(1, "Der Titel darf nicht leer sein.").max(500, "Der Titel ist zu lang (max. 500 Zeichen)."),
  description: z.string().optional(),
  images: z.array(z.string()).default([]),
  type: z.enum(["todo", "note"]),
  status: z.enum(["todo", "in_progress", "done"]),
  isCompleted: z.boolean(),
  tags: z.array(z.string()),
  priority: z.enum(["low", "medium", "high", "none"]),
  dueDate: z.date().nullable(),
};

export const itemSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  ...itemBase
});

// Schema for creating a new item (some fields are optional/defaulted by logic, but content is strict)
export const createItemSchema = z.object({
  ...itemBase,
  // Overrides if needed, e.g. status might be optional in some contexts, but here we enforce what we expect
}).partial({
  // Allow these to be omitted during creation if the service sets defaults
  status: true,
  isCompleted: true,
  tags: true,
  priority: true,
  dueDate: true,
  images: true,
  type: true
}).refine((data) => !!data.content, { message: "Content is required" });

// Schema for updating an item (all fields optional, but if present must be valid)
export const updateItemSchema = z.object(itemBase).partial();

export type Item = z.infer<typeof itemSchema>;
export type ItemStatus = Item["status"];