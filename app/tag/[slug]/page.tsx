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
  publicSelectClassName,
} from "@/components/public-page";
import { Hash, Search } from "lucide-react";
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
  const basePath = buildTagPath({ slug, searchQuery, type: contentType, sort });
  const countLabel = hasFilters
    ? `${count} / ${totalTaggedCount} 篇`
    : `${totalTaggedCount} 篇`;

  return (
    <DeviceShell>
      <div className="public-device-layout">
      <Header />
      <PublicPageShell>
        <PublicCompactHeader
          eyebrow="Tag"
          title={`#${tag.name}`}
          description="该标签关联的已发布内容。"
          backHref="/tag"
          backLabel="所有标签"
          meta={
            <>
              <PublicMetaPill>{countLabel}</PublicMetaPill>
              <PublicMetaPill>当前 {count}</PublicMetaPill>
              <PublicMetaPill>共 {totalTaggedCount}</PublicMetaPill>
              <PublicMetaPill>
                {hasFilters ? getSearchTypeLabel(contentType) : getSortLabel(sort)}
              </PublicMetaPill>
            </>
          }
        />

        {totalTaggedCount > 0 ? (
          <PublicControlStrip>
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
          </PublicControlStrip>
        ) : null}

        {postsWithTags.length > 0 ? (
          <div className="space-y-8">
            <section
              aria-label={`${getSearchTypeLabel(contentType)}列表`}
            >
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {postsWithTags.map((post) => (
                  <ContentRow
                    key={post.id}
                    post={post}
                    typeLabel={getSearchTypeLabel(
                      post.category?.type === "moment" ? "moment" : "post"
                    )}
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
    </DeviceShell>
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
    <form
      action={`/tag/${encodeURIComponent(slug)}`}
      aria-label="标签内容筛选"
      className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center"
    >
      {rawQuery ? <input type="hidden" name="q" value={rawQuery} /> : null}
      <label htmlFor="tag-detail-type" className="sr-only">
        标签内容类型
      </label>
      <select
        id="tag-detail-type"
        name="type"
        defaultValue={contentType}
        className={`${publicSelectClassName} sm:w-40`}
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
          href={buildTagPath({ slug })}
          className="inline-flex h-9 items-center justify-center rounded-full border border-neutral-200 bg-transparent px-4 font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-500 transition-colors hover:border-neutral-400 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-700 dark:hover:text-white"
        >
          清除
        </Link>
      ) : null}
    </form>
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
    <PublicFilterSummary clearHref={buildTagPath({ slug })}>
      {searchQuery ? (
        <PublicFilterPill
          label={`关键词：${searchQuery}`}
          href={buildTagPath({ slug, type: contentType, sort })}
        />
      ) : null}
      {contentType !== DEFAULT_TYPE ? (
        <PublicFilterPill
          label={`类型：${getSearchTypeLabel(contentType)}`}
          href={buildTagPath({ slug, searchQuery, sort })}
        />
      ) : null}
      {sort !== DEFAULT_SORT ? (
        <PublicFilterPill
          label={`排序：${getSortLabel(sort)}`}
          href={buildTagPath({ slug, searchQuery, type: contentType })}
        />
      ) : null}
    </PublicFilterSummary>
  );
}
