export function getPublicApiBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (raw && raw.trim().length > 0) return raw.replace(/\/+$/, "");
  if (process.env.NODE_ENV !== "production") return "http://localhost:3002";
  if (process.env.NEXT_PHASE === "phase-production-build") return "https://api-placeholder.vercel.app";
  throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
}

export function getSupabaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (raw && raw.trim().length > 0) return raw;
  // 构建阶段如果缺失，返回占位符避免报错，实际运行时需要配置
  if (process.env.NEXT_PHASE === "phase-production-build") return "https://placeholder.supabase.co";
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

export function getSupabaseAnonKey() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (raw && raw.trim().length > 0) return raw;
  if (process.env.NEXT_PHASE === "phase-production-build") return "placeholder";
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

