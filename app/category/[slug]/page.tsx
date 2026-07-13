import Link from "next/link";
import { notFound } from "next/navigation";
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
  PublicFilterSummary,
  PublicMetaPill,
  PublicPageShell,
  publicPrimaryButtonClassName,
  publicSecondaryButtonClassName,
  publicSelectClassName,
} from "@/components/public-page";
import { FolderOpen, Search } from "lucide-react";
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

type PostTagRow = { post_id: string; tag_id: string };

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
    { data: tags },
    { data: allPostTags },
  ] = await Promise.all([
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("published", true)
      .eq("category_id", typedCategory.id),
    supabase.from("tags").select("*").order("name"),
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

  const postTagRows = (allPostTags || []) as PostTagRow[];
  const tagRows = (tags || []) as Tag[];
  const postsWithTags = attachTagsFromRows(
    (posts || []) as unknown as PostWithTaxonomy[],
    postTagRows,
    tagRows
  );

  const hasFilters = Boolean(searchQuery || sort !== DEFAULT_SORT);
  const basePath = buildCategoryPath({ slug, searchQuery, sort });
  const categoryTypeLabel = getCategoryTypeLabel(typedCategory.type);
  const contentListHref = getContentListHref(typedCategory.type);

  return (
    <DeviceShell>
      <div className="public-device-layout">
      <Header />
      <PublicPageShell>
        <PublicCompactHeader
          title={typedCategory.name}
          description={`该${categoryTypeLabel}下的已发布内容。`}
          backHref="/category"
          backLabel="所有分类"
          meta={
            <>
              <PublicMetaPill>当前 {totalCount}</PublicMetaPill>
              <PublicMetaPill>共 {totalCategoryCount || 0}</PublicMetaPill>
              <PublicMetaPill>
                {hasFilters ? "已筛选" : getSortLabel(sort)}
              </PublicMetaPill>
            </>
          }
        />

        {totalCategoryCount ? (
          <PublicControlStrip>
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
          </PublicControlStrip>
        ) : null}

        {(postsWithTags || []).length > 0 ? (
          <div className="space-y-8">
            <section aria-label={`${categoryTypeLabel}列表`}>
              <div className="grid gap-3">
                {postsWithTags.map((post) => (
                  <ContentRow key={post.id} post={post} variant="index" />
                ))}
              </div>
            </section>

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              basePath={basePath}
            />
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
    </DeviceShell>
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
    <form
      action={`/category/${encodeURIComponent(slug)}`}
      aria-label="分类内容筛选"
      className="signal-panel flex flex-col gap-2 p-4 sm:flex-row sm:items-center"
    >
      {rawQuery ? <input type="hidden" name="q" value={rawQuery} /> : null}
      <label htmlFor="category-detail-sort" className="sr-only">
        分类内容排序
      </label>
      <select
        id="category-detail-sort"
        name="sort"
        defaultValue={sort}
        className={`${publicSelectClassName} sm:w-40`}
      >
        <option value="newest">最新发布</option>
        <option value="updated">最近更新</option>
        <option value="popular">阅读最多</option>
      </select>
      <button type="submit" className={publicPrimaryButtonClassName}>
        应用
      </button>
      {hasFilters ? (
        <Link
          href={buildCategoryPath({ slug })}
          className={publicSecondaryButtonClassName}
        >
          清除
        </Link>
      ) : null}
    </form>
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
    <PublicFilterSummary clearHref={buildCategoryPath({ slug })}>
      {searchQuery ? (
        <PublicFilterPill
          label={`关键词：${searchQuery}`}
          href={buildCategoryPath({ slug, sort })}
        />
      ) : null}
      {sort !== DEFAULT_SORT ? (
        <PublicFilterPill
          label={`排序：${getSortLabel(sort)}`}
          href={buildCategoryPath({ slug, searchQuery })}
        />
      ) : null}
    </PublicFilterSummary>
  );
}
