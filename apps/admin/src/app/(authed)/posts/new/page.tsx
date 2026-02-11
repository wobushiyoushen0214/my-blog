"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { adminCreatePost } from "@/lib/adminApi";

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9\u4e00-\u9fa5-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function NewPostPage() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [contentMd, setContentMd] = useState("# 新文章\n");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">新建文章</h1>
        <button
          type="button"
          className="h-10 rounded-xl bg-zinc-900 px-4 text-sm font-medium leading-10 text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          disabled={saving}
          onClick={async () => {
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
              const data = await adminCreatePost(token, {
                title,
                slug: slug.trim() || slugify(title),
                excerpt: excerpt.trim() || null,
                contentMd,
              });
              router.replace(`/posts/${data.post.id}`);
              router.refresh();
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

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-zinc-600 dark:text-zinc-300">标题</span>
          <input
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600"
            value={title}
            onChange={(e) => {
              const v = e.target.value;
              setTitle(v);
              if (!slug) setSlug(slugify(v));
            }}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-zinc-600 dark:text-zinc-300">
            Slug
          </span>
          <input
            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-zinc-600 dark:text-zinc-300">摘要</span>
          <textarea
            className="min-h-24 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-zinc-600 dark:text-zinc-300">
            Markdown 内容
          </span>
          <textarea
            className="min-h-[420px] rounded-xl border border-zinc-200 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600"
            value={contentMd}
            onChange={(e) => setContentMd(e.target.value)}
          />
        </label>
      </div>
    </div>
  );
}

