import { getApiClient } from "@/lib/api-client";
import { createItemSchema, Item, updateItemSchema } from "@/lib/schema";
import { itemFromRow, itemToRow } from "@/lib/item-storage";
import { CurrentUser } from "@stackframe/stack";
import { UserService } from "./user-service";

export const ItemService = {
  async getAll(user: CurrentUser): Promise<Item[]> {
    const pg = await getApiClient(user);
    const { data, error } = await pg.from("items").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data.map(itemFromRow);
  },

  async create(user: CurrentUser, item: Partial<Item>): Promise<Item> {
    const validated = createItemSchema.parse(item);
    await UserService.ensureUserExists(user);
    const pg = await getApiClient(user);
    const { data, error } = await pg.from("items")
      .insert({ user_id: user.id, ...itemToRow(validated) }).select().single();
    if (error) throw error;
    return itemFromRow(data);
  },

  async update(user: CurrentUser, id: string, updates: Partial<Item>): Promise<Item> {
    const validated = updateItemSchema.parse(updates);
    const pg = await getApiClient(user);
    const { data, error } = await pg.from("items").update(itemToRow(validated)).eq("id", id).select().single();
    if (error) throw error;
    return itemFromRow(data);
  },

  async focus(user: CurrentUser, id: string, day: string): Promise<Item[]> {
    const pg = await getApiClient(user);
    const { data, error } = await pg.rpc("set_today_focus", { target_id: id, target_day: day });
    if (error) throw error;
    if (!data?.some((row: { id: string }) => row.id === id)) throw new Error("Task is no longer available");
    return data.map(itemFromRow);
  },

  async restore(user: CurrentUser, item: Item): Promise<Item> {
    const validated = createItemSchema.parse(item);
    await UserService.ensureUserExists(user);
    const pg = await getApiClient(user);
    const { data, error } = await pg.from("items").insert({
      ...itemToRow(validated), id: item.id, user_id: user.id,
      focused_on: null, completed_at: item.completedAt?.toISOString() ?? null,
      created_at: item.createdAt.toISOString(),
    }).select().single();
    if (error) throw error;
    return itemFromRow(data);
  },

  async delete(user: CurrentUser, id: string): Promise<void> {
    const pg = await getApiClient(user);
    const { error } = await pg.from("items").delete().eq("id", id);
    if (error) throw error;
  },
};
