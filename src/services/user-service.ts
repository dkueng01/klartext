import { getApiClient } from "@/lib/api-client";
import { CurrentUser } from "@stackframe/stack";

export const UserService = {
  async ensureUserExists(user: CurrentUser) {
    const pg = await getApiClient(user);

    // 1. Try to select the user
    const { data } = await pg
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    // 2. If user exists, we are good
    if (data) return;

    // 3. If not, create the user profile
    // We ignore error here locally because if two requests run in parallel,
    // one might fail with "duplicate key", which is fine.
    const { error } = await pg.from("profiles").insert({
      id: user.id,
      updated_at: new Date().toISOString(),
    });

    if (error && error.code !== "23505") { // 23505 is unique_violation
      console.error("Error creating user profile:", error);
      throw error;
    }
  },
};