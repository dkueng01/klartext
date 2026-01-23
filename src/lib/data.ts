export type ItemStatus = "todo" | "in_progress" | "done";

export interface Item {
  id: string;
  content: string;
  description?: string;
  images: string[];
  type: "todo" | "note";
  status: ItemStatus;
  isCompleted: boolean;
  createdAt: Date;
  tags: string[];
  priority: "low" | "medium" | "high" | "none";
  dueDate: Date | null;
}