"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { adminListPosts } from "@/lib/adminApi";
import type { PostListItem } from "@/lib/types";

export default function PostsPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [items, setItems] = useState<PostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      const token = data.session?.access_token;
      if (!token) return;

      try {
        const data = await adminListPosts(token);
        if (!active) return;
        setItems(data.items);
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
  }, [supabase]);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">文章</h1>
        <Link
          className="h-10 rounded-xl bg-zinc-900 px-4 text-sm font-medium leading-10 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          href="/posts/new"
        >
          新建文章
        </Link>
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

      <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/30">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">标题</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">更新时间</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr
                key={p.id}
                className="border-b border-zinc-100 last:border-b-0 dark:border-zinc-900"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/posts/${p.id}`}
                    className="font-medium hover:underline"
                  >
                    {p.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                  {p.slug}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      p.status === "published"
                        ? "rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
                        : "rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                    }
                  >
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                  {new Date(p.updatedAt).toLocaleString()}
                </td>
              </tr>
            ))}
            {items.length === 0 && !loading ? (
              <tr>
                <td
                  className="px-4 py-10 text-center text-zinc-500 dark:text-zinc-400"
                  colSpan={4}
                >
                  暂无文章
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

