import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PostCard } from "@/components/post-card";
import { Pagination } from "@/components/pagination";
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

type CategorySummary = Category & { postCount: number };
type TagSummary = Tag & { postCount: number };
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

function getContentListHref(type: SearchType) {
  if (type === "moment") return "/moments";
  return "/posts";
}

function getContentListLabel(type: SearchType) {
  if (type === "moment") return "见闻列表";
  return "文章列表";
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

  const categoryPostCounts = (publishedPosts || []).reduce<Map<string, number>>(
    (counts, post) => {
      if (!post.category_id) return counts;
      counts.set(post.category_id, (counts.get(post.category_id) || 0) + 1);
      return counts;
    },
    new Map()
  );
  const tagPostCounts = postTagRows.reduce<Map<string, Set<string>>>(
    (counts, postTag) => {
      if (!publishedPostIds.has(postTag.post_id)) return counts;
      const current = counts.get(postTag.tag_id) || new Set<string>();
      current.add(postTag.post_id);
      counts.set(postTag.tag_id, current);
      return counts;
    },
    new Map()
  );
  const categorySummaries: CategorySummary[] = categoryRows.map((category) => ({
    ...category,
    postCount: categoryPostCounts.get(category.id) || 0,
  }));
  const tagSummaries: TagSummary[] = tagRows.map((item) => ({
    ...item,
    postCount: tagPostCounts.get(item.id)?.size || 0,
  }));

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
  const featuredPost =
    page === 1 &&
    !searchQuery &&
    contentType === DEFAULT_TYPE &&
    sort === DEFAULT_SORT
      ? postsWithTags[0] || null
      : null;
  const listPosts = featuredPost ? postsWithTags.slice(1) : postsWithTags;
  const basePath = buildTagPath({ slug, searchQuery, type: contentType, sort });
  const countLabel = hasFilters
    ? `${count} / ${totalTaggedCount} 篇`
    : `${totalTaggedCount} 篇`;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <PublicPageShell className="max-w-[1280px]">
        <PublicPageHeader
          eyebrow="Tag"
          title={tag.name}
          description="该标签关联的已发布内容，可按类型、关键词和排序继续交叉浏览。"
          countLabel={countLabel}
          backHref="/tag"
          backLabel="所有标签"
          action={
            <Button variant="outline" asChild>
              <Link href="/search">
                <Search className="h-4 w-4" suppressHydrationWarning />
                搜索
              </Link>
            </Button>
          }
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
          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0 space-y-8">
              <section className="grid gap-3 sm:grid-cols-3">
                <StatTile label="当前结果" value={count} />
                <StatTile label="全部关联" value={totalTaggedCount} />
                <StatTile label="排序" value={getSortLabel(sort)} />
              </section>

              {featuredPost ? (
                <section className="space-y-3">
                  <SectionTitle eyebrow="Featured" title="标签精选" />
                  <PostCard post={featuredPost} variant="featured" />
                </section>
              ) : null}

              {listPosts.length > 0 ? (
                <section className="space-y-4">
                  <SectionTitle
                    eyebrow="Latest"
                    title={
                      sort === "popular"
                        ? "热门内容"
                        : sort === "updated"
                          ? "最近更新"
                          : featuredPost
                            ? "更多内容"
                            : "最新内容"
                    }
                  />
                  <div className="grid gap-2">
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
              <TaxonomyPanel
                title="相关标签"
                description="继续切换到相邻关键词。"
                items={tagSummaries.filter((item) => item.id !== tag.id)}
                hrefFor={(item) => `/tag/${item.slug}`}
                activeSlug={tag.slug}
                icon="tag"
                limit={16}
              />
              <TaxonomyPanel
                title="分类"
                description="按长期主题浏览。"
                items={categorySummaries}
                hrefFor={(item) => `/category/${item.slug}`}
                icon="category"
                limit={10}
              />
              <section className="border bg-card p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  继续浏览
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  可以切换到内容流，或进入搜索页扩大范围。
                </p>
                <div className="mt-4 grid gap-2">
                  <Button variant="outline" className="justify-between" asChild>
                    <Link href={getContentListHref(contentType)}>
                      {getContentListLabel(contentType)}
                      <ArrowRight className="h-4 w-4" suppressHydrationWarning />
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-between" asChild>
                    <Link href="/search">
                      搜索内容
                      <Search className="h-4 w-4" suppressHydrationWarning />
                    </Link>
                  </Button>
                </div>
              </section>
            </aside>
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
              <Button variant="outline" asChild>
                <Link href={`/tag/${encodeURIComponent(slug)}`}>清除筛选</Link>
              </Button>
            }
          />
        ) : (
          <PublicEmptyState
            icon={Hash}
            title="该标签下暂无内容"
            description="后续关联到这个标签的内容会展示在这里。"
            action={
              <Button variant="outline" asChild>
                <Link href="/posts">查看全部文章</Link>
              </Button>
            }
          />
        )}
      </PublicPageShell>
      <Footer />
    </div>
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
    <section className="border bg-card p-3">
      <form
        action={`/tag/${encodeURIComponent(slug)}`}
        role="search"
        className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_150px_150px_auto_auto]"
      >
        <label htmlFor="tag-detail-search" className="sr-only">
          搜索当前标签
        </label>
        <div className="relative min-w-0">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            suppressHydrationWarning
          />
          <Input
            id="tag-detail-search"
            type="search"
            name="q"
            defaultValue={rawQuery}
            placeholder="在当前标签中搜索标题、摘要或正文..."
            className="h-10 border-border/60 bg-background pl-10"
          />
        </div>
        <label htmlFor="tag-detail-type" className="sr-only">
          标签内容类型
        </label>
        <select
          id="tag-detail-type"
          name="type"
          defaultValue={contentType}
          className="h-10 rounded-md border border-border/60 bg-background px-3 text-sm text-foreground outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
          className="h-10 rounded-md border border-border/60 bg-background px-3 text-sm text-foreground outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <option value="newest">最新发布</option>
          <option value="updated">最近更新</option>
          <option value="popular">阅读最多</option>
        </select>
        <Button type="submit" className="h-10">
          筛选
        </Button>
        {hasFilters ? (
          <Button variant="outline" className="h-10" asChild>
            <Link href={buildTagPath({ slug })}>清除</Link>
          </Button>
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
    <section className="mt-3 flex flex-col gap-2 border border-border/70 bg-muted/20 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">当前筛选</span>
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

function StatTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="border-b border-border/50 pb-3">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-base font-medium">{title}</h2>
    </div>
  );
}

function TaxonomyPanel<
  T extends { id: string; slug: string; name: string; postCount: number },
>({
  title,
  description,
  items,
  hrefFor,
  activeSlug,
  icon,
  limit,
}: {
  title: string;
  description: string;
  items: T[];
  hrefFor: (item: T) => string;
  activeSlug?: string;
  icon: "category" | "tag";
  limit: number;
}) {
  const visibleItems = items
    .filter((item) => item.postCount > 0)
    .sort((a, b) => b.postCount - a.postCount)
    .slice(0, limit);

  if (visibleItems.length === 0) return null;

  return (
    <section className="border bg-card">
      <div className="border-b px-4 py-3">
        <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </h2>
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
              variant={activeSlug === item.slug ? "default" : "outline"}
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
