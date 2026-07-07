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
  PublicEmptyState,
  PublicPageShell,
} from "@/components/public-page";
import { ArrowLeft, Hash, Search, X } from "lucide-react";
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
      <PublicPageShell className="py-9 md:py-12">
        <TagHero
          tagName={tag.name}
          countLabel={countLabel}
          count={count}
          totalTaggedCount={totalTaggedCount}
          contentType={contentType}
          sort={sort}
          hasFilters={hasFilters}
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
          <div className="mt-8 space-y-8">
            <section
              aria-label={`${getSearchTypeLabel(contentType)}列表`}
              className="border-t border-border/60"
            >
              <div className="grid">
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

function TagHero({
  tagName,
  countLabel,
  count,
  totalTaggedCount,
  contentType,
  sort,
  hasFilters,
}: {
  tagName: string;
  countLabel: string;
  count: number;
  totalTaggedCount: number;
  contentType: SearchType;
  sort: SortOption;
  hasFilters: boolean;
}) {
  return (
    <header className="pixel-frame mb-7 p-4 md:p-5">
      <Link
        href="/tag"
        className="mb-5 inline-flex h-9 items-center gap-2 border border-border bg-background px-2 font-mono text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <ArrowLeft className="h-4 w-4" suppressHydrationWarning />
        所有标签
      </Link>

      <div className="min-w-0">
        <p className="pixel-label text-primary">
          Tag
        </p>
        <h1 className="mt-2 text-2xl font-semibold leading-tight md:text-3xl">
          &gt; #{tagName}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          该标签关联的已发布内容。
        </p>
      </div>
      <p className="mt-4 inline-flex border border-border bg-muted/60 px-2 py-1 font-mono text-xs text-muted-foreground">
        {countLabel} · 当前 {count} · 共 {totalTaggedCount} ·{" "}
        {hasFilters ? getSearchTypeLabel(contentType) : getSortLabel(sort)}
      </p>
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
    <section className="border-b border-border/80 pb-5">
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
          className="h-10 border border-border bg-background px-3 font-mono text-sm text-foreground shadow-[2px_2px_0_var(--terminal-shadow)] outline-none transition-[border-color,background-color,box-shadow] hover:border-primary hover:bg-accent focus-visible:border-ring focus-visible:bg-background focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:w-40"
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
          className="h-10 border border-border bg-background px-3 font-mono text-sm text-foreground shadow-[2px_2px_0_var(--terminal-shadow)] outline-none transition-[border-color,background-color,box-shadow] hover:border-primary hover:bg-accent focus-visible:border-ring focus-visible:bg-background focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:w-40"
        >
          <option value="newest">最新发布</option>
          <option value="updated">最近更新</option>
          <option value="popular">阅读最多</option>
        </select>
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center border border-primary bg-primary px-4 font-mono text-sm font-medium text-primary-foreground shadow-[2px_2px_0_var(--terminal-shadow)] transition-colors hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          应用
        </button>
        {hasFilters ? (
          <Link
            href={buildTagPath({ slug })}
            className="inline-flex h-10 items-center justify-center border border-border bg-background px-4 font-mono text-sm font-medium text-muted-foreground shadow-[2px_2px_0_var(--terminal-shadow)] transition-colors hover:border-primary hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
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
    <section className="mt-3 flex flex-col gap-2 border-b border-border/70 pb-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="font-mono text-xs text-primary">FILTER</span>
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
        className="inline-flex h-8 shrink-0 items-center justify-center border border-border bg-background px-2 font-mono text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
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
      className="inline-flex h-7 max-w-full items-center gap-1.5 border border-border bg-muted/60 px-2 font-mono text-xs text-foreground transition-colors hover:border-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      aria-label={`移除${label}`}
    >
      <span className="truncate">{label}</span>
      <X className="h-3 w-3 shrink-0" suppressHydrationWarning />
    </Link>
  );
}
