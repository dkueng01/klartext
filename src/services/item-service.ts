import { getApiClient } from "@/lib/api-client";
import { createItemSchema, Item, updateItemSchema } from "@/lib/schema";
import { CurrentUser } from "@stackframe/stack";
import { UserService } from "./user-service";

export const ItemService = {
  async getAll(user: CurrentUser): Promise<Item[]> {
    const pg = await getApiClient(user);

    const { data, error } = await pg
      .from("items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data.map((row: any) => ({
      ...row,
      dueDate: row.due_date ? new Date(row.due_date) : null,
      createdAt: new Date(row.created_at),
      isCompleted: row.status === 'done',
      images: row.images || []
    })) as Item[];
  },

  async create(user: CurrentUser, item: Partial<Item>): Promise<Item> {
    // 1. Validation
    const validated = createItemSchema.parse(item);

    await UserService.ensureUserExists(user);
    const pg = await getApiClient(user);

    const { data, error } = await pg
      .from("items")
      .insert({
        user_id: user.id,
        content: validated.content, // use validated data
        description: validated.description,
        type: validated.type,
        status: validated.status,
        tags: validated.tags,
        priority: validated.priority,
        due_date: validated.dueDate ? validated.dueDate.toISOString() : null,
        images: validated.images || []
      })
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      dueDate: data.due_date ? new Date(data.due_date) : null,
      createdAt: new Date(data.created_at),
      isCompleted: data.status === 'done'
    } as Item;
  },

  async update(user: CurrentUser, id: string, updates: Partial<Item>): Promise<Item> {
    // 1. Validation
    const validated = updateItemSchema.parse(updates);

    const pg = await getApiClient(user);

    // Map updates to snake_case
    const dbUpdates: any = {};
    if (validated.content !== undefined) dbUpdates.content = validated.content;
    if (validated.description !== undefined) dbUpdates.description = validated.description;
    if (validated.status !== undefined) dbUpdates.status = validated.status;
    if (validated.type !== undefined) dbUpdates.type = validated.type;
    if (validated.priority !== undefined) dbUpdates.priority = validated.priority;
    if (validated.tags !== undefined) dbUpdates.tags = validated.tags;
    if (validated.dueDate !== undefined) dbUpdates.due_date = validated.dueDate ? validated.dueDate.toISOString() : null;
    if (validated.images !== undefined) dbUpdates.images = validated.images;

    const { data, error } = await pg
      .from("items")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      dueDate: data.due_date ? new Date(data.due_date) : null,
      createdAt: new Date(data.created_at),
      isCompleted: data.status === 'done'
    } as Item;
  },

  async delete(user: CurrentUser, id: string): Promise<void> {
    const pg = await getApiClient(user);
    const { error } = await pg.from("items").delete().eq("id", id);
    if (error) throw error;
  }
};