import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors, handleOptions } from "../../../src/lib/cors";
import { readJsonBody, sendError } from "../../../src/lib/http";
import { requireAdmin } from "../../../src/lib/adminAuth";
import { getSupabaseAdminClient } from "../../../src/lib/supabase";
import type { PostRow } from "../../../src/lib/posts";
import { createPostSchema, toPostDetail, toPostListItem } from "../../../src/lib/posts";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;
  applyCors(req, res);

  const authed = await requireAdmin(req, res);
  if (!authed) return;

  const supabase = getSupabaseAdminClient();

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("posts")
      .select(
        "id,slug,title,excerpt,cover_url,content_md,status,published_at,updated_at",
      )
      .order("updated_at", { ascending: false })
      .limit(200);

    if (error) {
      sendError(res, 500, error.message);
      return;
    }

    const items = (data as PostRow[]).map(toPostListItem);
    res.status(200).json({ items });
    return;
  }

  if (req.method === "POST") {
    const raw = await readJsonBody(req);
    const parsed = createPostSchema.safeParse(raw);
    if (!parsed.success) {
      sendError(res, 400, parsed.error.message);
      return;
    }

    const { title, slug, excerpt, coverUrl, contentMd } = parsed.data;
    const { data, error } = await supabase
      .from("posts")
      .insert({
        title,
        slug,
        excerpt: excerpt ?? null,
        cover_url: coverUrl ?? null,
        content_md: contentMd,
        status: "draft",
      })
      .select(
        "id,slug,title,excerpt,cover_url,content_md,status,published_at,updated_at",
      )
      .single();

    if (error) {
      sendError(res, 500, error.message);
      return;
    }

    res.status(200).json({ post: toPostDetail(data as PostRow) });
    return;
  }

  sendError(res, 405, "Method not allowed");
}

