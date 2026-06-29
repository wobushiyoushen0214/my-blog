import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PostCard } from "@/components/post-card";
import { Pagination } from "@/components/pagination";
import {
  PublicActionLink,
  PublicEmptyState,
  PublicIndexLinks,
  PublicInfoPanel,
  PublicPageHeader,
  PublicPageShell,
} from "@/components/public-page";
import { Badge } from "@/components/ui/badge";
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
type PostTagRow = { post_id: string; tag_id: string };
type PublishedPostRow = Pick<Post, "id" | "category_id">;

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

function attachTagsFromRows(
  posts: PostWithTaxonomy[],
  postTags: PostTagRow[],
  tags: Tag[]
) {
  const tagById = new Map(tags.map((tag) => [tag.id, tag]));
  const tagsByPostId = postTags.reduce<Map<string, Tag[]>>((groups, postTag) => {
    const tag = tagById.get(postTag.tag_id);
    if (!tag) return groups;

    groups.set(postTag.post_id, [...(groups.get(postTag.post_id) || []), tag]);
    return groups;
  }, new Map());

  return posts.map((post) => ({
    ...post,
    tags: tagsByPostId.get(post.id) || [],
  }));
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
    { data: publishedPosts },
    { data: allPostTags },
  ] = await Promise.all([
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("published", true)
      .eq("category_id", typedCategory.id),
    supabase.from("categories").select("*").order("name"),
    supabase.from("tags").select("*").order("name"),
    supabase.from("posts").select("id, category_id").eq("published", true),
    supabase.from("post_tags").select("post_id, tag_id"),
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

  const publishedRows = (publishedPosts || []) as PublishedPostRow[];
  const postTagRows = (allPostTags || []) as PostTagRow[];
  const tagRows = (tags || []) as Tag[];
  const publishedPostIds = new Set(publishedRows.map((post) => post.id));
  const categoryPostCounts = publishedRows.reduce<Map<string, number>>(
    (counts, post) => {
      if (!post.category_id) return counts;
      counts.set(post.category_id, (counts.get(post.category_id) || 0) + 1);
      return counts;
    },
    new Map()
  );
  const tagPostCounts = postTagRows.reduce<Map<string, Set<string>>>(
    (counts, postTag) => {
      if (!publishedPostIds.has(postTag.post_id)) return counts;
      const current = counts.get(postTag.tag_id) || new Set<string>();
      current.add(postTag.post_id);
      counts.set(postTag.tag_id, current);
      return counts;
    },
    new Map()
  );
  const postsWithTags = attachTagsFromRows(
    (posts || []) as unknown as PostWithTaxonomy[],
    postTagRows,
    tagRows
  );
  const categorySummaries: CategorySummary[] = ((categories || []) as Category[]).map(
    (item) => ({
      ...item,
      postCount: categoryPostCounts.get(item.id) || 0,
    })
  );
  const tagSummaries: TagSummary[] = tagRows.map((tag) => ({
    ...tag,
    postCount: tagPostCounts.get(tag.id)?.size || 0,
  }));

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
            <PublicActionLink href={getCategoryListHref(typedCategory)}>
              <ArrowRight className="h-4 w-4" suppressHydrationWarning />
              类型列表
            </PublicActionLink>
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
              <SummaryLedger
                items={[
                  {
                    label: "当前结果",
                    value: totalCount,
                    detail: hasFilters ? "筛选后内容" : "当前分类",
                  },
                  {
                    label: "全部内容",
                    value: totalCategoryCount || 0,
                    detail: typedCategory.name,
                  },
                  {
                    label: "排序",
                    value: getSortLabel(sort),
                    detail: "当前视图",
                  },
                ]}
              />

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
                  <div className="grid gap-2">
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
              <PublicInfoPanel
                title="继续浏览"
                description={`可以回到${
                  typedCategory.type === "moment" ? "见闻" : "文章"
                }流，或进入全站搜索。`}
                contentClassName="py-1"
              >
                <PublicIndexLinks
                  ariaLabel="分类详情继续浏览"
                  items={[
                    {
                      href: contentListHref,
                      label:
                        typedCategory.type === "moment"
                          ? "见闻列表"
                          : "文章列表",
                      description: "回到对应内容流",
                    },
                    {
                      href: "/search",
                      label: "搜索内容",
                      description: "跨分类和标签扩大范围",
                      icon: Search,
                    },
                  ]}
                />
              </PublicInfoPanel>
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
              <PublicActionLink href={`/category/${encodeURIComponent(slug)}`}>
                清除筛选
              </PublicActionLink>
            }
          />
        ) : (
          <PublicEmptyState
            icon={FolderOpen}
            title="该分类下暂无内容"
            description="后续发布到这个分类的内容会展示在这里。"
            action={
              <PublicActionLink href={contentListHref}>
                查看全部{typedCategory.type === "moment" ? "见闻" : "文章"}
              </PublicActionLink>
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
    <section className="border-y border-border/70 py-3">
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
            className="h-10 rounded-none border-border/60 bg-background pl-10 shadow-none"
          />
        </div>
        <label htmlFor="category-detail-sort" className="sr-only">
          分类内容排序
        </label>
        <select
          id="category-detail-sort"
          name="sort"
          defaultValue={sort}
          className="h-10 rounded-none border border-border/60 bg-background px-3 text-sm text-foreground outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <option value="newest">最新发布</option>
          <option value="updated">最近更新</option>
          <option value="popular">阅读最多</option>
        </select>
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center border border-border/70 bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          筛选
        </button>
        {hasFilters ? (
          <Link
            href={buildCategoryPath({ slug })}
            className="inline-flex h-10 items-center justify-center border border-border/70 bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            清除
          </Link>
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
    <section className="mt-3 flex flex-col gap-2 border-y border-border/70 py-3 sm:flex-row sm:items-center sm:justify-between">
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
        className="inline-flex h-8 shrink-0 items-center justify-center border-y border-border/60 px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
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
      className="inline-flex h-7 max-w-full items-center gap-1.5 border border-border/70 bg-background px-2 text-xs text-foreground transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      aria-label={`移除${label}`}
    >
      <span className="truncate">{label}</span>
      <X className="h-3 w-3 shrink-0" suppressHydrationWarning />
    </Link>
  );
}

function SummaryLedger({
  items,
}: {
  items: { label: string; value: number | string; detail: string }[];
}) {
  return (
    <section
      aria-label="分类内容概览"
      className="divide-y divide-border/70 border-y border-border/70"
    >
      {items.map((item, index) => (
        <div
          key={item.label}
          className="grid gap-2 py-3 text-sm sm:grid-cols-[44px_minmax(0,1fr)_120px_minmax(0,1fr)]"
        >
          <span className="text-muted-foreground">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="min-w-0 truncate text-muted-foreground">
            {item.label}
          </span>
          <span className="font-serif text-xl leading-none">{item.value}</span>
          <span className="min-w-0 truncate text-muted-foreground sm:text-right">
            {item.detail}
          </span>
        </div>
      ))}
    </section>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="border-b border-border/50 pb-3">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
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
    <section className="border-y border-border/70">
      <div className="border-b border-border/60 py-3">
        <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 py-3">
        {visibleItems.map((item) => (
          <Link
            key={item.id}
            href={hrefFor(item)}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <Badge
              variant="outline"
              className={cn(
                "h-8 gap-1.5 rounded-none px-2.5 text-xs font-normal",
                activeSlug === item.slug &&
                  "border-border/70 bg-muted/30 text-foreground"
              )}
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
