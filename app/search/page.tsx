import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PostCard } from "@/components/post-card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
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
      <main className="flex-1 container mx-auto px-4 md:px-6 py-10">
        <div className="mb-10 max-w-2xl mx-auto text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold">搜索文章</h1>
          <p className="text-muted-foreground">
            输入关键词查找你感兴趣的内容
          </p>
          <form className="relative mt-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="搜索文章标题或摘要..."
              className="text-base h-12 pl-12 rounded-xl"
            />
          </form>
        </div>

        {query && (
          <p className="text-sm text-muted-foreground mb-6">
            搜索 &ldquo;{query}&rdquo; 找到 {posts.length} 篇文章
          </p>
        )}

        {posts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={{ ...post, tags: [] }} />
            ))}
          </div>
        ) : query ? (
          <div className="text-center py-24">
            <div className="rounded-full bg-muted p-6 inline-block mb-6">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-xl font-semibold mb-2">没有找到相关文章</p>
            <p className="text-muted-foreground">换个关键词试试？</p>
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
