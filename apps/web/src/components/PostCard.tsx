import Link from "next/link";
import type { PostListItem } from "@/lib/types";

export function PostCard({ post }: { post: PostListItem }) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/30">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold tracking-tight">
            <Link href={`/p/${post.slug}`} className="hover:underline">
              {post.title}
            </Link>
          </h2>
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {post.publishedAt ? new Date(post.publishedAt).toLocaleString() : ""}
          </div>
        </div>
      </div>
      {post.excerpt ? (
        <p className="mt-3 text-sm leading-6 text-zinc-700 dark:text-zinc-200">
          {post.excerpt}
        </p>
      ) : null}
    </article>
  );
}
