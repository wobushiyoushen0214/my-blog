import { z } from "zod";

export type PostStatus = "draft" | "published";

export type PostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_url: string | null;
  content_md: string;
  status: PostStatus;
  published_at: string | null;
  updated_at: string;
};

export type PostListItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverUrl: string | null;
  status: PostStatus;
  publishedAt: string | null;
  updatedAt: string;
};

export type PostDetail = PostListItem & {
  contentMd: string;
};

export function toPostListItem(row: PostRow): PostListItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    coverUrl: row.cover_url,
    status: row.status,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
  };
}

export function toPostDetail(row: PostRow): PostDetail {
  return {
    ...toPostListItem(row),
    contentMd: row.content_md,
  };
}

const slugSchema = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9\u4e00-\u9fa5-]+$/i);

export const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  slug: slugSchema,
  excerpt: z.string().max(500).nullable().optional(),
  coverUrl: z.string().url().nullable().optional(),
  contentMd: z.string().min(1),
});

export const updatePostSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: slugSchema.optional(),
  excerpt: z.string().max(500).nullable().optional(),
  coverUrl: z.string().url().nullable().optional(),
  contentMd: z.string().min(1).optional(),
  status: z.enum(["draft", "published"]).optional(),
});

