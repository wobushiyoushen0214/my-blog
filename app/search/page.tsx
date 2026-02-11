import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PostCard } from "@/components/post-card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { Metadata } from "next";
import type { Category, Post } from "@/lib/types";

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

  type PostRow = Post & { category?: Category | null };
  let posts: PostRow[] = [];

  if (query) {
    const { data } = await supabase
      .from("posts")
      .select("*, category:categories(*)")
      .eq("published", true)
      .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%`)
      .order("created_at", { ascending: false })
      .limit(20);

    posts = (data || []) as PostRow[];
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-12 md:py-20">
        <div className="max-w-lg mx-auto mb-12">
          <h1 className="text-2xl font-bold mb-6 text-center">搜索</h1>
          <form className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="输入关键词..."
              className="h-11 pl-10 rounded-lg bg-muted/50 border-border/50 focus:bg-background"
            />
          </form>
        </div>

        {query && (
          <p className="text-sm text-muted-foreground mb-8">
            找到 {posts.length} 篇关于「{query}」的文章
          </p>
        )}

        {posts.length > 0 ? (
          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={{ ...post, tags: [] }} />
            ))}
          </div>
        ) : query ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">没有找到相关文章，换个关键词试试</p>
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
