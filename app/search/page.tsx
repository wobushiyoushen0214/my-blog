import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PostCard } from "@/components/post-card";
import {
  PublicEmptyState,
  PublicPageHeader,
  PublicPageShell,
} from "@/components/public-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, FolderOpen, Hash, Search, X } from "lucide-react";
import type { Metadata } from "next";
import type { Category, Post, Tag } from "@/lib/types";

export const metadata: Metadata = {
  title: "搜索",
};

type PostRow = Post & { category?: Category | null; tags?: Tag[] };
type SearchType = "all" | "post" | "moment";
type SortOption = "newest" | "updated" | "popular";

const DEFAULT_TYPE: SearchType = "all";
const DEFAULT_SORT: SortOption = "newest";

function normalizeQuery(query: string) {
  return query.replace(/[%,().]/g, " ").replace(/\s+/g, " ").trim();
}

function parseType(value?: string): SearchType {
  return value === "post" || value === "moment" ? value : DEFAULT_TYPE;
}

function parseSort(value?: string): SortOption {
  return value === "updated" || value === "popular" ? value : DEFAULT_SORT;
}

function buildSearchPath({
  query,
  type,
  sort,
}: {
  query?: string;
  type?: SearchType;
  sort?: SortOption;
}) {
  const params = new URLSearchParams();

  if (query) params.set("q", query);
  if (type && type !== DEFAULT_TYPE) params.set("type", type);
  if (sort && sort !== DEFAULT_SORT) params.set("sort", sort);

  const search = params.toString();
  return search ? `/search?${search}` : "/search";
}

function matchesQuery(values: Array<string | null | undefined>, query: string) {
  const normalized = query.toLowerCase();
  return values.some((value) => value?.toLowerCase().includes(normalized));
}

function mergePosts(groups: PostRow[][]) {
  const seen = new Map<string, PostRow>();

  groups.flat().forEach((post) => {
    if (!seen.has(post.id)) {
      seen.set(post.id, post);
    }
  });

  return Array.from(seen.values());
}

function getPostType(post: PostRow): Exclude<SearchType, "all"> {
  return post.category?.type === "moment" ? "moment" : "post";
}

function filterPostsByType(posts: PostRow[], type: SearchType) {
  if (type === "all") return posts;
  return posts.filter((post) => getPostType(post) === type);
}

function filterCategoriesByType(categories: Category[], type: SearchType) {
  if (type === "all") return categories;
  return categories.filter((category) =>
    type === "moment" ? category.type === "moment" : category.type !== "moment"
  );
}

function sortPosts(posts: PostRow[], sort: SortOption) {
  return [...posts].sort((a, b) => {
    if (sort === "popular") {
      const viewDelta = (b.view_count || 0) - (a.view_count || 0);
      if (viewDelta !== 0) return viewDelta;
    }

    const field = sort === "updated" ? "updated_at" : "created_at";
    return new Date(b[field]).getTime() - new Date(a[field]).getTime();
  });
}

async function attachTags(
  supabase: Awaited<ReturnType<typeof createClient>>,
  posts: PostRow[]
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

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; sort?: string }>;
}) {
  const { q, type: typeParam, sort: sortParam } = await searchParams;
  const rawQuery = q?.trim() || "";
  const query = normalizeQuery(rawQuery);
  const contentType = parseType(typeParam);
  const sort = parseSort(sortParam);
  const supabase = await createClient();

  const [{ data: categories }, { data: tags }] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase.from("tags").select("*").order("name"),
  ]);

  const typedCategories = (categories || []) as Category[];
  const postCategoryIds = typedCategories
    .filter((category) => category.type !== "moment")
    .map((category) => category.id);
  const momentCategoryIds = typedCategories
    .filter((category) => category.type === "moment")
    .map((category) => category.id);
  const canQueryRecent =
    contentType === "all" ||
    (contentType === "post" && postCategoryIds.length > 0) ||
    (contentType === "moment" && momentCategoryIds.length > 0);

  let recentQuery = supabase
    .from("posts")
    .select("*, category:categories(*)")
    .eq("published", true);

  if (contentType === "post") {
    recentQuery = recentQuery.in("category_id", postCategoryIds);
  } else if (contentType === "moment") {
    recentQuery = recentQuery.in("category_id", momentCategoryIds);
  }

  if (sort === "popular") {
    recentQuery = recentQuery
      .order("view_count", { ascending: false })
      .order("created_at", { ascending: false });
  } else if (sort === "updated") {
    recentQuery = recentQuery
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false });
  } else {
    recentQuery = recentQuery.order("created_at", { ascending: false });
  }

  const { data: recentData } = canQueryRecent
    ? await recentQuery.limit(8)
    : { data: [] };

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

  const tagSummaries = await Promise.all(
    (tags || []).map(async (tag) => {
      const { count } = await supabase
        .from("post_tags")
        .select("post_id", { count: "exact", head: true })
        .eq("tag_id", tag.id);
      return { ...tag, postCount: count || 0 };
    })
  );

  let results: PostRow[] = [];
  let matchedCategories: Category[] = [];
  let matchedTags: Tag[] = [];

  if (query) {
    const escaped = query;
    matchedCategories = filterCategoriesByType(
      (categories || []).filter((category) =>
        matchesQuery([category.name, category.slug], query)
      ),
      contentType
    );
    matchedTags = (tags || []).filter((tag) =>
      matchesQuery([tag.name, tag.slug], query)
    );

    const categoryIds = matchedCategories.map((category) => category.id);
    const tagIds = matchedTags.map((tag) => tag.id);

    const [
      { data: keywordPosts },
      { data: categoryPosts },
      { data: matchedPostTags },
    ] = await Promise.all([
      supabase
        .from("posts")
        .select("*, category:categories(*)")
        .eq("published", true)
        .or(
          [
            `title.ilike.%${escaped}%`,
            `excerpt.ilike.%${escaped}%`,
            `content.ilike.%${escaped}%`,
          ].join(",")
        )
        .order("created_at", { ascending: false })
        .limit(60),
      categoryIds.length > 0
        ? supabase
            .from("posts")
            .select("*, category:categories(*)")
            .eq("published", true)
            .in("category_id", categoryIds)
            .order("created_at", { ascending: false })
            .limit(60)
        : Promise.resolve({ data: [] }),
      tagIds.length > 0
        ? supabase
            .from("post_tags")
            .select("post_id")
            .in("tag_id", tagIds)
        : Promise.resolve({ data: [] }),
    ]);

    const tagPostIds = Array.from(
      new Set((matchedPostTags || []).map((postTag) => postTag.post_id))
    );
    const { data: tagPosts } =
      tagPostIds.length > 0
        ? await supabase
            .from("posts")
            .select("*, category:categories(*)")
            .eq("published", true)
            .in("id", tagPostIds)
            .order("created_at", { ascending: false })
            .limit(60)
        : { data: [] };

    const mergedResults = sortPosts(
      filterPostsByType(
        mergePosts([
          (keywordPosts || []) as unknown as PostRow[],
          (categoryPosts || []) as unknown as PostRow[],
          (tagPosts || []) as unknown as PostRow[],
        ]),
        contentType
      ),
      sort
    ).slice(0, 24);

    results = await attachTags(supabase, mergedResults);
  }

  const recentPosts = await attachTags(
    supabase,
    sortPosts(
      filterPostsByType((recentData || []) as unknown as PostRow[], contentType),
      sort
    )
  );
  const shownPosts = query ? results : recentPosts;
  const featuredPost = shownPosts[0] || null;
  const listPosts = shownPosts.slice(1);
  const hasFilters = Boolean(contentType !== DEFAULT_TYPE || sort !== DEFAULT_SORT);
  const resultLabel = query
    ? `${results.length} 条结果`
    : contentType === "post"
      ? `${recentPosts.length} 篇文章`
      : contentType === "moment"
        ? `${recentPosts.length} 条见闻`
        : undefined;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <PublicPageShell className="max-w-[1280px]">
        <PublicPageHeader
          eyebrow="Search"
          title={query ? `搜索 · ${query}` : "搜索与发现"}
          description="按关键词检索标题、正文、分类和标签，也可以按内容类型和排序继续收窄。"
          countLabel={resultLabel}
        />

        <section className="rounded-lg border bg-card p-3">
          <form
            className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_150px_150px_auto_auto]"
            role="search"
            action="/search"
          >
            <label htmlFor="site-search" className="sr-only">
              搜索关键词
            </label>
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                suppressHydrationWarning
              />
              <Input
                id="site-search"
                type="search"
                name="q"
                defaultValue={rawQuery}
                placeholder="搜索标题、正文、分类或标签..."
                className="h-10 border-border/60 bg-background pl-10"
              />
            </div>
            <label htmlFor="search-type" className="sr-only">
              内容类型
            </label>
            <select
              id="search-type"
              name="type"
              defaultValue={contentType}
              className="h-10 rounded-md border border-border/60 bg-background px-3 text-sm text-foreground shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="all">全部内容</option>
              <option value="post">只看文章</option>
              <option value="moment">只看见闻</option>
            </select>
            <label htmlFor="search-sort" className="sr-only">
              搜索排序
            </label>
            <select
              id="search-sort"
              name="sort"
              defaultValue={sort}
              className="h-10 rounded-md border border-border/60 bg-background px-3 text-sm text-foreground shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="newest">最新发布</option>
              <option value="updated">最近更新</option>
              <option value="popular">阅读最多</option>
            </select>
            <Button type="submit" className="h-10">
              <Search className="h-4 w-4" suppressHydrationWarning />
              搜索
            </Button>
            {query || hasFilters ? (
              <Button variant="outline" className="h-10" asChild>
                <Link href="/search">清除</Link>
              </Button>
            ) : null}
          </form>
        </section>

        <TypeSwitch
          query={query}
          activeType={contentType}
          sort={sort}
        />

        <ActiveSearchSummary
          query={query}
          activeType={contentType}
          sort={sort}
        />

        {query && (matchedCategories.length > 0 || matchedTags.length > 0) ? (
          <SearchMatchPanel
            categories={matchedCategories}
            tags={matchedTags}
          />
        ) : null}

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-8">
            {shownPosts.length > 0 ? (
              <>
                {featuredPost ? (
                  <section className="space-y-3">
                    <SectionTitle
                      eyebrow={query ? "Best Match" : "Recent"}
                      title={
                        query
                          ? sort === "popular"
                            ? "热门匹配"
                            : sort === "updated"
                              ? "最近更新"
                              : "最新匹配"
                          : sort === "popular"
                            ? "热门内容"
                            : sort === "updated"
                              ? "最近更新"
                              : "最近发布"
                      }
                    />
                    <PostCard
                      post={featuredPost}
                      variant={query ? "compact" : "featured"}
                    />
                  </section>
                ) : null}

                {listPosts.length > 0 ? (
                  <section className="space-y-4">
                    <SectionTitle
                      eyebrow={query ? "Results" : "More"}
                      title={query ? "更多结果" : "更多内容"}
                    />
                    <div className="grid gap-4 md:grid-cols-2">
                      {listPosts.map((post) => (
                        <PostCard key={post.id} post={post} variant="compact" />
                      ))}
                    </div>
                  </section>
                ) : null}
              </>
            ) : query ? (
              <PublicEmptyState
                icon={Search}
                title="没有找到匹配内容"
                description={`没有匹配「${query}」的${contentType === "post" ? "文章" : contentType === "moment" ? "见闻" : "内容"}，可以换个关键词或清除筛选。`}
                action={
                  <Button variant="outline" asChild>
                    <Link href="/search">清除筛选</Link>
                  </Button>
                }
              />
            ) : (
              <PublicEmptyState
                icon={Search}
                title="输入关键词开始搜索"
                description="可以搜索技术主题、标签、文章标题、摘要或正文中的关键词。"
              />
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <DiscoveryPanel
              title="分类"
              description="按长期主题浏览。"
              items={categorySummaries}
              hrefFor={(item) => `/category/${item.slug}`}
              icon="category"
              limit={8}
            />
            <DiscoveryPanel
              title="标签"
              description="通过关键词交叉发现内容。"
              items={tagSummaries}
              hrefFor={(item) => `/tag/${item.slug}`}
              icon="tag"
              limit={16}
            />
            <section className="rounded-lg border bg-card p-4">
              <p className="text-sm font-medium">继续浏览</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                不确定关键词时，可以直接进入文章流按时间和主题浏览。
              </p>
              <Button className="mt-4 w-full" variant="outline" asChild>
                <Link
                  href={
                    contentType === "moment"
                      ? "/moments"
                      : contentType === "post"
                        ? "/posts"
                        : "/posts"
                  }
                >
                  {contentType === "moment" ? "见闻列表" : "文章列表"}
                  <ArrowRight className="h-4 w-4" suppressHydrationWarning />
                </Link>
              </Button>
            </section>
          </aside>
        </div>
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

function ActiveSearchSummary({
  query,
  activeType,
  sort,
}: {
  query: string;
  activeType: SearchType;
  sort: SortOption;
}) {
  const hasFilters = Boolean(query || activeType !== DEFAULT_TYPE || sort !== DEFAULT_SORT);
  if (!hasFilters) return null;

  return (
    <section className="mt-3 flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">当前筛选</span>
        {query ? (
          <FilterPill
            label={`关键词：${query}`}
            href={buildSearchPath({ type: activeType, sort })}
          />
        ) : null}
        {activeType !== DEFAULT_TYPE ? (
          <FilterPill
            label={`类型：${getSearchTypeLabel(activeType)}`}
            href={buildSearchPath({ query, sort })}
          />
        ) : null}
        {sort !== DEFAULT_SORT ? (
          <FilterPill
            label={`排序：${getSortLabel(sort)}`}
            href={buildSearchPath({ query, type: activeType })}
          />
        ) : null}
      </div>
      <Link
        href="/search"
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

function TypeSwitch({
  query,
  activeType,
  sort,
}: {
  query: string;
  activeType: SearchType;
  sort: SortOption;
}) {
  const items: Array<{ value: SearchType; label: string }> = [
    { value: "all", label: "全部" },
    { value: "post", label: "文章" },
    { value: "moment", label: "见闻" },
  ];

  return (
    <nav
      aria-label="搜索内容类型"
      className="-mx-4 mt-4 flex gap-2 overflow-x-auto border-b border-border/50 px-4 pb-4 md:mx-0 md:px-0"
    >
      {items.map((item) => (
        <Link
          key={item.value}
          href={buildSearchPath({
            query,
            type: item.value,
            sort,
          })}
          aria-current={activeType === item.value ? "page" : undefined}
          className={`inline-flex h-9 shrink-0 items-center rounded-md border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
            activeType === item.value
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-border/60 bg-background text-muted-foreground hover:border-primary/30 hover:text-primary"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function SearchMatchPanel({
  categories,
  tags,
}: {
  categories: Category[];
  tags: Tag[];
}) {
  return (
    <section className="mt-4 rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium">主题命中</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            搜索结果已包含匹配分类和标签下的已发布内容。
          </p>
        </div>
        <div className="flex min-w-0 flex-wrap gap-2">
          {categories.slice(0, 6).map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <Badge
                variant="outline"
                className="h-8 gap-1.5 rounded-md px-2.5 text-xs font-normal"
              >
                <FolderOpen className="h-3.5 w-3.5" suppressHydrationWarning />
                {category.name}
              </Badge>
            </Link>
          ))}
          {tags.slice(0, 8).map((tag) => (
            <Link
              key={tag.id}
              href={`/tag/${tag.slug}`}
              className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <Badge
                variant="outline"
                className="h-8 gap-1.5 rounded-md px-2.5 text-xs font-normal"
              >
                <Hash className="h-3.5 w-3.5" suppressHydrationWarning />
                {tag.name}
              </Badge>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function DiscoveryPanel<T extends { id: string; name: string; postCount: number }>({
  title,
  description,
  items,
  hrefFor,
  icon,
  limit,
}: {
  title: string;
  description: string;
  items: T[];
  hrefFor: (item: T) => string;
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
              variant="outline"
              className="h-8 gap-1.5 rounded-md px-2.5 text-xs font-normal"
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
