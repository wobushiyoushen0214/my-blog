import Link from "next/link";
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
import { ArrowRight, FileText, Hash, Search } from "lucide-react";
import type { Category, Post, Tag } from "@/lib/types";

const PAGE_SIZE = 10;
const FEATURED_MIN_PAGE = 1;

type CategorySummary = Category & { postCount: number };
type TagSummary = Tag & { postCount: number };
type PostWithTaxonomy = Post & {
  category?: { name: string; slug: string } | null;
  tags?: Tag[];
};

function buildPostsPath(categorySlug?: string) {
  return categorySlug ? `/posts?category=${encodeURIComponent(categorySlug)}` : "/posts";
}

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string }>;
}) {
  const { page: pageStr, category: categorySlug } = await searchParams;
  const page = Math.max(1, parseInt(pageStr || "1", 10) || 1);
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("type", "post")
    .order("name");

  const categorySummaries = await Promise.all(
    (categories || []).map(async (category) => {
      const { count } = await supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("published", true)
        .eq("category_id", category.id);

      return { ...category, postCount: count || 0 };
    })
  );

  let categoryId: string | null = null;
  let categoryName: string | null = null;

  if (categorySlug) {
    const selected = categorySummaries.find(
      (category) => category.slug === categorySlug
    );
    if (selected) {
      categoryId = selected.id;
      categoryName = selected.name;
    }
  }

  const countQuery = categoryId
    ? supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("published", true)
        .eq("category_id", categoryId)
    : supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("published", true);

  const { count } = await countQuery;
  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  const from = (page - 1) * PAGE_SIZE;
  const to = page * PAGE_SIZE - 1;
  const postsQuery = categoryId
    ? supabase
        .from("posts")
        .select("*, category:categories!inner(*)")
        .eq("published", true)
        .eq("category_id", categoryId)
        .order("created_at", { ascending: false })
        .range(from, to)
    : supabase
        .from("posts")
        .select("*, category:categories(*)")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .range(from, to);

  const [{ data: posts }, { data: tags }] = await Promise.all([
    postsQuery,
    supabase.from("tags").select("*").order("name"),
  ]);

  const tagSummaries = await Promise.all(
    (tags || []).map(async (tag) => {
      const { count: tagCount } = await supabase
        .from("post_tags")
        .select("post_id", { count: "exact", head: true })
        .eq("tag_id", tag.id);

      return { ...tag, postCount: tagCount || 0 };
    })
  );

  const postsWithTags = await Promise.all(
    ((posts || []) as unknown as PostWithTaxonomy[]).map(async (post) => {
      const { data: postTags } = await supabase
        .from("post_tags")
        .select("tag_id")
        .eq("post_id", post.id);

      if (postTags && postTags.length > 0) {
        const tagIds = postTags.map((pt) => pt.tag_id);
        const { data: postTagData } = await supabase
          .from("tags")
          .select("*")
          .in("id", tagIds);
        return { ...post, tags: postTagData || [] };
      }

      return { ...post, tags: [] };
    })
  );

  const shouldFeature =
    page === FEATURED_MIN_PAGE && !categoryName && postsWithTags.length > 0;
  const featuredPost = shouldFeature ? postsWithTags[0] : null;
  const listPosts = shouldFeature ? postsWithTags.slice(1) : postsWithTags;
  const basePath = buildPostsPath(categorySlug);
  const totalCount = count || 0;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <PublicPageShell className="max-w-[1280px]">
        <PublicPageHeader
          eyebrow="Posts"
          title={categoryName ? `文章 · ${categoryName}` : "文章"}
          description="系统整理的技术笔记、项目复盘与长期主题。"
          countLabel={`${totalCount} 篇`}
          action={
            <Button variant="outline" asChild>
              <Link href="/search">
                <Search className="h-4 w-4" suppressHydrationWarning />
                搜索
              </Link>
            </Button>
          }
        />

        <CategoryNav
          categories={categorySummaries}
          activeSlug={categorySlug}
          totalCount={totalCount}
        />

        {postsWithTags.length > 0 ? (
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="min-w-0 space-y-8">
              {featuredPost ? (
                <section aria-labelledby="featured-post-title" className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
                        Featured
                      </p>
                      <h2 id="featured-post-title" className="text-base font-medium">
                        精选文章
                      </h2>
                    </div>
                  </div>
                  <PostCard post={featuredPost} variant="featured" />
                </section>
              ) : null}

              {listPosts.length > 0 ? (
                <section aria-labelledby="latest-posts-title" className="space-y-4">
                  <div className="flex flex-col gap-1 border-b border-border/50 pb-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
                        Latest
                      </p>
                      <h2 id="latest-posts-title" className="text-base font-medium">
                        最新内容
                      </h2>
                    </div>
                    {categoryName ? (
                      <Link
                        href="/posts"
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      >
                        全部文章
                        <ArrowRight
                          className="h-4 w-4"
                          suppressHydrationWarning
                        />
                      </Link>
                    ) : null}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:gap-5">
                    {listPosts.map((post) => (
                      <PostCard key={post.id} post={post} variant="compact" />
                    ))}
                  </div>
                </section>
              ) : null}

              <Pagination
                currentPage={page}
                totalPages={totalPages}
                basePath={basePath}
              />
            </div>

            <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
              <TopicPanel
                title="分类"
                description="按主题浏览长期内容。"
                items={categorySummaries}
                activeSlug={categorySlug}
                hrefPrefix="/posts?category="
                icon="category"
              />
              <TopicPanel
                title="标签"
                description="通过关键词交叉浏览。"
                items={tagSummaries.slice(0, 12)}
                hrefPrefix="/tag/"
                icon="tag"
              />
            </aside>
          </div>
        ) : (
          <PublicEmptyState
            icon={FileText}
            title={categoryName ? "当前分类暂无文章" : "暂无文章"}
            description="发布文章后，内容会按时间顺序展示在这里。"
            action={
              categoryName ? (
                <Button variant="outline" asChild>
                  <Link href="/posts">查看全部文章</Link>
                </Button>
              ) : null
            }
          />
        )}
      </PublicPageShell>
      <Footer />
    </div>
  );
}

function CategoryNav({
  categories,
  activeSlug,
  totalCount,
}: {
  categories: CategorySummary[];
  activeSlug?: string;
  totalCount: number;
}) {
  if (categories.length === 0) return null;

  return (
    <nav
      aria-label="文章分类"
      className="-mx-4 flex gap-2 overflow-x-auto border-b border-border/50 px-4 pb-4 md:mx-0 md:px-0"
    >
      <CategoryLink href="/posts" active={!activeSlug}>
        全部
        <span className="text-xs text-muted-foreground">{totalCount}</span>
      </CategoryLink>
      {categories.map((category) => (
        <CategoryLink
          key={category.id}
          href={buildPostsPath(category.slug)}
          active={activeSlug === category.slug}
        >
          {category.name}
          <span className="text-xs text-muted-foreground">
            {category.postCount}
          </span>
        </CategoryLink>
      ))}
    </nav>
  );
}

function CategoryLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-2 rounded-md border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        active
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border/60 bg-background text-muted-foreground hover:border-primary/30 hover:text-primary"
      )}
    >
      {children}
    </Link>
  );
}

function TopicPanel({
  title,
  description,
  items,
  activeSlug,
  hrefPrefix,
  icon,
}: {
  title: string;
  description: string;
  items: Array<CategorySummary | TagSummary>;
  activeSlug?: string;
  hrefPrefix: string;
  icon: "category" | "tag";
}) {
  if (items.length === 0) return null;

  return (
    <section className="rounded-lg border bg-card">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-medium">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 p-3">
        {items.map((item) => {
          const href =
            icon === "category"
              ? `${hrefPrefix}${encodeURIComponent(item.slug)}`
              : `${hrefPrefix}${item.slug}`;
          return (
            <Link
              key={item.id}
              href={href}
              className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <Badge
                variant={activeSlug === item.slug ? "default" : "outline"}
                className="h-8 gap-1.5 rounded-md px-2.5 text-xs font-normal"
              >
                {icon === "tag" ? (
                  <Hash className="h-3.5 w-3.5" suppressHydrationWarning />
                ) : null}
                {item.name}
                <span className="text-[11px] opacity-70">{item.postCount}</span>
              </Badge>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
