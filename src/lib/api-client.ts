import { CurrentUser } from "@stackframe/stack";
import { PostgrestClient } from "@supabase/postgrest-js";

export async function getApiClient(user: CurrentUser) {
  const authJson = await user.getAuthJson();
  const accessToken = authJson?.accessToken;

  if (!accessToken) throw new Error("No access token found");

  return new PostgrestClient(process.env.NEXT_PUBLIC_NEON_DATA_API_URL!, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}