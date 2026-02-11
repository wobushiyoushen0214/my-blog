import { getPublicApiBaseUrl } from "@/lib/env";
import type { PostDetail, PostListItem } from "@/lib/types";

type ApiListPostsResponse = {
  items: PostListItem[];
};

export async function listPublishedPosts() {
  const baseUrl = getPublicApiBaseUrl();
  const res = await fetch(`${baseUrl}/api/posts`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to load posts: ${res.status}`);
  }

  const data = (await res.json()) as ApiListPostsResponse;
  return data.items;
}

type ApiGetPostResponse = {
  post: PostDetail;
};

export async function getPublishedPostBySlug(slug: string) {
  const baseUrl = getPublicApiBaseUrl();
  const res = await fetch(`${baseUrl}/api/posts/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Failed to load post: ${res.status}`);
  }

  const data = (await res.json()) as ApiGetPostResponse;
  return data.post;
}
