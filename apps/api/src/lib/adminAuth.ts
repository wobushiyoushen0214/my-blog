import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getOptionalEnv } from "./env";
import { getSupabaseAdminClient } from "./supabase";

function getBearerToken(req: VercelRequest) {
  const raw = req.headers.authorization;
  if (!raw) return null;
  const m = raw.match(/^Bearer\s+(.+)$/i);
  return m?.[1] ?? null;
}

function parseAdminEmails() {
  const raw = getOptionalEnv("ADMIN_EMAILS");
  if (!raw) return null;
  const list = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.length > 0 ? list : null;
}

export async function requireAdmin(req: VercelRequest, res: VercelResponse) {
  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({ error: "Missing Authorization header" });
    return null;
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: "Invalid token" });
    return null;
  }

  const allow = parseAdminEmails();
  if (allow) {
    const email = data.user.email?.toLowerCase() ?? "";
    if (!allow.includes(email)) {
      res.status(403).json({ error: "Forbidden" });
      return null;
    }
  }

  return { token, user: data.user };
}

