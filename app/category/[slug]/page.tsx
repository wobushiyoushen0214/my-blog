import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PostCard } from "@/components/post-card";
import { Pagination } from "@/components/pagination";
import {
  PublicEmptyState,
  PublicPageHeader,
  PublicPageShell,
} from "@/components/public-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FolderOpen, Hash, Search } from "lucide-react";
import type { Metadata } from "next";
import type { Post, Tag } from "@/lib/types";

const PAGE_SIZE = 10;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

type PostWithTaxonomy = Post & {
  category?: { name: string; slug: string } | null;
  tags?: Tag[];
};

async function attachTags(
  supabase: Awaited<ReturnType<typeof createClient>>,
  posts: PostWithTaxonomy[]
) {
  return Promise.all(
    posts.map(async (post) => {
      const { data: postTags } = await supabase
        .from("post_tags")
        .select("tag_id")
        .eq("post_id", post.id);

      if (!postTags || postTags.length === 0) {
        return { ...post, tags: [] };
      }

      const tagIds = postTags.map((postTag) => postTag.tag_id);
      const { data: tags } = await supabase.from("tags").select("*").in("id", tagIds);
      return { ...post, tags: tags || [] };
    })
  );
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
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
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr || "1", 10) || 1);
  const supabase = await createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!category) notFound();

  const [{ count }, { data: categories }, { data: tags }] = await Promise.all([
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("published", true)
      .eq("category_id", category.id),
    supabase.from("categories").select("*").order("name"),
    supabase.from("tags").select("*").order("name"),
  ]);

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);
  const { data: posts } = await supabase
    .from("posts")
    .select("*, category:categories(*)")
    .eq("published", true)
    .eq("category_id", category.id)
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const [postsWithTags, categorySummaries, tagSummaries] = await Promise.all([
    attachTags(supabase, (posts || []) as unknown as PostWithTaxonomy[]),
    Promise.all(
      (categories || []).map(async (item) => {
        const { count: postCount } = await supabase
          .from("posts")
          .select("id", { count: "exact", head: true })
          .eq("published", true)
          .eq("category_id", item.id);
        return { ...item, postCount: postCount || 0 };
      })
    ),
    Promise.all(
      (tags || []).map(async (tag) => {
        const { count: postCount } = await supabase
          .from("post_tags")
          .select("post_id", { count: "exact", head: true })
          .eq("tag_id", tag.id);
        return { ...tag, postCount: postCount || 0 };
      })
    ),
  ]);

  const featuredPost = page === 1 ? postsWithTags[0] || null : null;
  const listPosts = featuredPost ? postsWithTags.slice(1) : postsWithTags;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <PublicPageShell className="max-w-[1280px]">
        <PublicPageHeader
          eyebrow="Category"
          title={category.name}
          description="该分类下的已发布内容，按时间倒序整理。"
          countLabel={`${count || 0} 篇`}
          backHref="/category"
          backLabel="所有分类"
          action={
            <Button variant="outline" asChild>
              <Link href="/search">
                <Search className="h-4 w-4" suppressHydrationWarning />
                搜索
              </Link>
            </Button>
          }
        />

        {(postsWithTags || []).length > 0 ? (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0 space-y-8">
              {featuredPost ? (
                <section className="space-y-3">
                  <SectionTitle eyebrow="Featured" title="分类精选" />
                  <PostCard post={featuredPost} variant="featured" />
                </section>
              ) : null}

              {listPosts.length > 0 ? (
                <section className="space-y-4">
                  <SectionTitle
                    eyebrow="Latest"
                    title={featuredPost ? "更多内容" : "最新内容"}
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    {listPosts.map((post) => (
                      <PostCard key={post.id} post={post} variant="compact" />
                    ))}
                  </div>
                </section>
              ) : null}

              <Pagination
                currentPage={page}
                totalPages={totalPages}
                basePath={`/category/${slug}`}
              />
            </div>

            <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
              <TaxonomyPanel
                title="其他分类"
                description="继续切换到相邻主题。"
                items={categorySummaries.filter((item) => item.id !== category.id)}
                hrefFor={(item) => `/category/${item.slug}`}
                activeSlug={category.slug}
                icon="category"
                limit={10}
              />
              <TaxonomyPanel
                title="热门标签"
                description="通过关键词继续交叉浏览。"
                items={tagSummaries}
                hrefFor={(item) => `/tag/${item.slug}`}
                icon="tag"
                limit={16}
              />
            </aside>
          </div>
        ) : (
          <PublicEmptyState
            icon={FolderOpen}
            title="该分类下暂无文章"
            description="后续发布到这个分类的内容会展示在这里。"
            action={
              <Button variant="outline" asChild>
                <Link href="/posts">查看全部文章</Link>
              </Button>
            }
          />
        )}
      </PublicPageShell>
      <Footer />
    </div>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="border-b border-border/50 pb-3">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-base font-medium">{title}</h2>
    </div>
  );
}

function TaxonomyPanel<T extends { id: string; slug: string; name: string; postCount: number }>({
  title,
  description,
  items,
  hrefFor,
  activeSlug,
  icon,
  limit,
}: {
  title: string;
  description: string;
  items: T[];
  hrefFor: (item: T) => string;
  activeSlug?: string;
  icon: "category" | "tag";
  limit: number;
}) {
  const visibleItems = items
    .filter((item) => item.postCount > 0)
    .sort((a, b) => b.postCount - a.postCount)
    .slice(0, limit);

  if (visibleItems.length === 0) return null;

  return (
    <section className="rounded-lg border bg-card">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-medium">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 p-3">
        {visibleItems.map((item) => (
          <Link
            key={item.id}
            href={hrefFor(item)}
            className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <Badge
              variant={activeSlug === item.slug ? "default" : "outline"}
              className={cn("h-8 gap-1.5 rounded-md px-2.5 text-xs font-normal")}
            >
              {icon === "tag" ? (
                <Hash className="h-3.5 w-3.5" suppressHydrationWarning />
              ) : (
                <FolderOpen className="h-3.5 w-3.5" suppressHydrationWarning />
              )}
              {item.name}
              <span className="text-[11px] opacity-70">{item.postCount}</span>
            </Badge>
          </Link>
        ))}
      </div>
    </section>
  );
}
