import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Pagination } from "@/components/pagination";
import {
  PublicActionLink,
  PublicEmptyState,
  PublicPageShell,
} from "@/components/public-page";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Eye,
  FolderOpen,
  Hash,
  NotebookText,
  Search,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import type { Category, Post, Tag } from "@/lib/types";

const PAGE_SIZE = 10;
const DEFAULT_SORT = "newest";

type SortOption = "newest" | "updated" | "popular";

type CategorySummary = Category & { postCount: number };
type TagSummary = Tag & { postCount: number };
type PostWithTaxonomy = Post & {
  category?: Category | null;
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

function buildMomentsPath({
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
  return query ? `/moments?${query}` : "/moments";
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatMonthDay(date: string) {
  return new Date(date).toLocaleDateString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  });
}

function formatYear(date: string) {
  return String(new Date(date).getFullYear());
}

function formatViews(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value || 0);
}

function getMomentExcerpt(post: Pick<Post, "content" | "excerpt" | "title">) {
  const source = post.excerpt || post.content || post.title;
  return source
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-zA-Z0-9#]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

export default async function MomentsPage({
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
    category: requestedCategorySlug,
    q,
    sort: sortParam,
  } = await searchParams;
  const page = Math.max(1, parseInt(pageStr || "1", 10) || 1);
  const rawQuery = q?.trim() || "";
  const searchQuery = normalizeQuery(rawQuery);
  const sort = parseSort(sortParam);
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

  const hasMomentScope = Boolean(activeCategoryId || categoryIds.length > 0);
  let countQuery = supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("published", true);

  if (activeCategoryId) {
    countQuery = countQuery.eq("category_id", activeCategoryId);
  } else if (categoryIds.length > 0) {
    countQuery = countQuery.in("category_id", categoryIds);
  }

  if (searchQuery) {
    countQuery = countQuery.or(buildKeywordFilter(searchQuery));
  }

  const { count } = hasMomentScope ? await countQuery : { count: 0 };
  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const from = (page - 1) * PAGE_SIZE;
  const to = page * PAGE_SIZE - 1;
  let postsQuery = supabase
    .from("posts")
    .select("*, category:categories(*)")
    .eq("published", true);

  if (activeCategoryId) {
    postsQuery = postsQuery.eq("category_id", activeCategoryId);
  } else if (categoryIds.length > 0) {
    postsQuery = postsQuery.in("category_id", categoryIds);
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

  const { data: posts } = hasMomentScope
    ? await postsQuery.range(from, to)
    : { data: [] };

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

  const tagById = new Map((tags || []).map((tag) => [tag.id, tag as Tag]));
  const tagsByPostId = (momentPostTags || []).reduce<Map<string, Tag[]>>(
    (groups, postTag) => {
      const tag = tagById.get(postTag.tag_id);
      if (!tag) return groups;

      groups.set(postTag.post_id, [...(groups.get(postTag.post_id) || []), tag]);
      return groups;
    },
    new Map()
  );
  const postsWithTags = attachTagsFromMap(
    (posts || []) as unknown as PostWithTaxonomy[],
    tagsByPostId
  );

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
    page === 1 && !activeCategorySlug && !searchQuery && sort === DEFAULT_SORT
      ? postsWithTags[0] || null
      : null;
  const listMoments = featuredMoment ? postsWithTags.slice(1) : postsWithTags;
  const basePath = buildMomentsPath({
    categorySlug: activeCategorySlug,
    searchQuery,
    sort,
  });
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
      <PublicPageShell className="max-w-[1240px] py-14 md:py-20">
        <MomentHero
          title={
            activeCategory
              ? `见闻 · ${activeCategory.name}`
              : searchQuery
                ? `见闻 · ${searchQuery}`
                : "见闻"
          }
          description="更轻量的观察、摘录和阶段性记录，可按主题、关键词和排序快速收窄。"
          totalCount={totalCount}
          allCount={totalMomentCount}
          categoryName={activeCategory?.name ?? null}
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
          totalCount={totalMomentCount}
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
          categoryName={activeCategory?.name ?? null}
          categorySlug={activeCategorySlug}
          searchQuery={searchQuery}
          sort={sort}
        />

        {totalMomentCount > 0 ? (
          <MomentOverview
            totalCount={totalCount}
            allCount={totalMomentCount}
            categoryCount={visibleCategoryCount}
            tagCount={tagSummaries.length}
            activeFilterCount={activeFilterCount}
            sort={sort}
          />
        ) : null}

        {postsWithTags.length > 0 ? (
          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="min-w-0 space-y-8">
              {featuredMoment ? (
                <MomentHighlight post={featuredMoment} />
              ) : null}

              {listMoments.length > 0 ? (
                <MomentStream
                  posts={listMoments}
                  sort={sort}
                  showAllLink={Boolean(
                    activeCategory || searchQuery || sort !== DEFAULT_SORT
                  )}
                />
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
            title={
              searchQuery
                ? "没有匹配的见闻"
                : activeCategory
                  ? "当前分类暂无见闻"
                  : "暂无见闻"
            }
            description={
              searchQuery
                ? `没有找到包含「${searchQuery}」的见闻，可以换个关键词或清除筛选。`
                : "发布见闻后，内容会按时间顺序展示在这里。"
            }
            action={
              activeCategory || searchQuery || sort !== DEFAULT_SORT ? (
                <PublicActionLink href="/moments">清除筛选</PublicActionLink>
              ) : null
            }
          />
        )}
      </PublicPageShell>
      <Footer />
    </div>
  );
}

function MomentHero({
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
      : "Gallery / Moments";

  return (
    <header className="mb-10 border-b border-border/35 pb-10 md:mb-12 md:pb-14">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
        <div className="min-w-0">
          <p className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
            <span className="h-px w-8 bg-border/70" aria-hidden="true" />
            Gallery
          </p>
          <h1 className="mt-5 font-serif text-5xl italic leading-[1.04] md:text-6xl lg:text-7xl">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="border-l border-border/35 pl-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            {context}
          </p>
          <dl className="mt-5 grid gap-3 border-y border-border/25 py-4">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-xs text-muted-foreground">当前视图</dt>
              <dd className="font-serif text-2xl leading-none tabular-nums">
                {totalCount}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-xs text-muted-foreground">记录池</dt>
              <dd className="text-sm tabular-nums text-foreground/90">
                {allCount}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-xs text-muted-foreground">排序</dt>
              <dd className="text-sm text-foreground/90">{getSortLabel(sort)}</dd>
            </div>
          </dl>
          <div className="mt-5">{action}</div>
        </div>
      </div>
    </header>
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
      aria-label="见闻分类"
      className="-mx-5 flex gap-6 overflow-x-auto border-b border-border/30 px-5 md:mx-0 md:px-0"
    >
      <CategoryLink
        href={buildMomentsPath({ searchQuery, sort })}
        active={!activeSlug}
      >
        全部
        <span className="text-xs text-muted-foreground">{totalCount}</span>
      </CategoryLink>
      {categories.map((category) => (
        <CategoryLink
          key={category.id}
          href={buildMomentsPath({
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
    <section className="mt-6 border-b border-border/30 pb-6">
      <form
        action="/moments"
        role="search"
        className="grid gap-2 md:grid-cols-[minmax(0,1fr)_160px_auto_auto]"
      >
        {categorySlug ? (
          <input type="hidden" name="category" value={categorySlug} />
        ) : null}
        <label htmlFor="moments-filter-search" className="sr-only">
          搜索见闻
        </label>
        <div className="relative min-w-0">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            suppressHydrationWarning
          />
          <Input
            id="moments-filter-search"
            type="search"
            name="q"
            defaultValue={rawQuery}
            placeholder="在见闻中搜索标题、摘要或正文..."
            className="h-11 rounded-none border-border/40 bg-transparent pl-10 shadow-none hover:border-border focus-visible:bg-background"
          />
        </div>
        <label htmlFor="moments-sort" className="sr-only">
          见闻排序
        </label>
        <select
          id="moments-sort"
          name="sort"
          defaultValue={sort}
          className="h-11 rounded-none border border-border/40 bg-transparent px-3 text-sm text-foreground outline-none transition-[border-color,background-color,box-shadow] hover:border-border focus-visible:border-ring focus-visible:bg-background focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <option value="newest">最新发布</option>
          <option value="updated">最近更新</option>
          <option value="popular">阅读最多</option>
        </select>
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          筛选
        </button>
        {hasFilters ? (
          <Link
            href={buildMomentsPath({ categorySlug })}
            className="inline-flex h-11 items-center justify-center border border-border/40 px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
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
            href={buildMomentsPath({ searchQuery, sort })}
          />
        ) : null}
        {searchQuery ? (
          <FilterPill
            label={`关键词：${searchQuery}`}
            href={buildMomentsPath({ categorySlug, sort })}
          />
        ) : null}
        {sort !== DEFAULT_SORT ? (
          <FilterPill
            label={`排序：${getSortLabel(sort)}`}
            href={buildMomentsPath({ categorySlug, searchQuery })}
          />
        ) : null}
      </div>
      <Link
        href="/moments"
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
      className="inline-flex h-7 max-w-full items-center gap-1.5 border border-border/35 px-2 text-xs text-foreground transition-colors hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      aria-label={`移除${label}`}
    >
      <span className="truncate">{label}</span>
      <X className="h-3 w-3 shrink-0" suppressHydrationWarning />
    </Link>
  );
}

function MomentOverview({
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
      detail: activeFilterCount > 0 ? `${activeFilterCount} 个筛选` : "全部见闻",
    },
    {
      label: "内容池",
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
      aria-label="见闻概览"
      className="mt-6 grid gap-px border-y border-border/35 bg-border/25 sm:grid-cols-3"
    >
      {items.map((item) => (
        <div key={item.label} className="bg-background px-4 py-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {item.label}
          </p>
          <p className="mt-2 font-serif text-2xl leading-none text-foreground">
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

function MomentHighlight({ post }: { post: PostWithTaxonomy }) {
  const excerpt = getMomentExcerpt(post);

  return (
    <section aria-labelledby="featured-moment-title" className="space-y-4">
      <div className="pb-1">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Featured Frame
        </p>
        <h2 id="featured-moment-title" className="mt-1 font-serif text-2xl">
          近期见闻
        </h2>
      </div>
      <Link
        href={`/blog/${post.slug}`}
        className="group grid overflow-hidden border-y border-border/35 transition-colors hover:bg-muted/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,1fr)]"
      >
        <div className="relative min-h-[260px] bg-muted/30">
          {post.cover_image ? (
            <Image
              src={post.cover_image}
              alt={post.title}
              fill
              sizes="(max-width: 1024px) 100vw, 46vw"
              className="object-cover grayscale transition-transform duration-700 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-end p-6">
              <p className="max-w-sm font-serif text-2xl italic leading-tight text-foreground/80">
                {post.title}
              </p>
            </div>
          )}
        </div>

        <div className="grid gap-4 p-6 text-sm md:p-8">
          <time
            dateTime={post.created_at}
            className="text-xs uppercase tracking-[0.18em] tabular-nums text-muted-foreground"
          >
            {formatDate(post.created_at)}
          </time>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
              {post.category ? (
                <span className="font-medium text-foreground">
                  {post.category.name}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" suppressHydrationWarning />
                {formatViews(post.view_count)} 阅读
              </span>
            </div>
            <h3 className="mt-4 font-serif text-3xl leading-tight transition-all duration-300 group-hover:italic group-hover:text-primary md:text-4xl">
              {post.title}
            </h3>
            {excerpt ? (
              <p className="mt-3 line-clamp-3 text-sm leading-7 text-muted-foreground">
                {excerpt}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
          {post.tags && post.tags.length > 0 ? (
            <span className="flex min-w-0 flex-wrap gap-1.5">
              {post.tags.slice(0, 4).map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="h-6 rounded-none px-2 text-[11px] font-normal"
                >
                  {tag.name}
                </Badge>
              ))}
            </span>
          ) : (
            <span />
          )}
            <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground transition-colors group-hover:text-foreground">
              查看
              <ArrowRight className="h-4 w-4" suppressHydrationWarning />
            </span>
          </div>
        </div>
      </Link>
    </section>
  );
}

function MomentStream({
  posts,
  sort,
  showAllLink,
}: {
  posts: PostWithTaxonomy[];
  sort: SortOption;
  showAllLink: boolean;
}) {
  const title =
    sort === "popular" ? "热门记录" : sort === "updated" ? "最近更新" : "最新记录";

  return (
    <section aria-labelledby="latest-moments-title" className="space-y-4">
      <div className="flex flex-col gap-2 border-b border-border/30 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Stream
          </p>
          <h2 id="latest-moments-title" className="mt-1 font-serif text-2xl">
            {title}
          </h2>
        </div>
        {showAllLink ? (
          <Link
            href="/moments"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            全部见闻
            <ArrowRight className="h-4 w-4" suppressHydrationWarning />
          </Link>
        ) : null}
      </div>

      <ol className="grid">
        {posts.map((post) => {
          const excerpt = getMomentExcerpt(post);
          const updated =
            post.updated_at.slice(0, 10) !== post.created_at.slice(0, 10);

          return (
            <li key={post.id}>
              <Link
                href={`/blog/${post.slug}`}
                className="group grid min-w-0 gap-3 border-b border-border/25 py-5 transition-colors hover:bg-muted/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50 sm:grid-cols-[88px_minmax(0,1fr)]"
              >
                <time
                  dateTime={post.created_at}
                  className="flex w-fit flex-row items-baseline gap-2 text-xs text-muted-foreground sm:w-full sm:flex-col sm:gap-0"
                >
                  <span className="font-medium text-foreground">
                    {formatMonthDay(post.created_at)}
                  </span>
                  <span>{formatYear(post.created_at)}</span>
                </time>

                <span className="min-w-0">
                  <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
                    {post.category ? (
                      <span className="font-medium text-foreground">
                        {post.category.name}
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5" suppressHydrationWarning />
                      {formatViews(post.view_count)} 阅读
                    </span>
                    {updated ? (
                      <span>更新于 {formatDate(post.updated_at)}</span>
                    ) : null}
                  </span>
                  <span className="mt-2 block truncate font-serif text-xl leading-tight transition-all duration-300 group-hover:italic group-hover:text-primary">
                    {post.title}
                  </span>
                  {excerpt ? (
                    <span className="mt-1.5 block line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {excerpt}
                    </span>
                  ) : null}
                  {post.tags && post.tags.length > 0 ? (
                    <span className="mt-3 flex flex-wrap gap-1.5">
                      {post.tags.slice(0, 4).map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="secondary"
                          className="h-5 rounded-none px-1.5 py-0 text-[10px] font-normal"
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
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
    <section className="py-1">
      <div className="border-b border-border/30 py-3">
        <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="grid">
        {visibleItems.map((item) => {
          const href =
            icon === "category"
              ? `${hrefPrefix}${encodeURIComponent(item.slug)}`
              : `${hrefPrefix}${item.slug}`;

          return (
            <Link
              key={item.id}
              href={href}
              className={cn(
                "group grid min-h-11 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border/20 py-2 text-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                activeSlug === item.slug ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                {icon === "tag" ? (
                  <Hash className="h-3.5 w-3.5" suppressHydrationWarning />
                ) : (
                  <FolderOpen
                    className="h-3.5 w-3.5"
                    suppressHydrationWarning
                  />
                )}
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
