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
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ArrowRight, FolderOpen, Hash, Search, X } from "lucide-react";
import type { Metadata } from "next";
import type { Category, Post, Tag } from "@/lib/types";

const PAGE_SIZE = 10;
const DEFAULT_SORT = "newest";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; q?: string; sort?: string }>;
}

type SortOption = "newest" | "updated" | "popular";

type PostWithTaxonomy = Post & {
  category?: Pick<Category, "name" | "slug" | "type"> | null;
  tags?: Tag[];
};

type CategorySummary = Category & { postCount: number };
type TagSummary = Tag & { postCount: number };

function normalizeQuery(query: string) {
  return query.replace(/[%,().]/g, " ").replace(/\s+/g, " ").trim();
}

function parseSort(value?: string): SortOption {
  return value === "updated" || value === "popular" ? value : DEFAULT_SORT;
}

function buildKeywordFilter(query: string) {
  return [
    `title.ilike.%${query}%`,
    `excerpt.ilike.%${query}%`,
    `content.ilike.%${query}%`,
  ].join(",");
}

function buildCategoryPath({
  slug,
  searchQuery,
  sort,
}: {
  slug: string;
  searchQuery?: string;
  sort?: SortOption;
}) {
  const params = new URLSearchParams();

  if (searchQuery) params.set("q", searchQuery);
  if (sort && sort !== DEFAULT_SORT) params.set("sort", sort);

  const query = params.toString();
  return query
    ? `/category/${encodeURIComponent(slug)}?${query}`
    : `/category/${encodeURIComponent(slug)}`;
}

function getSortLabel(sort: SortOption) {
  if (sort === "popular") return "阅读最多";
  if (sort === "updated") return "最近更新";
  return "最新发布";
}

function getCategoryTypeLabel(type: Category["type"]) {
  return type === "moment" ? "见闻分类" : "文章分类";
}

function getCategoryListHref(category: Pick<Category, "slug" | "type">) {
  return category.type === "moment"
    ? `/moments?category=${encodeURIComponent(category.slug)}`
    : `/posts?category=${encodeURIComponent(category.slug)}`;
}

function getContentListHref(type: Category["type"]) {
  return type === "moment" ? "/moments" : "/posts";
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
  const { page: pageStr, q, sort: sortParam } = await searchParams;
  const page = Math.max(1, parseInt(pageStr || "1", 10) || 1);
  const rawQuery = q?.trim() || "";
  const searchQuery = normalizeQuery(rawQuery);
  const sort = parseSort(sortParam);
  const supabase = await createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!category) notFound();

  const typedCategory = category as Category;

  const [
    { count: totalCategoryCount },
    { data: categories },
    { data: tags },
  ] = await Promise.all([
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("published", true)
      .eq("category_id", typedCategory.id),
    supabase.from("categories").select("*").order("name"),
    supabase.from("tags").select("*").order("name"),
  ]);

  let countQuery = supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("published", true)
    .eq("category_id", typedCategory.id);

  if (searchQuery) {
    countQuery = countQuery.or(buildKeywordFilter(searchQuery));
  }

  const { count } = await countQuery;
  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  let postsQuery = supabase
    .from("posts")
    .select("*, category:categories(*)")
    .eq("published", true)
    .eq("category_id", typedCategory.id);

  if (searchQuery) {
    postsQuery = postsQuery.or(buildKeywordFilter(searchQuery));
  }

  if (sort === "popular") {
    postsQuery = postsQuery
      .order("view_count", { ascending: false })
      .order("created_at", { ascending: false });
  } else if (sort === "updated") {
    postsQuery = postsQuery
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false });
  } else {
    postsQuery = postsQuery.order("created_at", { ascending: false });
  }

  const { data: posts } = await postsQuery.range(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE - 1
  );

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

  const hasFilters = Boolean(searchQuery || sort !== DEFAULT_SORT);
  const featuredPost =
    page === 1 && !searchQuery && sort === DEFAULT_SORT
      ? postsWithTags[0] || null
      : null;
  const listPosts = featuredPost ? postsWithTags.slice(1) : postsWithTags;
  const basePath = buildCategoryPath({ slug, searchQuery, sort });
  const categoryTypeLabel = getCategoryTypeLabel(typedCategory.type);
  const contentListHref = getContentListHref(typedCategory.type);
  const countLabel = hasFilters
    ? `${totalCount} / ${totalCategoryCount || 0} 篇`
    : `${totalCategoryCount || 0} 篇`;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <PublicPageShell className="max-w-[1280px]">
        <PublicPageHeader
          eyebrow="Category"
          title={typedCategory.name}
          description={`该${categoryTypeLabel}下的已发布内容，可在当前主题内继续搜索和排序。`}
          countLabel={countLabel}
          backHref="/category"
          backLabel="所有分类"
          action={
            <Button variant="outline" asChild>
              <Link href={getCategoryListHref(typedCategory)}>
                <ArrowRight className="h-4 w-4" suppressHydrationWarning />
                类型列表
              </Link>
            </Button>
          }
        />

        {totalCategoryCount ? (
          <>
            <CategoryFilterBar
              slug={slug}
              rawQuery={rawQuery}
              sort={sort}
              hasFilters={hasFilters}
            />
            <ActiveFilterSummary
              slug={slug}
              searchQuery={searchQuery}
              sort={sort}
            />
          </>
        ) : null}

        {(postsWithTags || []).length > 0 ? (
          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0 space-y-8">
              <section className="grid gap-3 sm:grid-cols-3">
                <StatTile label="当前结果" value={totalCount} />
                <StatTile label="全部内容" value={totalCategoryCount || 0} />
                <StatTile label="排序" value={getSortLabel(sort)} />
              </section>

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
                    title={
                      sort === "popular"
                        ? "热门内容"
                        : sort === "updated"
                          ? "最近更新"
                          : featuredPost
                            ? "更多内容"
                            : "最新内容"
                    }
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
                basePath={basePath}
              />
            </div>

            <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
              <TaxonomyPanel
                title="同类型分类"
                description="继续切换到相邻主题。"
                items={(categorySummaries as CategorySummary[]).filter(
                  (item) =>
                    item.id !== typedCategory.id &&
                    item.type === typedCategory.type
                )}
                hrefFor={(item) => `/category/${item.slug}`}
                activeSlug={typedCategory.slug}
                icon="category"
                limit={10}
              />
              <TaxonomyPanel
                title="热门标签"
                description="通过关键词继续交叉浏览。"
                items={tagSummaries as TagSummary[]}
                hrefFor={(item) => `/tag/${item.slug}`}
                icon="tag"
                limit={16}
              />
              <section className="rounded-lg border bg-card p-4">
                <p className="text-sm font-medium">继续浏览</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  可以回到{typedCategory.type === "moment" ? "见闻" : "文章"}流，或进入全站搜索。
                </p>
                <div className="mt-4 grid gap-2">
                  <Button variant="outline" className="justify-between" asChild>
                    <Link href={contentListHref}>
                      {typedCategory.type === "moment" ? "见闻列表" : "文章列表"}
                      <ArrowRight className="h-4 w-4" suppressHydrationWarning />
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-between" asChild>
                    <Link href="/search">
                      搜索内容
                      <Search className="h-4 w-4" suppressHydrationWarning />
                    </Link>
                  </Button>
                </div>
              </section>
            </aside>
          </div>
        ) : totalCategoryCount ? (
          <PublicEmptyState
            icon={Search}
            title="没有匹配的内容"
            description={
              searchQuery
                ? `没有找到包含「${searchQuery}」的内容，可以换个关键词或清除筛选。`
                : "当前排序和筛选下暂无内容，可以清除条件后再试。"
            }
            action={
              <Button variant="outline" asChild>
                <Link href={`/category/${encodeURIComponent(slug)}`}>清除筛选</Link>
              </Button>
            }
          />
        ) : (
          <PublicEmptyState
            icon={FolderOpen}
            title="该分类下暂无内容"
            description="后续发布到这个分类的内容会展示在这里。"
            action={
              <Button variant="outline" asChild>
                <Link href={contentListHref}>
                  查看全部{typedCategory.type === "moment" ? "见闻" : "文章"}
                </Link>
              </Button>
            }
          />
        )}
      </PublicPageShell>
      <Footer />
    </div>
  );
}

function CategoryFilterBar({
  slug,
  rawQuery,
  sort,
  hasFilters,
}: {
  slug: string;
  rawQuery: string;
  sort: SortOption;
  hasFilters: boolean;
}) {
  return (
    <section className="rounded-lg border bg-card p-3">
      <form
        action={`/category/${encodeURIComponent(slug)}`}
        role="search"
        className="grid gap-2 md:grid-cols-[minmax(0,1fr)_160px_auto_auto]"
      >
        <label htmlFor="category-detail-search" className="sr-only">
          搜索当前分类
        </label>
        <div className="relative min-w-0">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            suppressHydrationWarning
          />
          <Input
            id="category-detail-search"
            type="search"
            name="q"
            defaultValue={rawQuery}
            placeholder="在当前分类中搜索标题、摘要或正文..."
            className="h-10 border-border/60 bg-background pl-10"
          />
        </div>
        <label htmlFor="category-detail-sort" className="sr-only">
          分类内容排序
        </label>
        <select
          id="category-detail-sort"
          name="sort"
          defaultValue={sort}
          className="h-10 rounded-md border border-border/60 bg-background px-3 text-sm text-foreground shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <option value="newest">最新发布</option>
          <option value="updated">最近更新</option>
          <option value="popular">阅读最多</option>
        </select>
        <Button type="submit" className="h-10">
          筛选
        </Button>
        {hasFilters ? (
          <Button variant="outline" className="h-10" asChild>
            <Link href={buildCategoryPath({ slug })}>清除</Link>
          </Button>
        ) : null}
      </form>
    </section>
  );
}

function ActiveFilterSummary({
  slug,
  searchQuery,
  sort,
}: {
  slug: string;
  searchQuery: string;
  sort: SortOption;
}) {
  const hasFilters = Boolean(searchQuery || sort !== DEFAULT_SORT);
  if (!hasFilters) return null;

  return (
    <section className="mt-3 flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">当前筛选</span>
        {searchQuery ? (
          <FilterPill
            label={`关键词：${searchQuery}`}
            href={buildCategoryPath({ slug, sort })}
          />
        ) : null}
        {sort !== DEFAULT_SORT ? (
          <FilterPill
            label={`排序：${getSortLabel(sort)}`}
            href={buildCategoryPath({ slug, searchQuery })}
          />
        ) : null}
      </div>
      <Link
        href={buildCategoryPath({ slug })}
        className="inline-flex h-8 shrink-0 items-center justify-center rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-background hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        清除全部
      </Link>
    </section>
  );
}

function FilterPill({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex h-7 max-w-full items-center gap-1.5 rounded-md border border-border/70 bg-background px-2 text-xs text-foreground transition-colors hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      aria-label={`移除${label}`}
    >
      <span className="truncate">{label}</span>
      <X className="h-3 w-3 shrink-0" suppressHydrationWarning />
    </Link>
  );
}

function StatTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>
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
