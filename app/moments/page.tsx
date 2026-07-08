import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { DeviceShell } from "@/components/device-shell";
import { ContentRow } from "@/components/content-row";
import { Pagination } from "@/components/pagination";
import {
  PublicActionLink,
  PublicEmptyState,
  PublicPageShell,
} from "@/components/public-page";
import { cn } from "@/lib/utils";
import {
  NotebookText,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import type { Category, Post, Tag } from "@/lib/types";

const PAGE_SIZE = 10;
const DEFAULT_SORT = "newest";

type SortOption = "newest" | "updated" | "popular";

type CategorySummary = Category & { postCount: number };
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

  const basePath = buildMomentsPath({
    categorySlug: activeCategorySlug,
    searchQuery,
    sort,
  });

  return (
    <DeviceShell>
      <div className="public-device-layout">
      <Header />
      <PublicPageShell>
        <MomentHero
          title={
            activeCategory
              ? `见闻 · ${activeCategory.name}`
              : searchQuery
                ? `见闻 · ${searchQuery}`
                : "见闻"
          }
          description="轻量观察、摘录和阶段性记录。"
          totalCount={totalCount}
          allCount={totalMomentCount}
          categoryName={activeCategory?.name ?? null}
          searchQuery={searchQuery}
          sort={sort}
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
          sort={sort}
        />

        <ActiveFilterSummary
          categoryName={activeCategory?.name ?? null}
          categorySlug={activeCategorySlug}
          searchQuery={searchQuery}
          sort={sort}
        />

        {postsWithTags.length > 0 ? (
          <div className="mt-8 space-y-8">
            <MomentStream posts={postsWithTags} />

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              basePath={basePath}
            />

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
    </DeviceShell>
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
}: {
  title: string;
  description: string;
  totalCount: number;
  allCount: number;
  categoryName: string | null;
  searchQuery: string;
  sort: SortOption;
}) {
  const context = categoryName
    ? `分类 / ${categoryName}`
    : searchQuery
      ? `关键词 / ${searchQuery}`
      : "全部见闻";

  return (
    <header className="mb-7 rounded-md border border-neutral-200 bg-white p-5 dark:border-[#262626] dark:bg-neutral-900/10 md:p-6">
      <div className="min-w-0">
        <p className="font-sans text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400 dark:text-neutral-500">
          Moments
        </p>
        <h1 className="mt-2 font-serif text-2xl font-light italic leading-tight text-slate-950 dark:text-white md:text-3xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">
          {description}
        </p>
      </div>
      <p className="mt-4 inline-flex rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-400">
        {context} · 当前 {totalCount} · 共 {allCount} · {getSortLabel(sort)}
      </p>
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
      className="-mx-4 flex gap-2 overflow-x-auto border-b border-neutral-100 px-4 pb-4 dark:border-[#262626] sm:mx-0 sm:px-0"
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
        "inline-flex h-8 shrink-0 items-center gap-2 rounded-full border px-3 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        active
          ? "border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-black"
          : "border-neutral-200 bg-transparent text-neutral-400 hover:border-neutral-400 hover:text-slate-950 dark:border-neutral-800 dark:text-neutral-500 dark:hover:border-neutral-600 dark:hover:text-white"
      )}
    >
      {children}
    </Link>
  );
}

function ListFilterBar({
  categorySlug,
  searchQuery,
  sort,
}: {
  categorySlug?: string;
  searchQuery: string;
  sort: SortOption;
}) {
  const hasFilters = Boolean(searchQuery || sort !== DEFAULT_SORT);

  return (
    <section className="mt-4 border-b border-neutral-100 pb-4 dark:border-[#262626]">
      <form
        action="/moments"
        aria-label="见闻筛选"
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        {categorySlug ? (
          <input type="hidden" name="category" value={categorySlug} />
        ) : null}
        {searchQuery ? <input type="hidden" name="q" value={searchQuery} /> : null}
        <label htmlFor="moments-sort" className="sr-only">
          见闻排序
        </label>
        <select
          id="moments-sort"
          name="sort"
          defaultValue={sort}
          className="h-9 rounded-full border border-neutral-200 bg-neutral-50/50 px-3 font-mono text-[10px] uppercase tracking-wider text-neutral-600 outline-none transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-ring/50 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-300 dark:hover:bg-[#0a0a0a] sm:w-40"
        >
          <option value="newest">最新发布</option>
          <option value="updated">最近更新</option>
          <option value="popular">阅读最多</option>
        </select>
        <button
          type="submit"
          className="inline-flex h-9 items-center justify-center rounded-full border border-neutral-950 bg-neutral-950 px-4 font-mono text-[10px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:border-white dark:bg-white dark:text-black dark:hover:bg-neutral-200"
        >
          应用
        </button>
        {hasFilters ? (
          <Link
            href={buildMomentsPath({ categorySlug })}
            className="inline-flex h-9 items-center justify-center rounded-full border border-neutral-200 bg-transparent px-4 font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-500 transition-colors hover:border-neutral-400 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-700 dark:hover:text-white"
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
    <section className="mt-3 flex flex-col gap-2 border-b border-neutral-100 pb-3 dark:border-[#262626] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">FILTER</span>
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
        className="inline-flex h-8 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-transparent px-3 font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-500 transition-colors hover:border-neutral-400 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-700 dark:hover:text-white"
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
      className="inline-flex h-7 max-w-full items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 font-mono text-[10px] text-neutral-600 transition-colors hover:border-neutral-400 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-400 dark:hover:border-neutral-700 dark:hover:text-white"
      aria-label={`移除${label}`}
    >
      <span className="truncate">{label}</span>
      <X className="h-3 w-3 shrink-0" suppressHydrationWarning />
    </Link>
  );
}

function MomentStream({
  posts,
}: {
  posts: PostWithTaxonomy[];
}) {
  return (
    <section aria-label="见闻列表" className="border-t border-neutral-100 pt-6 dark:border-[#262626]">
      <ol className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {posts.map((post) => {
          const updated =
            post.updated_at.slice(0, 10) !== post.created_at.slice(0, 10);

          return (
            <li key={post.id}>
              <ContentRow
                post={post}
                dateLabel={`${formatMonthDay(post.created_at)} ${formatYear(post.created_at)}`}
                typeLabel="见闻"
                meta={[
                  "见闻",
                  ...(post.category?.name ? [post.category.name] : []),
                  ...(updated ? [`更新于 ${formatDate(post.updated_at)}`] : []),
                ]}
                rightMeta={[`${formatViews(post.view_count)} 阅读`]}
              />
            </li>
          );
        })}
      </ol>
    </section>
  );
}
