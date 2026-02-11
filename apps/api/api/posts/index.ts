import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors, handleOptions } from "../../src/lib/cors";
import { sendError } from "../../src/lib/http";
import { getSupabaseAdminClient } from "../../src/lib/supabase";
import type { PostRow } from "../../src/lib/posts";
import { toPostListItem } from "../../src/lib/posts";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;
  applyCors(req, res);

  if (req.method !== "GET") {
    sendError(res, 405, "Method not allowed");
    return;
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("posts")
    .select(
      "id,slug,title,excerpt,cover_url,content_md,status,published_at,updated_at",
    )
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(50);

  if (error) {
    sendError(res, 500, error.message);
    return;
  }

  const items = (data as PostRow[]).map(toPostListItem);
  res.status(200).json({ items });
}

