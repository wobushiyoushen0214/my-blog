import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PostCard } from "@/components/post-card";
import { Pagination } from "@/components/pagination";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

const PAGE_SIZE = 9;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: category } = await supabase
    .from("categories")
    .select("name")
    .eq("slug", slug)
    .single();

  if (!category) return { title: "分类未找到" };
  return { title: `分类: ${category.name}` };
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params;
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr || "1"));
  const supabase = await createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!category) notFound();

  const { count } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("published", true)
    .eq("category_id", category.id);

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  const { data: posts } = await supabase
    .from("posts")
    .select("*, category:categories(*)")
    .eq("published", true)
    .eq("category_id", category.id)
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">分类: {category.name}</h1>
          <p className="mt-2 text-muted-foreground">共 {count || 0} 篇文章</p>
        </div>
        {(posts || []).length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {(posts || []).map((post) => (
              <PostCard key={post.id} post={{ ...post, tags: [] }} />
            ))}
          </div>
        ) : (
          <p className="text-center py-20 text-muted-foreground">
            该分类下暂无文章
          </p>
        )}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          basePath={`/category/${slug}`}
        />
      </main>
      <Footer />
    </div>
  );
}
