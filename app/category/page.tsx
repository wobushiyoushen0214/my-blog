import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import {
  PublicEmptyState,
  PublicPageHeader,
  PublicPageShell,
} from "@/components/public-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, FolderOpen, Search, X } from "lucide-react";
import type { Metadata } from "next";
import type { Category } from "@/lib/types";

export const metadata: Metadata = {
  title: "所有分类",
};

type CategoryWithCount = Category & { postCount: number };
type CategoryFilterType = "all" | Category["type"];

const DEFAULT_TYPE: CategoryFilterType = "all";

function normalizeQuery(query: string) {
  return query.replace(/[%,()]/g, " ").replace(/\s+/g, " ").trim();
}

function parseType(value?: string): CategoryFilterType {
  return value === "post" || value === "moment" ? value : DEFAULT_TYPE;
}

function categoryTypeLabel(type: Category["type"]) {
  return type === "moment" ? "见闻分类" : "文章分类";
}

function filterTypeLabel(type: CategoryFilterType) {
  if (type === "post") return "文章分类";
  if (type === "moment") return "见闻分类";
  return "全部分类";
}

function buildCategoryPath({
  query,
  type,
}: {
  query?: string;
  type?: CategoryFilterType;
} = {}) {
  const params = new URLSearchParams();

  if (query) params.set("q", query);
  if (type && type !== DEFAULT_TYPE) params.set("type", type);

  const search = params.toString();
  return search ? `/category?${search}` : "/category";
}

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { q, type: typeParam } = await searchParams;
  const rawQuery = q?.trim() || "";
  const query = normalizeQuery(rawQuery);
  const contentType = parseType(typeParam);
  const supabase = await createClient();

  const [{ data: categories }, { data: publishedPosts }] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase.from("posts").select("id, category_id").eq("published", true),
  ]);

  const categoryCounts = (publishedPosts || []).reduce<Map<string, number>>(
    (counts, post) => {
      if (!post.category_id) return counts;
      counts.set(post.category_id, (counts.get(post.category_id) || 0) + 1);
      return counts;
    },
    new Map()
  );

  const categoriesWithCount: CategoryWithCount[] = (categories || []).map(
    (category) => ({
      ...category,
      postCount: categoryCounts.get(category.id) || 0,
    })
  );

  const filteredCategories = categoriesWithCount.filter((category) => {
    const typeMatched = contentType === DEFAULT_TYPE || category.type === contentType;
    if (!typeMatched) return false;
    if (!query) return true;

    const text = [
      category.name,
      category.slug,
      categoryTypeLabel(category.type),
    ]
      .join(" ")
      .toLowerCase();
    return text.includes(query.toLowerCase());
  });

  const postCategories = filteredCategories.filter(
    (category) => category.type !== "moment"
  );
  const momentCategories = filteredCategories.filter(
    (category) => category.type === "moment"
  );
  const allPostCategoryCount = categoriesWithCount.filter(
    (category) => category.type !== "moment"
  ).length;
  const allMomentCategoryCount = categoriesWithCount.filter(
    (category) => category.type === "moment"
  ).length;
  const totalPosts = categoriesWithCount.reduce(
    (sum, category) => sum + category.postCount,
    0
  );
  const filteredPostCount = filteredCategories.reduce(
    (sum, category) => sum + category.postCount,
    0
  );
  const hasFilters = Boolean(query || contentType !== DEFAULT_TYPE);
  const emptyFilteredDescription = query
    ? `没有匹配「${query}」的分类，可以换个关键词或查看全部分类。`
    : `当前没有${filterTypeLabel(contentType)}，可以切换到全部分类查看。`;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <PublicPageShell className="max-w-[1280px]">
        <PublicPageHeader
          eyebrow="Categories"
          title={contentType === DEFAULT_TYPE ? "所有分类" : filterTypeLabel(contentType)}
          description="按主题浏览文章和见闻，快速进入相关内容。"
          countLabel={`${filteredCategories.length} / ${categoriesWithCount.length} 个分类`}
        />

        <CategorySearchBar
          rawQuery={rawQuery}
          contentType={contentType}
          hasFilters={hasFilters}
        />

        <CategoryTypeSwitch query={query} activeType={contentType} />

        <ActiveCategorySummary query={query} contentType={contentType} />

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label={query ? "匹配分类" : "全部分类"}
            value={query ? filteredCategories.length : categoriesWithCount.length}
          />
          <StatTile label="文章分类" value={allPostCategoryCount} />
          <StatTile label="见闻分类" value={allMomentCategoryCount} />
          <StatTile
            label={hasFilters ? "匹配内容" : "已发布内容"}
            value={hasFilters ? filteredPostCount : totalPosts}
          />
        </div>

        {filteredCategories.length > 0 ? (
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="min-w-0 space-y-8">
              <CategorySection
                title="文章分类"
                description="用于长文、技术笔记和项目复盘。"
                categories={postCategories}
              />
              <CategorySection
                title="见闻分类"
                description="用于短内容、片段记录和轻量观察。"
                categories={momentCategories}
              />
            </div>

            <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
              <section className="border bg-card p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  继续浏览
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  不确定主题时，可以直接从文章流或搜索入口继续探索。
                </p>
                <div className="mt-4 grid gap-2">
                  <Button variant="outline" className="justify-between" asChild>
                    <Link href="/posts">
                      文章列表
                      <ArrowRight
                        className="h-4 w-4"
                        suppressHydrationWarning
                      />
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-between" asChild>
                    <Link href="/search">
                      搜索内容
                      <ArrowRight
                        className="h-4 w-4"
                        suppressHydrationWarning
                      />
                    </Link>
                  </Button>
                </div>
              </section>
            </aside>
          </div>
        ) : categoriesWithCount.length > 0 ? (
          <PublicEmptyState
            icon={FolderOpen}
            title="没有匹配的分类"
            description={emptyFilteredDescription}
            action={
              <Button variant="outline" asChild>
                <Link href="/category">查看全部分类</Link>
              </Button>
            }
          />
        ) : (
          <PublicEmptyState
            icon={FolderOpen}
            title="暂无分类"
            description="创建分类后，读者可以按主题找到相关内容。"
          />
        )}
      </PublicPageShell>
      <Footer />
    </div>
  );
}

function CategorySearchBar({
  rawQuery,
  contentType,
  hasFilters,
}: {
  rawQuery: string;
  contentType: CategoryFilterType;
  hasFilters: boolean;
}) {
  return (
    <section className="border bg-card p-3">
      <form
        className="flex flex-col gap-2 sm:flex-row"
        role="search"
        action="/category"
      >
        {contentType !== DEFAULT_TYPE ? (
          <input type="hidden" name="type" value={contentType} />
        ) : null}
        <label htmlFor="category-search" className="sr-only">
          搜索分类
        </label>
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            suppressHydrationWarning
          />
          <Input
            id="category-search"
            type="search"
            name="q"
            defaultValue={rawQuery}
            placeholder="搜索分类名称或 slug..."
            className="h-10 border-border/60 bg-background pl-10"
          />
        </div>
        <Button type="submit" className="h-10">
          <Search className="h-4 w-4" suppressHydrationWarning />
          搜索
        </Button>
        {hasFilters ? (
          <Button variant="outline" className="h-10" asChild>
            <Link href="/category">清除</Link>
          </Button>
        ) : null}
      </form>
    </section>
  );
}

function CategoryTypeSwitch({
  query,
  activeType,
}: {
  query: string;
  activeType: CategoryFilterType;
}) {
  const items: Array<{ value: CategoryFilterType; label: string }> = [
    { value: "all", label: "全部" },
    { value: "post", label: "文章分类" },
    { value: "moment", label: "见闻分类" },
  ];

  return (
    <nav
      aria-label="分类类型"
      className="-mx-4 mt-4 flex gap-2 overflow-x-auto border-b border-border/50 px-4 pb-4 md:mx-0 md:px-0"
    >
      {items.map((item) => (
        <Link
          key={item.value}
          href={buildCategoryPath({ query, type: item.value })}
          aria-current={activeType === item.value ? "page" : undefined}
          className={`inline-flex h-9 shrink-0 items-center rounded-md border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
            activeType === item.value
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-border/60 bg-background text-muted-foreground hover:border-primary/30 hover:text-primary"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function ActiveCategorySummary({
  query,
  contentType,
}: {
  query: string;
  contentType: CategoryFilterType;
}) {
  const hasFilters = Boolean(query || contentType !== DEFAULT_TYPE);
  if (!hasFilters) return null;

  return (
    <section className="mt-3 flex flex-col gap-2 border border-border/70 bg-muted/20 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">当前筛选</span>
        {query ? (
          <FilterPill
            label={`关键词：${query}`}
            href={buildCategoryPath({ type: contentType })}
          />
        ) : null}
        {contentType !== DEFAULT_TYPE ? (
          <FilterPill
            label={`类型：${filterTypeLabel(contentType)}`}
            href={buildCategoryPath({ query })}
          />
        ) : null}
      </div>
      <Link
        href="/category"
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

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function CategorySection({
  title,
  description,
  categories,
}: {
  title: string;
  description: string;
  categories: CategoryWithCount[];
}) {
  if (categories.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="border-b border-border/50 pb-3">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Browse
        </p>
        <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-medium">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
          <span className="text-sm text-muted-foreground">
            {categories.length} 个
          </span>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/category/${category.slug}`}
            className="group border bg-card p-4 transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Badge variant="outline" className="rounded-md font-normal">
                  {categoryTypeLabel(category.type)}
                </Badge>
                <h3 className="mt-3 truncate font-serif text-xl leading-tight transition-opacity group-hover:opacity-70">
                  {category.name}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {category.postCount} 篇内容
                </p>
              </div>
              <ArrowRight
                className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
                suppressHydrationWarning
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
