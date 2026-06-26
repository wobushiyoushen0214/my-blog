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
import {
  ArrowRight,
  FolderOpen,
  Hash,
  NotebookText,
  Search,
} from "lucide-react";
import type { ReactNode } from "react";
import type { Category, Post, Tag } from "@/lib/types";

const PAGE_SIZE = 10;

type CategorySummary = Category & { postCount: number };
type TagSummary = Tag & { postCount: number };
type PostWithTaxonomy = Post & {
  category?: Category | null;
  tags?: Tag[];
};

function buildMomentsPath(categorySlug?: string) {
  return categorySlug
    ? `/moments?category=${encodeURIComponent(categorySlug)}`
    : "/moments";
}

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

export default async function MomentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string }>;
}) {
  const { page: pageStr, category: requestedCategorySlug } = await searchParams;
  const page = Math.max(1, parseInt(pageStr || "1", 10) || 1);
  const supabase = await createClient();

  const { data: momentCategories } = await supabase
    .from("categories")
    .select("*")
    .eq("type", "moment")
    .order("name");

  const categories = (momentCategories || []) as Category[];
  const categoryIds = categories.map((category) => category.id);

  const { data: allMomentPosts } =
    categoryIds.length > 0
      ? await supabase
          .from("posts")
          .select("id, category_id")
          .eq("published", true)
          .in("category_id", categoryIds)
      : { data: [] };

  const categoryCounts = (allMomentPosts || []).reduce<Map<string, number>>(
    (counts, post) => {
      if (!post.category_id) return counts;
      counts.set(post.category_id, (counts.get(post.category_id) || 0) + 1);
      return counts;
    },
    new Map()
  );

  const categorySummaries: CategorySummary[] = categories.map((category) => ({
    ...category,
    postCount: categoryCounts.get(category.id) || 0,
  }));

  const activeCategory = requestedCategorySlug
    ? categorySummaries.find((category) => category.slug === requestedCategorySlug)
    : undefined;
  const activeCategorySlug = activeCategory?.slug;
  const activeCategoryId = activeCategory?.id;
  const totalMomentCount = categorySummaries.reduce(
    (sum, category) => sum + category.postCount,
    0
  );
  const totalCount = activeCategory?.postCount ?? totalMomentCount;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const from = (page - 1) * PAGE_SIZE;
  const to = page * PAGE_SIZE - 1;
  let postsWithTags: PostWithTaxonomy[] = [];

  if (activeCategoryId) {
    const { data: posts } = await supabase
      .from("posts")
      .select("*, category:categories(*)")
      .eq("published", true)
      .eq("category_id", activeCategoryId)
      .order("created_at", { ascending: false })
      .range(from, to);
    postsWithTags = await attachTags(
      supabase,
      (posts || []) as unknown as PostWithTaxonomy[]
    );
  } else if (categoryIds.length > 0) {
    const { data: posts } = await supabase
      .from("posts")
      .select("*, category:categories(*)")
      .eq("published", true)
      .in("category_id", categoryIds)
      .order("created_at", { ascending: false })
      .range(from, to);
    postsWithTags = await attachTags(
      supabase,
      (posts || []) as unknown as PostWithTaxonomy[]
    );
  }

  const allMomentPostIds = (allMomentPosts || []).map((post) => post.id);
  const [{ data: tags }, { data: momentPostTags }] = await Promise.all([
    supabase.from("tags").select("*").order("name"),
    allMomentPostIds.length > 0
      ? supabase
          .from("post_tags")
          .select("post_id, tag_id")
          .in("post_id", allMomentPostIds)
      : Promise.resolve({ data: [] }),
  ]);

  const tagCounts = (momentPostTags || []).reduce<Map<string, number>>(
    (counts, postTag) => {
      counts.set(postTag.tag_id, (counts.get(postTag.tag_id) || 0) + 1);
      return counts;
    },
    new Map()
  );
  const tagSummaries: TagSummary[] = (tags || [])
    .map((tag) => ({
      ...tag,
      postCount: tagCounts.get(tag.id) || 0,
    }))
    .filter((tag) => tag.postCount > 0)
    .sort((a, b) => b.postCount - a.postCount);

  const featuredMoment =
    page === 1 && !activeCategorySlug ? postsWithTags[0] || null : null;
  const listMoments = featuredMoment ? postsWithTags.slice(1) : postsWithTags;
  const basePath = buildMomentsPath(activeCategorySlug);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <PublicPageShell className="max-w-[1280px]">
        <PublicPageHeader
          eyebrow="Moments"
          title={activeCategory ? `见闻 · ${activeCategory.name}` : "见闻"}
          description="更轻量的观察、摘录和阶段性记录，按时间和主题整理。"
          countLabel={`${totalCount} 条`}
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
          activeSlug={activeCategorySlug}
          totalCount={totalMomentCount}
        />

        {postsWithTags.length > 0 ? (
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="min-w-0 space-y-8">
              {featuredMoment ? (
                <section aria-labelledby="featured-moment-title" className="space-y-3">
                  <SectionTitle eyebrow="Featured" title="近期见闻" id="featured-moment-title" />
                  <PostCard
                    post={featuredMoment}
                    variant="featured"
                    ctaLabel="阅读这条见闻"
                  />
                </section>
              ) : null}

              {listMoments.length > 0 ? (
                <section aria-labelledby="latest-moments-title" className="space-y-4">
                  <div className="flex flex-col gap-1 border-b border-border/50 pb-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
                        Latest
                      </p>
                      <h2 id="latest-moments-title" className="text-base font-medium">
                        最新记录
                      </h2>
                    </div>
                    {activeCategory ? (
                      <Link
                        href="/moments"
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      >
                        全部见闻
                        <ArrowRight
                          className="h-4 w-4"
                          suppressHydrationWarning
                        />
                      </Link>
                    ) : null}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {listMoments.map((post) => (
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
                title="见闻分类"
                description="按短内容主题继续浏览。"
                items={categorySummaries}
                activeSlug={activeCategorySlug}
                hrefPrefix="/moments?category="
                icon="category"
              />
              <TopicPanel
                title="相关标签"
                description="通过关键词查看关联内容。"
                items={tagSummaries.slice(0, 12)}
                hrefPrefix="/tag/"
                icon="tag"
              />
            </aside>
          </div>
        ) : (
          <PublicEmptyState
            icon={NotebookText}
            title={activeCategory ? "当前分类暂无见闻" : "暂无见闻"}
            description="发布见闻后，内容会按时间顺序展示在这里。"
            action={
              activeCategory ? (
                <Button variant="outline" asChild>
                  <Link href="/moments">查看全部见闻</Link>
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
      aria-label="见闻分类"
      className="-mx-4 flex gap-2 overflow-x-auto border-b border-border/50 px-4 pb-4 md:mx-0 md:px-0"
    >
      <CategoryLink href="/moments" active={!activeSlug}>
        全部
        <span className="text-xs text-muted-foreground">{totalCount}</span>
      </CategoryLink>
      {categories.map((category) => (
        <CategoryLink
          key={category.id}
          href={buildMomentsPath(category.slug)}
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
  children: ReactNode;
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

function SectionTitle({
  eyebrow,
  title,
  id,
}: {
  eyebrow: string;
  title: string;
  id: string;
}) {
  return (
    <div className="border-b border-border/50 pb-3">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
        {eyebrow}
      </p>
      <h2 id={id} className="mt-1 text-base font-medium">
        {title}
      </h2>
    </div>
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
  const visibleItems = items.filter((item) => item.postCount > 0);
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
        {visibleItems.map((item) => {
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
                ) : (
                  <FolderOpen
                    className="h-3.5 w-3.5"
                    suppressHydrationWarning
                  />
                )}
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
