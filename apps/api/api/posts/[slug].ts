import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors, handleOptions } from "../../src/lib/cors";
import { sendError } from "../../src/lib/http";
import { getSupabaseAdminClient } from "../../src/lib/supabase";
import type { PostRow } from "../../src/lib/posts";
import { toPostDetail } from "../../src/lib/posts";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;
  applyCors(req, res);

  if (req.method !== "GET") {
    sendError(res, 405, "Method not allowed");
    return;
  }

  const slug = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug;
  if (!slug) {
    sendError(res, 400, "Missing slug");
    return;
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("posts")
    .select(
      "id,slug,title,excerpt,cover_url,content_md,status,published_at,updated_at",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    sendError(res, 500, error.message);
    return;
  }

  if (!data) {
    sendError(res, 404, "Not found");
    return;
  }

  res.status(200).json({ post: toPostDetail(data as PostRow) });
}

