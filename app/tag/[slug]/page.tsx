import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PostCard } from "@/components/post-card";
import { Pagination } from "@/components/pagination";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

const PAGE_SIZE = 9;

interface TagPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({
  params,
}: TagPageProps): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const supabase = await createClient();
  const { data: tag } = await supabase
    .from("tags")
    .select("name")
    .eq("slug", slug)
    .single();

  if (!tag) return { title: "标签未找到" };
  return { title: `标签: ${tag.name}` };
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr || "1"));
  const supabase = await createClient();

  const { data: tag } = await supabase
    .from("tags")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!tag) notFound();

  const { data: postTags } = await supabase
    .from("post_tags")
    .select("post_id")
    .eq("tag_id", tag.id);

  const postIds = (postTags || []).map((pt) => pt.post_id);

  if (postIds.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 md:px-6 py-10">
          <Link
            href="/tag"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            &larr; 所有标签
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{tag.name}</h1>
          <div className="text-center py-24">
            <p className="text-xl font-semibold mb-2">该标签下暂无文章</p>
            <p className="text-muted-foreground">敬请期待更多内容</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { count } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("published", true)
    .in("id", postIds);

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  const { data: posts } = await supabase
    .from("posts")
    .select("*, category:categories(*)")
    .eq("published", true)
    .in("id", postIds)
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-10">
        <div className="mb-10">
          <Link
            href="/tag"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            &larr; 所有标签
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold">{tag.name}</h1>
          <p className="mt-2 text-muted-foreground">共 {count || 0} 篇文章</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(posts || []).map((post) => (
            <PostCard key={post.id} post={{ ...post, tags: [] }} />
          ))}
        </div>
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          basePath={`/tag/${slug}`}
        />
      </main>
      <Footer />
    </div>
  );
}
