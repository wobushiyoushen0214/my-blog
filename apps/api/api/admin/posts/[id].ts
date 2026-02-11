import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors, handleOptions } from "../../../src/lib/cors";
import { readJsonBody, sendError } from "../../../src/lib/http";
import { requireAdmin } from "../../../src/lib/adminAuth";
import { getSupabaseAdminClient } from "../../../src/lib/supabase";
import type { PostRow } from "../../../src/lib/posts";
import { toPostDetail, updatePostSchema } from "../../../src/lib/posts";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;
  applyCors(req, res);

  const authed = await requireAdmin(req, res);
  if (!authed) return;

  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (!id) {
    sendError(res, 400, "Missing id");
    return;
  }

  const supabase = getSupabaseAdminClient();

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("posts")
      .select(
        "id,slug,title,excerpt,cover_url,content_md,status,published_at,updated_at",
      )
      .eq("id", id)
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
    return;
  }

  if (req.method === "PUT") {
    const raw = await readJsonBody(req);
    const parsed = updatePostSchema.safeParse(raw);
    if (!parsed.success) {
      sendError(res, 400, parsed.error.message);
      return;
    }

    const { data: existing, error: readError } = await supabase
      .from("posts")
      .select(
        "id,slug,title,excerpt,cover_url,content_md,status,published_at,updated_at",
      )
      .eq("id", id)
      .maybeSingle();

    if (readError) {
      sendError(res, 500, readError.message);
      return;
    }

    if (!existing) {
      sendError(res, 404, "Not found");
      return;
    }

    const input = parsed.data;
    const patch: Record<string, unknown> = {};

    if (input.title !== undefined) patch.title = input.title;
    if (input.slug !== undefined) patch.slug = input.slug;
    if (input.excerpt !== undefined) patch.excerpt = input.excerpt;
    if (input.coverUrl !== undefined) patch.cover_url = input.coverUrl;
    if (input.contentMd !== undefined) patch.content_md = input.contentMd;

    if (input.status !== undefined) {
      patch.status = input.status;
      if (input.status === "published" && !existing.published_at) {
        patch.published_at = new Date().toISOString();
      }
      if (input.status === "draft") {
        patch.published_at = null;
      }
    }

    const { data, error } = await supabase
      .from("posts")
      .update(patch)
      .eq("id", id)
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

