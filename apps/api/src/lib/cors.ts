import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getOptionalEnv } from "./env";

function parseAllowedOrigins() {
  const raw = getOptionalEnv("CORS_ORIGINS");
  if (!raw) return null;
  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length > 0 ? list : null;
}

export function applyCors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;
  const allowed = parseAllowedOrigins();

  if (!origin) {
    res.setHeader("Access-Control-Allow-Origin", "*");
  } else if (!allowed || allowed.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type",
  );
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
}

export function handleOptions(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "OPTIONS") return false;
  applyCors(req, res);
  res.status(204).end();
  return true;
}
