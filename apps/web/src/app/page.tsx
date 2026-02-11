/*
 * @Author: LiZhiWei
 * @Date: 2026-02-11 09:12:59
 * @LastEditors: LiZhiWei
 * @LastEditTime: 2026-02-11 09:37:28
 * @Description: 博客首页（已发布文章列表）
 */
import { PostCard } from "@/components/PostCard";
import { listPublishedPosts } from "@/lib/blogApi";

export const dynamic = "force-dynamic";

export default async function Home() {
  const posts = await listPublishedPosts();
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">最新文章</h1>
      <div className="mt-6 flex flex-col gap-4">
        {posts.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-300">
            暂无已发布文章
          </div>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}
