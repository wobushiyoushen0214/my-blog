import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ContentRow } from "@/components/content-row";
import { Pagination } from "@/components/pagination";
import {
  PublicActionLink,
  PublicEmptyState,
  PublicPageShell,
} from "@/components/public-page";
import { Input } from "@/components/ui/input";
import { ArrowLeft, FolderOpen, Search, X } from "lucide-react";
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
    <div className="flex min-h-screen flex-col">
      <Header />
      <PublicPageShell className="max-w-[960px] py-10 md:py-12">
        <CategoryHero
          category={typedCategory}
          categoryTypeLabel={categoryTypeLabel}
          totalCount={totalCount}
          totalCategoryCount={totalCategoryCount || 0}
          sort={sort}
          hasFilters={hasFilters}
        />

        {totalCategoryCount ? (
          <>
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
          </>
        ) : null}

        {(postsWithTags || []).length > 0 ? (
          <div className="mt-8 space-y-8">
            <section aria-label={`${categoryTypeLabel}列表`} className="border-t border-border/60">
              <div className="grid">
                {postsWithTags.map((post) => (
                  <ContentRow key={post.id} post={post} />
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
  );
}

function CategoryHero({
  category,
  categoryTypeLabel,
  totalCount,
  totalCategoryCount,
  sort,
  hasFilters,
}: {
  category: Category;
  categoryTypeLabel: string;
  totalCount: number;
  totalCategoryCount: number;
  sort: SortOption;
  hasFilters: boolean;
}) {
  return (
    <header className="mb-8 border-b border-border/60 pb-6">
      <Link
        href="/category"
        className="mb-5 inline-flex h-9 items-center gap-2 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <ArrowLeft className="h-4 w-4" suppressHydrationWarning />
        所有分类
      </Link>

      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">
          Category
        </p>
        <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
          {category.name}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          该{categoryTypeLabel}下的已发布内容，可在当前主题内搜索和排序。
        </p>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        当前 {totalCount} · 共 {totalCategoryCount} ·{" "}
        {hasFilters ? "已筛选" : getSortLabel(sort)}
      </p>
    </header>
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
    <section className="border-b border-border/60 pb-5">
      <form
        action={`/category/${encodeURIComponent(slug)}`}
        role="search"
        className="grid gap-2 md:grid-cols-[minmax(0,1fr)_160px_auto_auto]"
      >
        <label htmlFor="category-detail-search" className="sr-only">
          搜索当前分类
        </label>
        <div className="relative min-w-0">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            suppressHydrationWarning
          />
          <Input
            id="category-detail-search"
            type="search"
            name="q"
            defaultValue={rawQuery}
            placeholder="在当前分类中搜索标题、摘要或正文..."
            className="h-10 rounded-md border-border/60 bg-background pl-10 shadow-none hover:bg-muted/30 focus-visible:bg-background"
          />
        </div>
        <label htmlFor="category-detail-sort" className="sr-only">
          分类内容排序
        </label>
        <select
          id="category-detail-sort"
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
            href={buildCategoryPath({ slug })}
            className="inline-flex h-10 items-center justify-center rounded-md border border-border/60 px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            清除
          </Link>
        ) : null}
      </form>
    </section>
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
    <section className="mt-4 flex flex-col gap-2 border-l border-border/50 px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">当前筛选</span>
        {searchQuery ? (
          <FilterPill
            label={`关键词：${searchQuery}`}
            href={buildCategoryPath({ slug, sort })}
          />
        ) : null}
        {sort !== DEFAULT_SORT ? (
          <FilterPill
            label={`排序：${getSortLabel(sort)}`}
            href={buildCategoryPath({ slug, searchQuery })}
          />
        ) : null}
      </div>
      <Link
        href={buildCategoryPath({ slug })}
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
