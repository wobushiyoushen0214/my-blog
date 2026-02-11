export function getPublicApiBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (raw && raw.trim().length > 0) return raw.replace(/\/+$/, "");

  if (process.env.NODE_ENV !== "production") return "http://localhost:3002";

  throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
}

