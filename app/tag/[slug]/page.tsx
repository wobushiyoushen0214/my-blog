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
  PublicPageShell,
} from "@/components/public-page";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ArrowLeft, FolderOpen, Hash, Search, X } from "lucide-react";
import type { Metadata } from "next";
import type { Category, Post, Tag } from "@/lib/types";

const PAGE_SIZE = 10;

type SearchType = "all" | "post" | "moment";
type SortOption = "newest" | "updated" | "popular";

const DEFAULT_TYPE: SearchType = "all";
const DEFAULT_SORT: SortOption = "newest";

interface TagPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    page?: string;
    q?: string;
    type?: string;
    sort?: string;
  }>;
}

type PostWithTaxonomy = Post & {
  category?: Pick<Category, "name" | "slug" | "type"> | null;
  tags?: Tag[];
};

type CategorySummary = Category & { postCount: number };
type TagSummary = Tag & { postCount: number };
type PostTagRow = { post_id: string; tag_id: string };

function normalizeQuery(query: string) {
  return query.replace(/[%,().]/g, " ").replace(/\s+/g, " ").trim();
}

function parseType(value?: string): SearchType {
  return value === "post" || value === "moment" ? value : DEFAULT_TYPE;
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

function buildTagPath({
  slug,
  searchQuery,
  type,
  sort,
}: {
  slug: string;
  searchQuery?: string;
  type?: SearchType;
  sort?: SortOption;
}) {
  const params = new URLSearchParams();

  if (searchQuery) params.set("q", searchQuery);
  if (type && type !== DEFAULT_TYPE) params.set("type", type);
  if (sort && sort !== DEFAULT_SORT) params.set("sort", sort);

  const query = params.toString();
  return query
    ? `/tag/${encodeURIComponent(slug)}?${query}`
    : `/tag/${encodeURIComponent(slug)}`;
}

function getSearchTypeLabel(type: SearchType) {
  if (type === "post") return "文章";
  if (type === "moment") return "见闻";
  return "全部";
}

function getSortLabel(sort: SortOption) {
  if (sort === "popular") return "阅读最多";
  if (sort === "updated") return "最近更新";
  return "最新发布";
}

function getContentListHref(type: SearchType) {
  if (type === "moment") return "/moments";
  return "/posts";
}

function getContentListLabel(type: SearchType) {
  if (type === "moment") return "见闻列表";
  return "文章列表";
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
  const {
    page: pageStr,
    q,
    type: typeParam,
    sort: sortParam,
  } = await searchParams;
  const page = Math.max(1, parseInt(pageStr || "1", 10) || 1);
  const rawQuery = q?.trim() || "";
  const searchQuery = normalizeQuery(rawQuery);
  const contentType = parseType(typeParam);
  const sort = parseSort(sortParam);
  const supabase = await createClient();

  const { data: tag } = await supabase
    .from("tags")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!tag) notFound();

  const [
    { data: allPostTags },
    { data: categories },
    { data: tags },
    { data: publishedPosts },
  ] = await Promise.all([
    supabase.from("post_tags").select("post_id, tag_id"),
    supabase.from("categories").select("*").order("name"),
    supabase.from("tags").select("*").order("name"),
    supabase.from("posts").select("id, category_id").eq("published", true),
  ]);

  const categoryRows = (categories || []) as Category[];
  const tagRows = (tags || []) as Tag[];
  const postTagRows = (allPostTags || []) as PostTagRow[];
  const publishedPostIds = new Set(
    (publishedPosts || []).map((post) => post.id)
  );
  const postCategoryIds = categoryRows
    .filter((category) => category.type !== "moment")
    .map((category) => category.id);
  const momentCategoryIds = categoryRows
    .filter((category) => category.type === "moment")
    .map((category) => category.id);
  const taggedPostIds = Array.from(
    new Set(
      postTagRows
        .filter((postTag) => postTag.tag_id === tag.id)
        .map((postTag) => postTag.post_id)
    )
  );
  const totalTaggedCount = taggedPostIds.filter((postId) =>
    publishedPostIds.has(postId)
  ).length;

  const categoryPostCounts = (publishedPosts || []).reduce<Map<string, number>>(
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
  const categorySummaries: CategorySummary[] = categoryRows.map((category) => ({
    ...category,
    postCount: categoryPostCounts.get(category.id) || 0,
  }));
  const tagSummaries: TagSummary[] = tagRows.map((item) => ({
    ...item,
    postCount: tagPostCounts.get(item.id)?.size || 0,
  }));

  let postsWithTags: PostWithTaxonomy[] = [];
  let count = 0;
  const canQueryPosts =
    taggedPostIds.length > 0 &&
    (contentType === "all" ||
      (contentType === "post" && postCategoryIds.length > 0) ||
      (contentType === "moment" && momentCategoryIds.length > 0));

  if (canQueryPosts) {
    let countQuery = supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("published", true)
      .in("id", taggedPostIds);

    if (contentType === "post") {
      countQuery = countQuery.in("category_id", postCategoryIds);
    } else if (contentType === "moment") {
      countQuery = countQuery.in("category_id", momentCategoryIds);
    }

    if (searchQuery) {
      countQuery = countQuery.or(buildKeywordFilter(searchQuery));
    }

    const { count: postCount } = await countQuery;
    count = postCount || 0;

    let postsQuery = supabase
      .from("posts")
      .select("*, category:categories(*)")
      .eq("published", true)
      .in("id", taggedPostIds);

    if (contentType === "post") {
      postsQuery = postsQuery.in("category_id", postCategoryIds);
    } else if (contentType === "moment") {
      postsQuery = postsQuery.in("category_id", momentCategoryIds);
    }

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

    postsWithTags = attachTagsFromRows(
      (posts || []) as unknown as PostWithTaxonomy[],
      postTagRows,
      tagRows
    );
  }

  const totalPages = Math.ceil(count / PAGE_SIZE);
  const hasFilters = Boolean(
    searchQuery || contentType !== DEFAULT_TYPE || sort !== DEFAULT_SORT
  );
  const featuredPost =
    page === 1 &&
    !searchQuery &&
    contentType === DEFAULT_TYPE &&
    sort === DEFAULT_SORT
      ? postsWithTags[0] || null
      : null;
  const listPosts = featuredPost ? postsWithTags.slice(1) : postsWithTags;
  const basePath = buildTagPath({ slug, searchQuery, type: contentType, sort });
  const countLabel = hasFilters
    ? `${count} / ${totalTaggedCount} 篇`
    : `${totalTaggedCount} 篇`;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <PublicPageShell className="max-w-[960px] py-10 md:py-12">
        <TagHero
          tagName={tag.name}
          countLabel={countLabel}
          count={count}
          totalTaggedCount={totalTaggedCount}
          contentType={contentType}
          sort={sort}
          hasFilters={hasFilters}
          action={
            <PublicActionLink href="/search">
              <Search className="h-4 w-4" suppressHydrationWarning />
              搜索
            </PublicActionLink>
          }
        />

        {totalTaggedCount > 0 ? (
          <>
            <TagFilterBar
              slug={slug}
              rawQuery={rawQuery}
              contentType={contentType}
              sort={sort}
              hasFilters={hasFilters}
            />
            <ActiveTagFilterSummary
              slug={slug}
              searchQuery={searchQuery}
              contentType={contentType}
              sort={sort}
            />
          </>
        ) : null}

        {postsWithTags.length > 0 ? (
          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="min-w-0 space-y-8">
              <SummaryLedger
                items={[
                  {
                    label: "当前结果",
                    value: count,
                    detail: hasFilters ? "筛选后内容" : "当前标签",
                  },
                  {
                    label: "全部关联",
                    value: totalTaggedCount,
                    detail: tag.name,
                  },
                  {
                    label: "排序",
                    value: getSortLabel(sort),
                    detail: "当前视图",
                  },
                ]}
              />

              {featuredPost ? (
                <section className="space-y-4">
                  <SectionTitle eyebrow="推荐阅读" title="标签精选" />
                  <PostCard post={featuredPost} variant="featured" />
                </section>
              ) : null}

              {listPosts.length > 0 ? (
                <section className="space-y-4">
                  <SectionTitle
                    eyebrow="内容列表"
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
                  <div className="grid">
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
                title="相关标签"
                description="继续切换到相邻关键词。"
                items={tagSummaries.filter((item) => item.id !== tag.id)}
                hrefFor={(item) => `/tag/${item.slug}`}
                activeSlug={tag.slug}
                icon="tag"
                limit={16}
              />
              <TaxonomyPanel
                title="分类"
                description="按长期主题浏览。"
                items={categorySummaries}
                hrefFor={(item) => `/category/${item.slug}`}
                icon="category"
                limit={10}
              />
              <ContinuePanel
                title="继续浏览"
                description="可以切换到内容流，或进入搜索页扩大范围。"
              >
                <PublicIndexLinks
                  ariaLabel="标签详情继续浏览"
                  items={[
                    {
                      href: getContentListHref(contentType),
                      label: getContentListLabel(contentType),
                      description: "回到对应内容流",
                    },
                    {
                      href: "/search",
                      label: "搜索内容",
                      description: "跨标签和分类扩大范围",
                      icon: Search,
                    },
                  ]}
                />
              </ContinuePanel>
            </aside>
          </div>
        ) : totalTaggedCount > 0 ? (
          <PublicEmptyState
            icon={Search}
            title="没有匹配的内容"
            description={
              searchQuery
                ? `没有找到包含「${searchQuery}」的内容，可以换个关键词或清除筛选。`
                : "当前类型或排序下暂无内容，可以清除筛选后再试。"
            }
            action={
              <PublicActionLink href={`/tag/${encodeURIComponent(slug)}`}>
                清除筛选
              </PublicActionLink>
            }
          />
        ) : (
          <PublicEmptyState
            icon={Hash}
            title="该标签下暂无内容"
            description="后续关联到这个标签的内容会展示在这里。"
            action={
              <PublicActionLink href="/posts">查看全部文章</PublicActionLink>
            }
          />
        )}
      </PublicPageShell>
      <Footer />
    </div>
  );
}

function TagHero({
  tagName,
  countLabel,
  count,
  totalTaggedCount,
  contentType,
  sort,
  hasFilters,
  action,
}: {
  tagName: string;
  countLabel: string;
  count: number;
  totalTaggedCount: number;
  contentType: SearchType;
  sort: SortOption;
  hasFilters: boolean;
  action: React.ReactNode;
}) {
  return (
    <header className="mb-8 border-b border-border/60 pb-6">
      <Link
        href="/tag"
        className="mb-5 inline-flex h-9 items-center gap-2 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <ArrowLeft className="h-4 w-4" suppressHydrationWarning />
        所有标签
      </Link>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_240px] md:items-end">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            Tag
          </p>
          <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
            {tagName}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            该标签关联的已发布内容，可按类型、关键词和排序继续交叉浏览。
          </p>
        </div>

        <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
          <p className="text-xs text-muted-foreground">
            Tag Index / {countLabel}
          </p>
          <dl className="mt-3 grid gap-2 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">当前视图</dt>
              <dd className="font-semibold tabular-nums">
                {count}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">全部关联</dt>
              <dd className="tabular-nums text-foreground">
                {totalTaggedCount}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">视图</dt>
              <dd className="text-foreground">
                {hasFilters ? getSearchTypeLabel(contentType) : getSortLabel(sort)}
              </dd>
            </div>
          </dl>
          <div className="mt-3">{action}</div>
        </div>
      </div>
    </header>
  );
}

function TagFilterBar({
  slug,
  rawQuery,
  contentType,
  sort,
  hasFilters,
}: {
  slug: string;
  rawQuery: string;
  contentType: SearchType;
  sort: SortOption;
  hasFilters: boolean;
}) {
  return (
    <section className="border-b border-border/60 pb-5">
      <form
        action={`/tag/${encodeURIComponent(slug)}`}
        role="search"
        className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_150px_150px_auto_auto]"
      >
        <label htmlFor="tag-detail-search" className="sr-only">
          搜索当前标签
        </label>
        <div className="relative min-w-0">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            suppressHydrationWarning
          />
          <Input
            id="tag-detail-search"
            type="search"
            name="q"
            defaultValue={rawQuery}
            placeholder="在当前标签中搜索标题、摘要或正文..."
            className="h-10 rounded-md border-border/60 bg-background pl-10 shadow-none hover:bg-muted/30 focus-visible:bg-background"
          />
        </div>
        <label htmlFor="tag-detail-type" className="sr-only">
          标签内容类型
        </label>
        <select
          id="tag-detail-type"
          name="type"
          defaultValue={contentType}
          className="h-10 rounded-md border border-border/60 bg-background px-3 text-sm text-foreground outline-none transition-[border-color,background-color,box-shadow] hover:bg-muted/30 focus-visible:border-ring focus-visible:bg-background focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <option value="all">全部内容</option>
          <option value="post">只看文章</option>
          <option value="moment">只看见闻</option>
        </select>
        <label htmlFor="tag-detail-sort" className="sr-only">
          标签内容排序
        </label>
        <select
          id="tag-detail-sort"
          name="sort"
          defaultValue={sort}
          className="h-10 rounded-md border border-border/60 bg-background px-3 text-sm text-foreground outline-none transition-[border-color,background-color,box-shadow] hover:bg-muted/30 focus-visible:border-ring focus-visible:bg-background focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <option value="newest">最新发布</option>
          <option value="updated">最近更新</option>
          <option value="popular">阅读最多</option>
        </select>
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          筛选
        </button>
        {hasFilters ? (
          <Link
            href={buildTagPath({ slug })}
            className="inline-flex h-10 items-center justify-center rounded-md border border-border/60 px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            清除
          </Link>
        ) : null}
      </form>
    </section>
  );
}

function ActiveTagFilterSummary({
  slug,
  searchQuery,
  contentType,
  sort,
}: {
  slug: string;
  searchQuery: string;
  contentType: SearchType;
  sort: SortOption;
}) {
  const hasFilters = Boolean(
    searchQuery || contentType !== DEFAULT_TYPE || sort !== DEFAULT_SORT
  );
  if (!hasFilters) return null;

  return (
    <section className="mt-4 flex flex-col gap-2 border-l border-border/50 px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">当前筛选</span>
        {searchQuery ? (
          <FilterPill
            label={`关键词：${searchQuery}`}
            href={buildTagPath({ slug, type: contentType, sort })}
          />
        ) : null}
        {contentType !== DEFAULT_TYPE ? (
          <FilterPill
            label={`类型：${getSearchTypeLabel(contentType)}`}
            href={buildTagPath({ slug, searchQuery, sort })}
          />
        ) : null}
        {sort !== DEFAULT_SORT ? (
          <FilterPill
            label={`排序：${getSortLabel(sort)}`}
            href={buildTagPath({ slug, searchQuery, type: contentType })}
          />
        ) : null}
      </div>
      <Link
        href={buildTagPath({ slug })}
        className="inline-flex h-8 shrink-0 items-center justify-center px-0 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
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
      className="inline-flex h-7 max-w-full items-center gap-1.5 rounded-md border border-border/60 px-2 text-xs text-foreground transition-colors hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
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
      aria-label="标签内容概览"
      className="grid gap-3 sm:grid-cols-3"
    >
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-border/60 bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">
            {item.label}
          </p>
          <p className="mt-1 text-lg font-semibold leading-none text-foreground">
            {item.value}
          </p>
          <p className="mt-2 truncate text-xs text-muted-foreground">
            {item.detail}
          </p>
        </div>
      ))}
    </section>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="border-b border-border/60 pb-3">
      <p className="text-sm text-muted-foreground">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-lg font-semibold">{title}</h2>
    </div>
  );
}

function TaxonomyPanel<
  T extends { id: string; slug: string; name: string; postCount: number },
>({
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
    <section className="rounded-lg border border-border/60 bg-muted/15 p-4">
      <div className="border-b border-border/60 pb-3">
        <h2 className="text-sm font-medium text-foreground">
          {title}
        </h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="grid">
        {visibleItems.map((item) => (
          <Link
            key={item.id}
            href={hrefFor(item)}
            className={cn(
              "group grid min-h-10 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border/40 py-2 text-sm transition-colors last:border-b-0 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              activeSlug === item.slug ? "text-foreground" : "text-muted-foreground"
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              {icon === "tag" ? (
                <Hash className="h-3.5 w-3.5" suppressHydrationWarning />
              ) : (
                <FolderOpen className="h-3.5 w-3.5" suppressHydrationWarning />
              )}
              <span className="truncate">{item.name}</span>
            </span>
            <span className="text-xs tabular-nums text-muted-foreground transition-colors group-hover:text-foreground">
              {item.postCount}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ContinuePanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border/60 bg-muted/15 p-4">
      <div className="border-b border-border/60 pb-3">
        <h2 className="text-sm font-medium text-foreground">
          {title}
        </h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="pt-3">{children}</div>
    </section>
  );
}
