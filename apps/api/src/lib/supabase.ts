import { createClient } from "@supabase/supabase-js";
import { mustGetEnv } from "./env";

export function getSupabaseAdminClient() {
  const url = mustGetEnv("SUPABASE_URL");
  const serviceRoleKey = mustGetEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getSupabaseAnonClient() {
  const url = mustGetEnv("SUPABASE_URL");
  const anonKey = mustGetEnv("SUPABASE_ANON_KEY");
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

