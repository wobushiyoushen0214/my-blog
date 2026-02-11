import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PostCard } from "@/components/post-card";
import { Input } from "@/components/ui/input";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "搜索",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() || "";
  const supabase = await createClient();

  let posts: any[] = [];

  if (query) {
    const { data } = await supabase
      .from("posts")
      .select("*, category:categories(*)")
      .eq("published", true)
      .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%`)
      .order("created_at", { ascending: false })
      .limit(20);

    posts = data || [];
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8 max-w-xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">搜索文章</h1>
          <form>
            <Input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="输入关键词搜索..."
              className="text-lg h-12"
            />
          </form>
        </div>

        {query && (
          <div className="mb-4">
            <p className="text-muted-foreground">
              搜索 &ldquo;{query}&rdquo; 找到 {posts.length} 篇文章
            </p>
          </div>
        )}

        {posts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={{ ...post, tags: [] }} />
            ))}
          </div>
        ) : query ? (
          <p className="text-center py-20 text-muted-foreground">
            没有找到相关文章
          </p>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
