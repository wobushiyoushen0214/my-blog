/*
 * @Author: LiZhiWei
 * @Date: 2026-02-11 14:10:13
 * @LastEditors: LiZhiWei
 * @LastEditTime: 2026-02-11 16:12:43
 * @Description: 
 */
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { HomeLanding } from "@/components/home-landing";
import { PostTimeline } from "@/components/post-timeline";
import Link from "next/link";

export default async function HomePage() {
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("posts")
    .select("*, category:categories(*)")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(5);

  const postsWithTags = await Promise.all(
    (posts || []).map(async (post) => {
      const { data: postTags } = await supabase
        .from("post_tags")
        .select("tag_id")
        .eq("post_id", post.id);

      if (postTags && postTags.length > 0) {
        const tagIds = postTags.map((pt) => pt.tag_id);
        const { data: tags } = await supabase
          .from("tags")
          .select("*")
          .in("id", tagIds);
        return { ...post, tags: tags || [] };
      }
      return { ...post, tags: [] };
    })
  );

  return (
    <HomeLanding>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <div className="mx-auto w-full max-w-[1440px] px-4 md:px-6 pt-16 pb-12 md:pt-24 md:pb-16">
            <div className="flex items-baseline justify-between mb-8">
              <h2 className="text-lg font-semibold">最近更新</h2>
              <Link
                href="/posts"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                查看全部
              </Link>
            </div>

            {postsWithTags.length > 0 ? (
              <PostTimeline posts={postsWithTags.slice(0, 5)} />
            ) : (
              <div className="text-center py-24">
                <p className="text-muted-foreground mb-4">暂无文章</p>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </HomeLanding>
  );
}
