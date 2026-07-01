import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ContentRow } from "@/components/content-row";
import {
  PublicActionLink,
  PublicEmptyState,
  PublicPageHeader,
  PublicPageShell,
} from "@/components/public-page";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import type { Metadata } from "next";
import type { Category, Post, PostTag, Tag } from "@/lib/types";

export const metadata: Metadata = {
  title: "搜索",
};

type PostRow = Post & { category?: Category | null; tags?: Tag[] };
type PublishedPostRow = Pick<Post, "id" | "category_id">;
type CategorySummary = Category & { postCount: number };
type TagSummary = Tag & { postCount: number };
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

function attachTagsFromRows(posts: PostRow[], postTags: PostTag[], tags: Tag[]) {
  if (posts.length === 0) return [];

  const postIds = new Set(posts.map((post) => post.id));
  const tagById = new Map(tags.map((tag) => [tag.id, tag]));
  const tagsByPostId = new Map<string, Tag[]>();

  postTags.forEach((postTag) => {
    if (!postIds.has(postTag.post_id)) return;

    const tag = tagById.get(postTag.tag_id);
    if (!tag) return;

    const groupedTags = tagsByPostId.get(postTag.post_id);
    if (groupedTags) {
      groupedTags.push(tag);
      return;
    }

    tagsByPostId.set(postTag.post_id, [tag]);
  });

  return posts.map((post) => ({
    ...post,
    tags: tagsByPostId.get(post.id) || [],
  }));
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

  const [
    { data: categories },
    { data: tags },
    { data: publishedRows },
  ] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase.from("tags").select("*").order("name"),
    supabase.from("posts").select("id, category_id").eq("published", true),
  ]);

  const typedCategories = (categories || []) as Category[];
  const typedTags = (tags || []) as Tag[];
  const typedPublishedRows = (publishedRows || []) as PublishedPostRow[];
  const publishedPostIds = typedPublishedRows.map((post) => post.id);
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

  const [{ data: recentData }, { data: postTags }] = await Promise.all([
    canQueryRecent ? recentQuery.limit(8) : Promise.resolve({ data: [] }),
    publishedPostIds.length > 0
      ? supabase
          .from("post_tags")
          .select("post_id, tag_id")
          .in("post_id", publishedPostIds)
      : Promise.resolve({ data: [] }),
  ]);
  const postTagRows = (postTags || []) as PostTag[];

  const categoryCounts = typedPublishedRows.reduce<Map<string, number>>(
    (counts, post) => {
      if (!post.category_id) return counts;
      counts.set(post.category_id, (counts.get(post.category_id) || 0) + 1);
      return counts;
    },
    new Map()
  );
  const tagCounts = postTagRows.reduce<Map<string, number>>((counts, postTag) => {
    counts.set(postTag.tag_id, (counts.get(postTag.tag_id) || 0) + 1);
    return counts;
  }, new Map());

  const categorySummaries: CategorySummary[] = typedCategories.map((category) => ({
    ...category,
    postCount: categoryCounts.get(category.id) || 0,
  }));
  const tagSummaries: TagSummary[] = typedTags.map((tag) => ({
    ...tag,
    postCount: tagCounts.get(tag.id) || 0,
  }));

  let results: PostRow[] = [];
  let matchedCategories: Category[] = [];
  let matchedTags: Tag[] = [];

  if (query) {
    const escaped = query;
    matchedCategories = filterCategoriesByType(
      typedCategories.filter((category) =>
        matchesQuery([category.name, category.slug], query)
      ),
      contentType
    );
    matchedTags = typedTags.filter((tag) =>
      matchesQuery([tag.name, tag.slug], query)
    );

    const categoryIds = matchedCategories.map((category) => category.id);
    const tagIds = matchedTags.map((tag) => tag.id);
    const matchedTagIds = new Set(tagIds);
    const tagPostIds = Array.from(
      new Set(
        postTagRows
          .filter((postTag) => matchedTagIds.has(postTag.tag_id))
          .map((postTag) => postTag.post_id)
      )
    );

    const [
      { data: keywordPosts },
      { data: categoryPosts },
      { data: tagPosts },
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
      tagPostIds.length > 0
        ? supabase
            .from("posts")
            .select("*, category:categories(*)")
            .eq("published", true)
            .in("id", tagPostIds)
            .order("created_at", { ascending: false })
            .limit(60)
        : Promise.resolve({ data: [] }),
    ]);

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

    results = attachTagsFromRows(mergedResults, postTagRows, typedTags);
  }

  const recentPosts = query
    ? []
    : attachTagsFromRows(
        sortPosts(
          filterPostsByType(
            (recentData || []) as unknown as PostRow[],
            contentType
          ),
          sort
        ),
        postTagRows,
        typedTags
      );
  const shownPosts = query ? results : recentPosts;
  const hasFilters = Boolean(contentType !== DEFAULT_TYPE || sort !== DEFAULT_SORT);
  const resultLabel = query
    ? `${results.length} 条结果`
    : contentType === "post"
      ? `${recentPosts.length} 篇文章`
      : contentType === "moment"
        ? `${recentPosts.length} 条见闻`
        : undefined;
  const topCategories = categorySummaries
    .filter((category) => category.postCount > 0)
    .sort((a, b) => b.postCount - a.postCount)
    .slice(0, 5);
  const topTags = tagSummaries
    .filter((tag) => tag.postCount > 0)
    .sort((a, b) => b.postCount - a.postCount)
    .slice(0, 10);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <PublicPageShell>
        <PublicPageHeader
          eyebrow="Search"
          title={query ? `搜索 · ${query}` : "搜索与发现"}
          description="按关键词检索标题、正文、分类和标签，也可以按内容类型和排序继续收窄。"
          countLabel={resultLabel}
        />

        <section className="py-1">
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
                className="h-10 rounded-md border-border/60 bg-background pl-10 shadow-none hover:bg-muted/30 focus-visible:bg-background"
              />
            </div>
            <label htmlFor="search-type" className="sr-only">
              内容类型
            </label>
            <select
              id="search-type"
              name="type"
              defaultValue={contentType}
              className="h-10 rounded-md border border-border/60 bg-background px-3 text-sm text-foreground outline-none transition-[background-color,color,box-shadow] hover:bg-muted/30 focus-visible:border-ring focus-visible:bg-background focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
              className="h-10 rounded-md border border-border/60 bg-background px-3 text-sm text-foreground outline-none transition-[background-color,color,box-shadow] hover:bg-muted/30 focus-visible:border-ring focus-visible:bg-background focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="newest">最新发布</option>
              <option value="updated">最近更新</option>
              <option value="popular">阅读最多</option>
            </select>
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-foreground px-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <Search className="h-4 w-4" suppressHydrationWarning />
              搜索
            </button>
            {query || hasFilters ? (
              <Link
                href="/search"
                className="inline-flex h-10 items-center justify-center rounded-md border border-border/60 px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                清除
              </Link>
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

        {query ? (
          <SearchResultSummary
            resultCount={results.length}
            matchedCategoryCount={matchedCategories.length}
            matchedTagCount={matchedTags.length}
            activeType={contentType}
            sort={sort}
          />
        ) : (
          <SearchStarterPanel
            categories={topCategories}
            tags={topTags}
            activeType={contentType}
            sort={sort}
          />
        )}

        {query && (matchedCategories.length > 0 || matchedTags.length > 0) ? (
          <SearchMatchPanel
            categories={matchedCategories}
            tags={matchedTags}
          />
        ) : null}

        <section className="mt-8">
          {shownPosts.length > 0 ? (
            <>
              <SectionTitle
                eyebrow={query ? "Results" : "Recent"}
                title={
                  query
                    ? "搜索结果"
                    : sort === "popular"
                      ? "热门内容"
                      : sort === "updated"
                        ? "最近更新"
                        : "最近发布"
                }
              />
              <div className="mt-3 grid">
                {shownPosts.map((post) => (
                  <ContentRow
                    key={post.id}
                    post={post}
                    typeLabel={getSearchTypeLabel(getPostType(post))}
                  />
                ))}
              </div>
            </>
          ) : query ? (
            <PublicEmptyState
              icon={Search}
              title="没有找到匹配内容"
              description={`没有匹配「${query}」的${contentType === "post" ? "文章" : contentType === "moment" ? "见闻" : "内容"}，可以换个关键词或清除筛选。`}
              action={
                <PublicActionLink href="/search">清除筛选</PublicActionLink>
              }
            />
          ) : (
            <PublicEmptyState
              icon={Search}
              title="输入关键词开始搜索"
              description="可以搜索技术主题、标签、文章标题、摘要或正文中的关键词。"
            />
          )}
        </section>
      </PublicPageShell>
      <Footer />
    </div>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="pb-1">
      <p className="text-sm text-muted-foreground">
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
    <section className="mt-3 flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/15 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
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
      className="inline-flex h-7 max-w-full items-center gap-1.5 rounded-md border border-border/60 px-2 text-xs text-foreground transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
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
      className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 py-1 md:mx-0 md:px-0"
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
          className={`inline-flex h-9 shrink-0 items-center px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
            activeType === item.value
              ? "rounded-md bg-muted text-foreground"
              : "rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function SearchResultSummary({
  resultCount,
  matchedCategoryCount,
  matchedTagCount,
  activeType,
  sort,
}: {
  resultCount: number;
  matchedCategoryCount: number;
  matchedTagCount: number;
  activeType: SearchType;
  sort: SortOption;
}) {
  return (
    <p className="mt-4 text-sm text-muted-foreground">
      {resultCount} 条结果 · {getSearchTypeLabel(activeType)} · {getSortLabel(sort)} ·{" "}
      {matchedCategoryCount} 个分类命中 · {matchedTagCount} 个标签命中
    </p>
  );
}

function SearchStarterPanel({
  categories,
  tags,
  activeType,
  sort,
}: {
  categories: CategorySummary[];
  tags: TagSummary[];
  activeType: SearchType;
  sort: SortOption;
}) {
  const shortcuts: Array<{
    label: string;
    description: string;
    href: string;
    active?: boolean;
  }> = [
    {
      label: "最新内容",
      description: "按发布时间浏览",
      href: buildSearchPath({ type: activeType, sort: "newest" }),
      active: sort === "newest",
    },
    {
      label: "最近更新",
      description: "查看近期改动",
      href: buildSearchPath({ type: activeType, sort: "updated" }),
      active: sort === "updated",
    },
    {
      label: "阅读最多",
      description: "按阅读量排序",
      href: buildSearchPath({ type: activeType, sort: "popular" }),
      active: sort === "popular",
    },
    {
      label: "只看文章",
      description: "长期笔记与复盘",
      href: buildSearchPath({ type: "post", sort }),
      active: activeType === "post",
    },
    {
      label: "只看见闻",
      description: "短记录与观察",
      href: buildSearchPath({ type: "moment", sort }),
      active: activeType === "moment",
    },
  ];

  return (
    <section className="mt-5 grid gap-6 border-y border-border/60 py-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.76fr)]">
      <div>
        <div className="pb-1">
          <h2 className="text-sm font-medium text-foreground">
            快速进入
          </h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            按内容类型或排序方式直接浏览。
          </p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {shortcuts.map((item) => (
            <Link
              key={`${item.label}-${item.href}`}
              href={item.href}
              className={`inline-flex min-h-8 items-center gap-2 text-sm underline-offset-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
                item.active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:underline"
              }`}
            >
              <span>{item.label}</span>
              <span className="text-xs text-muted-foreground">
                {item.active ? "当前" : item.description}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="space-y-2 py-1">
        <div className="py-2">
          <h2 className="text-sm font-medium text-foreground">
            高频主题
          </h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            选一个分类或标签继续探索。
          </p>
        </div>
        {categories.length > 0 || tags.length > 0 ? (
          <div className="space-y-3 py-3">
            {categories.length > 0 ? (
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/category/${category.slug}`}
                    className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    {category.name}
                    <span className="ml-1 text-xs text-muted-foreground">
                      {category.postCount}
                    </span>
                  </Link>
                ))}
              </div>
            ) : null}
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/tag/${tag.slug}`}
                    className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    #{tag.name}
                    <span className="ml-1 text-xs text-muted-foreground">
                      {tag.postCount}
                    </span>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="py-5 text-sm text-muted-foreground">
            暂无可浏览的主题。
          </div>
        )}
      </div>
    </section>
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
    <section className="mt-5 border-y border-border/60 py-4">
      <div>
        <h2 className="text-sm font-medium text-foreground">
          主题命中
        </h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          匹配到 {categories.length} 个分类、{tags.length} 个标签。
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        {categories.slice(0, 6).map((category) => (
          <Link
            key={category.id}
            href={`/category/${category.slug}`}
            className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {category.name}
            <span className="ml-1 text-xs">分类</span>
          </Link>
        ))}
        {tags.slice(0, 8).map((tag) => (
          <Link
            key={tag.id}
            href={`/tag/${tag.slug}`}
            className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            #{tag.name}
            <span className="ml-1 text-xs">标签</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
