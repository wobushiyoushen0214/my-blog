export function getPublicApiBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (raw && raw.trim().length > 0) return raw.replace(/\/+$/, "");
  if (process.env.NODE_ENV !== "production") return "http://localhost:3002";
  throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
}

export function getSupabaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (raw && raw.trim().length > 0) return raw;
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

export function getSupabaseAnonKey() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (raw && raw.trim().length > 0) return raw;
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

