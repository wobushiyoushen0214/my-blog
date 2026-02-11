export function getPublicApiBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (raw && raw.trim().length > 0) return raw.replace(/\/+$/, "");

  if (process.env.NODE_ENV !== "production") return "http://localhost:3002";

  // 构建阶段如果缺失，返回占位符避免报错，实际运行时需要在 Vercel 配置
  if (process.env.NEXT_PHASE === "phase-production-build") return "https://api-placeholder.vercel.app";

  throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
}

