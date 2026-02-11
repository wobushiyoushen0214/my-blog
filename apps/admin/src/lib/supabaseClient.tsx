"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";

let client: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  if (client) return client;
  client = createClient(getSupabaseUrl(), getSupabaseAnonKey());
  return client;
}

