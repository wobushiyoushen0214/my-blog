import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PostCard } from "@/components/post-card";
import { Pagination } from "@/components/pagination";
import {
  PublicActionLink,
  PublicEmptyState,
  PublicPageShell,
} from "@/components/public-page";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ArrowRight, FileText, Hash, Search, X } from "lucide-react";
import type { ReactNode } from "react";
import type { Category, Post, Tag } from "@/lib/types";

const PAGE_SIZE = 10;
const FEATURED_MIN_PAGE = 1;
const DEFAULT_SORT = "newest";

type SortOption = "newest" | "updated" | "popular";

type CategorySummary = Category & { postCount: number };
type TagSummary = Tag & { postCount: number };
type PostWithTaxonomy = Post & {
  category?: { name: string; slug: string } | null;
  tags?: Tag[];
};

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

function buildPostsPath({
  categorySlug,
  searchQuery,
  sort,
}: {
  categorySlug?: string;
  searchQuery?: string;
  sort?: SortOption;
} = {}) {
  const params = new URLSearchParams();

  if (categorySlug) params.set("category", categorySlug);
  if (searchQuery) params.set("q", searchQuery);
  if (sort && sort !== DEFAULT_SORT) params.set("sort", sort);

  const query = params.toString();
  return query ? `/posts?${query}` : "/posts";
}

function attachTagsFromMap(
  posts: PostWithTaxonomy[],
  tagsByPostId: Map<string, Tag[]>
) {
  return posts.map((post) => ({
    ...post,
    tags: tagsByPostId.get(post.id) || [],
  }));
}

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    category?: string;
    q?: string;
    sort?: string;
  }>;
}) {
  const {
    page: pageStr,
    category: categorySlug,
    q,
    sort: sortParam,
  } = await searchParams;
  const page = Math.max(1, parseInt(pageStr || "1", 10) || 1);
  const rawQuery = q?.trim() || "";
  const searchQuery = normalizeQuery(rawQuery);
  const sort = parseSort(sortParam);
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("type", "post")
    .order("name");

  const articleCategories = (categories || []) as Category[];
  const articleCategoryIds = articleCategories.map((category) => category.id);

  const [{ data: allArticlePosts }, { data: tags }] = await Promise.all([
    articleCategoryIds.length > 0
      ? supabase
          .from("posts")
          .select("id, category_id")
          .eq("published", true)
          .in("category_id", articleCategoryIds)
      : Promise.resolve({ data: [] }),
    supabase.from("tags").select("*").order("name"),
  ]);

  const categoryCounts = (allArticlePosts || []).reduce<Map<string, number>>(
    (counts, post) => {
      if (!post.category_id) return counts;
      counts.set(post.category_id, (counts.get(post.category_id) || 0) + 1);
      return counts;
    },
    new Map()
  );

  const categorySummaries: CategorySummary[] = articleCategories.map(
    (category) => ({
      ...category,
      postCount: categoryCounts.get(category.id) || 0,
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
  const activeCategorySlug = categoryId ? categorySlug : undefined;
  const hasArticleScope = Boolean(categoryId || articleCategoryIds.length > 0);

  let countQuery = supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("published", true);

  if (categoryId) {
    countQuery = countQuery.eq("category_id", categoryId);
  } else if (articleCategoryIds.length > 0) {
    countQuery = countQuery.in("category_id", articleCategoryIds);
  }

  if (searchQuery) {
    countQuery = countQuery.or(buildKeywordFilter(searchQuery));
  }

  const { count } = hasArticleScope ? await countQuery : { count: 0 };
  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  const from = (page - 1) * PAGE_SIZE;
  const to = page * PAGE_SIZE - 1;
  let postsQuery = supabase
    .from("posts")
    .select("*, category:categories(*)")
    .eq("published", true);

  if (categoryId) {
    postsQuery = postsQuery.eq("category_id", categoryId);
  } else if (articleCategoryIds.length > 0) {
    postsQuery = postsQuery.in("category_id", articleCategoryIds);
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

  const { data: posts } = hasArticleScope
    ? await postsQuery.range(from, to)
    : { data: [] };

  const allArticlePostIds = (allArticlePosts || []).map((post) => post.id);
  const { data: articlePostTags } =
    allArticlePostIds.length > 0
      ? await supabase
          .from("post_tags")
          .select("post_id, tag_id")
          .in("post_id", allArticlePostIds)
      : { data: [] };

  const tagCounts = (articlePostTags || []).reduce<Map<string, number>>(
    (counts, postTag) => {
      counts.set(postTag.tag_id, (counts.get(postTag.tag_id) || 0) + 1);
      return counts;
    },
    new Map()
  );
  const tagById = new Map((tags || []).map((tag) => [tag.id, tag as Tag]));
  const tagsByPostId = (articlePostTags || []).reduce<Map<string, Tag[]>>(
    (groups, postTag) => {
      const tag = tagById.get(postTag.tag_id);
      if (!tag) return groups;

      groups.set(postTag.post_id, [...(groups.get(postTag.post_id) || []), tag]);
      return groups;
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

  const postsWithTags = attachTagsFromMap(
    (posts || []) as unknown as PostWithTaxonomy[],
    tagsByPostId
  );

  const shouldFeature =
    page === FEATURED_MIN_PAGE &&
    !categoryName &&
    !searchQuery &&
    sort === DEFAULT_SORT &&
    postsWithTags.length > 0;
  const featuredPost = shouldFeature ? postsWithTags[0] : null;
  const listPosts = shouldFeature ? postsWithTags.slice(1) : postsWithTags;
  const basePath = buildPostsPath({
    categorySlug: activeCategorySlug,
    searchQuery,
    sort,
  });
  const totalCount = count || 0;
  const allArticleCount = allArticlePosts?.length || 0;
  const activeFilterCount = [
    activeCategorySlug,
    searchQuery,
    sort !== DEFAULT_SORT ? sort : "",
  ].filter(Boolean).length;
  const visibleCategoryCount = categorySummaries.filter(
    (category) => category.postCount > 0
  ).length;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <PublicPageShell className="max-w-[960px] py-10 md:py-12">
        <JournalHero
          title={
            categoryName
              ? `文章 · ${categoryName}`
              : searchQuery
                ? `文章 · ${searchQuery}`
                : "文章"
          }
          description="系统整理的技术笔记、项目复盘与长期主题，可按分类、关键词和排序继续收窄。"
          totalCount={totalCount}
          allCount={allArticleCount}
          categoryName={categoryName}
          searchQuery={searchQuery}
          sort={sort}
          action={
            <PublicActionLink href="/search">
              <Search className="h-4 w-4" suppressHydrationWarning />
              搜索
            </PublicActionLink>
          }
        />

        <CategoryNav
          categories={categorySummaries}
          activeSlug={activeCategorySlug}
          totalCount={allArticleCount}
          searchQuery={searchQuery}
          sort={sort}
        />

        <ListFilterBar
          categorySlug={activeCategorySlug}
          searchQuery={searchQuery}
          rawQuery={rawQuery}
          sort={sort}
        />

        <ActiveFilterSummary
          categoryName={categoryName}
          categorySlug={activeCategorySlug}
          searchQuery={searchQuery}
          sort={sort}
        />

        {allArticleCount > 0 ? (
          <PostsOverview
            totalCount={totalCount}
            allCount={allArticleCount}
            categoryCount={visibleCategoryCount}
            tagCount={tagSummaries.length}
            activeFilterCount={activeFilterCount}
            sort={sort}
          />
        ) : null}

        {postsWithTags.length > 0 ? (
          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="min-w-0 space-y-8">
              {featuredPost ? (
                <section aria-labelledby="featured-post-title" className="space-y-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Featured
                      </p>
                      <h2 id="featured-post-title" className="mt-1 text-lg font-semibold">
                        精选文章
                      </h2>
                    </div>
                  </div>
                  <PostCard post={featuredPost} variant="featured" />
                </section>
              ) : null}

              {listPosts.length > 0 ? (
                <section aria-labelledby="latest-posts-title" className="space-y-4">
                  <div className="flex flex-col gap-2 border-b border-border/60 pb-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Journal Index
                      </p>
                      <h2 id="latest-posts-title" className="mt-1 text-lg font-semibold">
                        {sort === "popular"
                          ? "热门内容"
                          : sort === "updated"
                            ? "最近更新"
                            : "最新内容"}
                      </h2>
                    </div>
                    {categoryName || searchQuery || sort !== DEFAULT_SORT ? (
                      <Link
                        href="/posts"
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      >
                        全部文章
                        <ArrowRight
                          className="h-4 w-4"
                          suppressHydrationWarning
                        />
                      </Link>
                    ) : null}
                  </div>
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
              <TopicPanel
                title="分类"
                description="按主题浏览长期内容。"
                items={categorySummaries}
                activeSlug={activeCategorySlug}
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
            title={
              searchQuery
                ? "没有匹配的文章"
                : categoryName
                  ? "当前分类暂无文章"
                  : "暂无文章"
            }
            description={
              searchQuery
                ? `没有找到包含「${searchQuery}」的文章，可以换个关键词或清除筛选。`
                : "发布文章后，内容会按时间顺序展示在这里。"
            }
            action={
              categoryName || searchQuery || sort !== DEFAULT_SORT ? (
                <PublicActionLink href="/posts">清除筛选</PublicActionLink>
              ) : null
            }
          />
        )}
      </PublicPageShell>
      <Footer />
    </div>
  );
}

function JournalHero({
  title,
  description,
  totalCount,
  allCount,
  categoryName,
  searchQuery,
  sort,
  action,
}: {
  title: string;
  description: string;
  totalCount: number;
  allCount: number;
  categoryName: string | null;
  searchQuery: string;
  sort: SortOption;
  action: ReactNode;
}) {
  const context = categoryName
    ? `分类 / ${categoryName}`
    : searchQuery
      ? `关键词 / ${searchQuery}`
      : "Volume / Articles";

  return (
    <header className="mb-8 border-b border-border/60 pb-6">
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_240px] md:items-end">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            Journal
          </p>
          <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
          <p className="text-xs text-muted-foreground">
            {context}
          </p>
          <dl className="mt-3 grid gap-2 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">当前视图</dt>
              <dd className="font-semibold tabular-nums">
                {totalCount}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">文章池</dt>
              <dd className="tabular-nums text-foreground">
                {allCount}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">排序</dt>
              <dd className="text-foreground">{getSortLabel(sort)}</dd>
            </div>
          </dl>
          <div className="mt-3">{action}</div>
        </div>
      </div>
    </header>
  );
}

function PostsOverview({
  totalCount,
  allCount,
  categoryCount,
  tagCount,
  activeFilterCount,
  sort,
}: {
  totalCount: number;
  allCount: number;
  categoryCount: number;
  tagCount: number;
  activeFilterCount: number;
  sort: SortOption;
}) {
  const items = [
    {
      label: "当前视图",
      value: `${totalCount}`,
      detail: activeFilterCount > 0 ? `${activeFilterCount} 个筛选` : "全部文章",
    },
    {
      label: "文章池",
      value: `${allCount}`,
      detail: `${categoryCount} 个分类`,
    },
    {
      label: "关联标签",
      value: `${tagCount}`,
      detail: getSortLabel(sort),
    },
  ];

  return (
    <section
      aria-label="文章概览"
      className="mt-5 grid gap-3 sm:grid-cols-3"
    >
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-border/60 bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">
            {item.label}
          </p>
          <p className="mt-1 text-lg font-semibold leading-none text-foreground">
            {item.value}
          </p>
          {item.detail ? (
            <p className="mt-2 truncate text-xs text-muted-foreground">
              {item.detail}
            </p>
          ) : null}
        </div>
      ))}
    </section>
  );
}

function CategoryNav({
  categories,
  activeSlug,
  totalCount,
  searchQuery,
  sort,
}: {
  categories: CategorySummary[];
  activeSlug?: string;
  totalCount: number;
  searchQuery: string;
  sort: SortOption;
}) {
  if (categories.length === 0) return null;

  return (
    <nav
      aria-label="文章分类"
      className="-mx-5 flex gap-4 overflow-x-auto border-b border-border/60 px-5 md:mx-0 md:px-0"
    >
      <CategoryLink
        href={buildPostsPath({ searchQuery, sort })}
        active={!activeSlug}
      >
        全部
        <span className="text-xs text-muted-foreground">{totalCount}</span>
      </CategoryLink>
      {categories.map((category) => (
        <CategoryLink
          key={category.id}
          href={buildPostsPath({
            categorySlug: category.slug,
            searchQuery,
            sort,
          })}
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
        "inline-flex h-11 shrink-0 items-center gap-2 border-b border-transparent text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        active
          ? "border-primary text-foreground"
          : "text-muted-foreground hover:border-border hover:text-foreground"
      )}
    >
      {children}
    </Link>
  );
}

function ListFilterBar({
  categorySlug,
  searchQuery,
  rawQuery,
  sort,
}: {
  categorySlug?: string;
  searchQuery: string;
  rawQuery: string;
  sort: SortOption;
}) {
  const hasFilters = Boolean(searchQuery || sort !== DEFAULT_SORT);

  return (
    <section className="mt-5 border-b border-border/60 pb-5">
      <form
        action="/posts"
        role="search"
        className="grid gap-2 md:grid-cols-[minmax(0,1fr)_160px_auto_auto]"
      >
        {categorySlug ? (
          <input type="hidden" name="category" value={categorySlug} />
        ) : null}
        <label htmlFor="posts-filter-search" className="sr-only">
          搜索文章
        </label>
        <div className="relative min-w-0">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            suppressHydrationWarning
          />
          <Input
            id="posts-filter-search"
            type="search"
            name="q"
            defaultValue={rawQuery}
            placeholder="在文章中搜索标题、摘要或正文..."
            className="h-10 rounded-md border-border/60 bg-background pl-10 shadow-none hover:bg-muted/30 focus-visible:bg-background"
          />
        </div>
        <label htmlFor="posts-sort" className="sr-only">
          文章排序
        </label>
        <select
          id="posts-sort"
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
            href={buildPostsPath({ categorySlug })}
            className="inline-flex h-10 items-center justify-center rounded-md border border-border/60 px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            清除
          </Link>
        ) : null}
      </form>
    </section>
  );
}

function getSortLabel(sort: SortOption) {
  if (sort === "popular") return "阅读最多";
  if (sort === "updated") return "最近更新";
  return "最新发布";
}

function ActiveFilterSummary({
  categoryName,
  categorySlug,
  searchQuery,
  sort,
}: {
  categoryName: string | null;
  categorySlug?: string;
  searchQuery: string;
  sort: SortOption;
}) {
  const hasFilters = Boolean(categoryName || searchQuery || sort !== DEFAULT_SORT);
  if (!hasFilters) return null;

  return (
    <section className="mt-4 flex flex-col gap-2 border-l border-border/50 px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">当前筛选</span>
        {categoryName ? (
          <FilterPill
            label={`分类：${categoryName}`}
            href={buildPostsPath({ searchQuery, sort })}
          />
        ) : null}
        {searchQuery ? (
          <FilterPill
            label={`关键词：${searchQuery}`}
            href={buildPostsPath({ categorySlug, sort })}
          />
        ) : null}
        {sort !== DEFAULT_SORT ? (
          <FilterPill
            label={`排序：${getSortLabel(sort)}`}
            href={buildPostsPath({ categorySlug, searchQuery })}
          />
        ) : null}
      </div>
      <Link
        href="/posts"
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
        {items.map((item) => {
          const href =
            icon === "category"
              ? `${hrefPrefix}${encodeURIComponent(item.slug)}`
              : `${hrefPrefix}${item.slug}`;
          return (
            <Link
              key={item.id}
              href={href}
              className={cn(
                "group grid min-h-10 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border/40 py-2 text-sm transition-colors last:border-b-0 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                activeSlug === item.slug ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                {icon === "tag" ? (
                  <Hash className="h-3.5 w-3.5" suppressHydrationWarning />
                ) : null}
                <span className="truncate">{item.name}</span>
              </span>
              <span className="text-xs tabular-nums text-muted-foreground transition-colors group-hover:text-foreground">
                {item.postCount}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
