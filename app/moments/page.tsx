import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { DeviceShell } from "@/components/device-shell";
import { ContentRow } from "@/components/content-row";
import { Pagination } from "@/components/pagination";
import {
  PublicActionLink,
  PublicCompactHeader,
  PublicControlStrip,
  PublicEmptyState,
  PublicFilterPill,
  PublicFilterRow,
  PublicFilterSummary,
  PublicPageShell,
  PublicPillLink,
} from "@/components/public-page";
import {
  NotebookText,
} from "lucide-react";
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
        <PublicCompactHeader
          title={
            activeCategory
              ? `见闻 · ${activeCategory.name}`
              : searchQuery
                ? `见闻 · ${searchQuery}`
                : "见闻"
          }
          description="轻量观察、摘录和阶段性记录。以时间流呈现。"
          meta={
            <span className="text-[13px] text-muted-foreground">
              {totalMomentCount} 条
            </span>
          }
        />

        <PublicControlStrip>
          <div className="flex flex-col gap-3 border-b border-border/70 pb-4 lg:flex-row lg:items-center lg:justify-between">
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
          </div>
          <ActiveFilterSummary
            categoryName={activeCategory?.name ?? null}
            categorySlug={activeCategorySlug}
            searchQuery={searchQuery}
            sort={sort}
          />
        </PublicControlStrip>

        {postsWithTags.length > 0 ? (
          <div className="space-y-8">
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
    <nav aria-label="见闻分类">
      <PublicFilterRow label="分类">
        <PublicPillLink
          href={buildMomentsPath({ searchQuery, sort })}
          active={!activeSlug}
          ariaCurrent={!activeSlug ? "page" : undefined}
        >
          全部
          <span className="text-muted-foreground/50">{totalCount}</span>
        </PublicPillLink>
        {categories.map((category) => (
          <PublicPillLink
            key={category.id}
            href={buildMomentsPath({
              categorySlug: category.slug,
              searchQuery,
              sort,
            })}
            active={activeSlug === category.slug}
            ariaCurrent={
              activeSlug === category.slug ? "page" : undefined
            }
          >
            {category.name}
            <span className="text-muted-foreground/50">
              {category.postCount}
            </span>
          </PublicPillLink>
        ))}
      </PublicFilterRow>
    </nav>
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
  const sortItems: Array<{ value: SortOption; label: string }> = [
    { value: "newest", label: "最新" },
    { value: "updated", label: "更新" },
    { value: "popular", label: "热读" },
  ];

  return (
    <nav aria-label="见闻排序">
      <PublicFilterRow label="排序">
        {sortItems.map((item) => (
          <PublicPillLink
            key={item.value}
            href={buildMomentsPath({
              categorySlug,
              searchQuery,
              sort: item.value,
            })}
            active={sort === item.value}
            ariaCurrent={sort === item.value ? "page" : undefined}
          >
            {item.label}
          </PublicPillLink>
        ))}
      </PublicFilterRow>
    </nav>
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
    <PublicFilterSummary clearHref="/moments">
        {categoryName ? (
          <PublicFilterPill
            label={`分类：${categoryName}`}
            href={buildMomentsPath({ searchQuery, sort })}
          />
        ) : null}
        {searchQuery ? (
          <PublicFilterPill
            label={`关键词：${searchQuery}`}
            href={buildMomentsPath({ categorySlug, sort })}
          />
        ) : null}
        {sort !== DEFAULT_SORT ? (
          <PublicFilterPill
            label={`排序：${getSortLabel(sort)}`}
            href={buildMomentsPath({ categorySlug, searchQuery })}
          />
        ) : null}
    </PublicFilterSummary>
  );
}

function MomentStream({
  posts,
}: {
  posts: PostWithTaxonomy[];
}) {
  return (
    <section aria-label="见闻列表" className="max-w-3xl">
      <ol className="grid gap-3">
        {posts.map((post) => {
          const updated =
            post.updated_at.slice(0, 10) !== post.created_at.slice(0, 10);

          return (
            <li key={post.id}>
              <ContentRow
                post={post}
                dateLabel={`${formatMonthDay(post.created_at)} · ${formatYear(post.created_at)}`}
                typeLabel="见闻"
                variant="stream"
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
