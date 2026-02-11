"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { adminGetPost, adminUpdatePost } from "@/lib/adminApi";
import type { PostDetail, PostStatus } from "@/lib/types";

export default function EditPostPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      const token = data.session?.access_token;
      if (!token) return;

      try {
        const data = await adminGetPost(token, id);
        if (!active) return;
        setPost(data.post);
        setError(null);
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "加载失败");
      } finally {
        if (!active) return;
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [id, supabase]);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            <Link href="/posts" className="hover:underline">
              返回列表
            </Link>
          </div>
          <h1 className="mt-2 truncate text-2xl font-semibold tracking-tight">
            {post?.title ?? "编辑文章"}
          </h1>
        </div>

        <button
          type="button"
          className="h-10 rounded-xl bg-zinc-900 px-4 text-sm font-medium leading-10 text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          disabled={saving || !post}
          onClick={async () => {
            if (!post) return;
            setSaving(true);
            setError(null);

            const { data } = await supabase.auth.getSession();
            const token = data.session?.access_token;
            if (!token) {
              setSaving(false);
              setError("未登录");
              return;
            }

            try {
              const data = await adminUpdatePost(token, post.id, {
                title: post.title,
                slug: post.slug,
                excerpt: post.excerpt,
                coverUrl: post.coverUrl,
                contentMd: post.contentMd,
                status: post.status,
              });
              setPost(data.post);
            } catch (e) {
              setError(e instanceof Error ? e.message : "保存失败");
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? "保存中..." : "保存"}
        </button>
      </div>

      {loading ? (
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-300">
          加载中...
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {post ? (
        <div className="mt-6 grid grid-cols-1 gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-zinc-600 dark:text-zinc-300">
                标题
              </span>
              <input
                className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600"
                value={post.title}
                onChange={(e) =>
                  setPost((p) => (p ? { ...p, title: e.target.value } : p))
                }
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-zinc-600 dark:text-zinc-300">
                Slug
              </span>
              <input
                className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600"
                value={post.slug}
                onChange={(e) =>
                  setPost((p) => (p ? { ...p, slug: e.target.value } : p))
                }
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-zinc-600 dark:text-zinc-300">
                状态
              </span>
              <select
                className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600"
                value={post.status}
                onChange={(e) =>
                  setPost((p) =>
                    p ? { ...p, status: e.target.value as PostStatus } : p,
                  )
                }
              >
                <option value="draft">draft</option>
                <option value="published">published</option>
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-zinc-600 dark:text-zinc-300">
                封面图 URL
              </span>
              <input
                className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600"
                value={post.coverUrl ?? ""}
                onChange={(e) =>
                  setPost((p) =>
                    p
                      ? { ...p, coverUrl: e.target.value.trim() || null }
                      : p,
                  )
                }
              />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-zinc-600 dark:text-zinc-300">
              摘要
            </span>
            <textarea
              className="min-h-24 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600"
              value={post.excerpt ?? ""}
              onChange={(e) =>
                setPost((p) =>
                  p ? { ...p, excerpt: e.target.value || null } : p,
                )
              }
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-zinc-600 dark:text-zinc-300">
              Markdown 内容
            </span>
            <textarea
              className="min-h-[520px] rounded-xl border border-zinc-200 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600"
              value={post.contentMd}
              onChange={(e) =>
                setPost((p) =>
                  p ? { ...p, contentMd: e.target.value } : p,
                )
              }
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}

