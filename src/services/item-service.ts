import { getApiClient } from "@/lib/api-client";
import { Item } from "@/lib/schema";
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
    await UserService.ensureUserExists(user);
    const pg = await getApiClient(user);

    const { data, error } = await pg
      .from("items")
      .insert({
        user_id: user.id,
        content: item.content,
        description: item.description,
        type: item.type,
        status: item.status,
        tags: item.tags,
        priority: item.priority,
        due_date: item.dueDate ? item.dueDate.toISOString() : null,
        images: item.images || []
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
    const pg = await getApiClient(user);

    // Map updates to snake_case
    const dbUpdates: any = {};
    if (updates.content !== undefined) dbUpdates.content = updates.content;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate ? updates.dueDate.toISOString() : null;
    if (updates.images !== undefined) dbUpdates.images = updates.images;

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