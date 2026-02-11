import { getPublicApiBaseUrl } from "@/lib/env";
import type { PostDetail, PostListItem } from "@/lib/types";

async function fetchJson<T>(input: string, init?: RequestInit) {
  const res = await fetch(input, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Request failed: ${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

export async function adminListPosts(accessToken: string) {
  const baseUrl = getPublicApiBaseUrl();
  return fetchJson<{ items: PostListItem[] }>(`${baseUrl}/api/admin/posts`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });
}

export async function adminGetPost(accessToken: string, id: string) {
  const baseUrl = getPublicApiBaseUrl();
  return fetchJson<{ post: PostDetail }>(
    `${baseUrl}/api/admin/posts/${encodeURIComponent(id)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  );
}

export async function adminCreatePost(
  accessToken: string,
  input: {
    title: string;
    slug: string;
    excerpt?: string | null;
    coverUrl?: string | null;
    contentMd: string;
  },
) {
  const baseUrl = getPublicApiBaseUrl();
  return fetchJson<{ post: PostDetail }>(`${baseUrl}/api/admin/posts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function adminUpdatePost(
  accessToken: string,
  id: string,
  input: {
    title?: string;
    slug?: string;
    excerpt?: string | null;
    coverUrl?: string | null;
    contentMd?: string;
    status?: "draft" | "published";
  },
) {
  const baseUrl = getPublicApiBaseUrl();
  return fetchJson<{ post: PostDetail }>(
    `${baseUrl}/api/admin/posts/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );
}

