import "server-only";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Server-side client. Uses the service role key, so it must never be imported from a client component.
// If env vars are missing the app still works; persistence is simply skipped.
let client: SupabaseClient | null = null;

export function getDb(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url && !key) return null;
  if (!url || !key) {
    throw new Error("Both SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured.");
  }
  if (!client) client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}
