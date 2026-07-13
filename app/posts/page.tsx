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
import { FileText } from "lucide-react";
import type { Category, Post, Tag } from "@/lib/types";

const PAGE_SIZE = 10;
const DEFAULT_SORT = "newest";

type SortOption = "newest" | "updated" | "popular";

type CategorySummary = Category & { postCount: number };
type PostWithTaxonomy = Post & {
  category?: Pick<Category, "name" | "slug" | "type"> | null;
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
  const postsWithTags = attachTagsFromMap(
    (posts || []) as unknown as PostWithTaxonomy[],
    tagsByPostId
  );

  const basePath = buildPostsPath({
    categorySlug: activeCategorySlug,
    searchQuery,
    sort,
  });
  const allArticleCount = allArticlePosts?.length || 0;

  return (
    <DeviceShell>
      <div className="public-device-layout">
      <Header />
      <PublicPageShell>
        <PublicCompactHeader
          title={
            categoryName
              ? `文章 · ${categoryName}`
              : searchQuery
                ? `文章 · ${searchQuery}`
                : "文章"
          }
          description="技术笔记、项目复盘与长期主题。按时间索引扫读。"
          meta={
            <span className="text-[13px] text-muted-foreground">
              {allArticleCount} 篇
            </span>
          }
        />

        <PublicControlStrip>
          <div className="signal-panel flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
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
              sort={sort}
            />
          </div>
          <ActiveFilterSummary
            categoryName={categoryName}
            categorySlug={activeCategorySlug}
            searchQuery={searchQuery}
            sort={sort}
          />
        </PublicControlStrip>

        {postsWithTags.length > 0 ? (
          <div className="space-y-8">
            <section aria-label="文章列表">
              <div className="grid gap-3">
                {postsWithTags.map((post) => (
                  <ContentRow
                    key={post.id}
                    post={post}
                    typeLabel="文章"
                    variant="index"
                  />
                ))}
              </div>
            </section>

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              basePath={basePath}
            />
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
    <nav aria-label="文章分类">
      <PublicFilterRow label="分类">
        <PublicPillLink
          href={buildPostsPath({ searchQuery, sort })}
          active={!activeSlug}
          ariaCurrent={!activeSlug ? "page" : undefined}
        >
          全部
          <span className="text-muted-foreground/50">{totalCount}</span>
        </PublicPillLink>
        {categories.map((category) => (
          <PublicPillLink
            key={category.id}
            href={buildPostsPath({
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
    <nav aria-label="文章排序">
      <PublicFilterRow label="排序">
        {sortItems.map((item) => (
          <PublicPillLink
            key={item.value}
            href={buildPostsPath({
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
    <PublicFilterSummary clearHref="/posts">
        {categoryName ? (
          <PublicFilterPill
            label={`分类：${categoryName}`}
            href={buildPostsPath({ searchQuery, sort })}
          />
        ) : null}
        {searchQuery ? (
          <PublicFilterPill
            label={`关键词：${searchQuery}`}
            href={buildPostsPath({ categorySlug, sort })}
          />
        ) : null}
        {sort !== DEFAULT_SORT ? (
          <PublicFilterPill
            label={`排序：${getSortLabel(sort)}`}
            href={buildPostsPath({ categorySlug, searchQuery })}
          />
        ) : null}
    </PublicFilterSummary>
  );
}
