import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import {
  PublicActionLink,
  PublicEmptyState,
  PublicIndexLinks,
  PublicPageShell,
} from "@/components/public-page";
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
      <PublicPageShell className="max-w-[1240px] py-14 md:py-20">
        <CategoryIndexHero
          title={contentType === DEFAULT_TYPE ? "所有分类" : filterTypeLabel(contentType)}
          filteredCount={filteredCategories.length}
          totalCount={categoriesWithCount.length}
          postCategoryCount={allPostCategoryCount}
          momentCategoryCount={allMomentCategoryCount}
          contentType={contentType}
          hasFilters={hasFilters}
        />

        <CategorySearchBar
          rawQuery={rawQuery}
          contentType={contentType}
          hasFilters={hasFilters}
        />

        <CategoryTypeSwitch query={query} activeType={contentType} />

        <ActiveCategorySummary query={query} contentType={contentType} />

        <SummaryLedger
          items={[
            {
              label: query ? "匹配分类" : "全部分类",
              value: query ? filteredCategories.length : categoriesWithCount.length,
              detail: filterTypeLabel(contentType),
            },
            {
              label: "文章分类",
              value: allPostCategoryCount,
              detail: "长文与项目复盘",
            },
            {
              label: "见闻分类",
              value: allMomentCategoryCount,
              detail: "短记录与观察",
            },
            {
              label: hasFilters ? "匹配内容" : "已发布内容",
              value: hasFilters ? filteredPostCount : totalPosts,
              detail: "已归档条目",
            },
          ]}
        />

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
              <ContinuePanel
                title="继续浏览"
                description="不确定主题时，可以直接从文章流或搜索入口继续探索。"
              >
                <PublicIndexLinks
                  ariaLabel="分类页继续浏览"
                  items={[
                    {
                      href: "/posts",
                      label: "文章列表",
                      description: "按时间、分类和阅读量筛选长文",
                    },
                    {
                      href: "/search",
                      label: "搜索内容",
                      description: "用关键词跨文章和见闻检索",
                    },
                  ]}
                />
              </ContinuePanel>
            </aside>
          </div>
        ) : categoriesWithCount.length > 0 ? (
          <PublicEmptyState
            icon={FolderOpen}
            title="没有匹配的分类"
            description={emptyFilteredDescription}
            action={
              <PublicActionLink href="/category">查看全部分类</PublicActionLink>
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

function CategoryIndexHero({
  title,
  filteredCount,
  totalCount,
  postCategoryCount,
  momentCategoryCount,
  contentType,
  hasFilters,
}: {
  title: string;
  filteredCount: number;
  totalCount: number;
  postCategoryCount: number;
  momentCategoryCount: number;
  contentType: CategoryFilterType;
  hasFilters: boolean;
}) {
  return (
    <header className="mb-10 border-b border-border/35 pb-10 md:mb-12 md:pb-14">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
        <div className="min-w-0">
          <p className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
            <span className="h-px w-8 bg-border/70" aria-hidden="true" />
            Categories
          </p>
          <h1 className="mt-5 font-serif text-5xl italic leading-[1.04] md:text-6xl lg:text-7xl">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground">
            按主题浏览文章和见闻，快速进入相关内容。
          </p>
        </div>

        <div className="border-l border-border/35 pl-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Taxonomy / {filteredCount} / {totalCount}
          </p>
          <dl className="mt-5 grid gap-3 border-y border-border/25 py-4">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-xs text-muted-foreground">当前视图</dt>
              <dd className="font-serif text-2xl leading-none tabular-nums">
                {filteredCount}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-xs text-muted-foreground">文章分类</dt>
              <dd className="text-sm tabular-nums text-foreground/90">
                {postCategoryCount}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-xs text-muted-foreground">见闻分类</dt>
              <dd className="text-sm tabular-nums text-foreground/90">
                {momentCategoryCount}
              </dd>
            </div>
          </dl>
          <p className="mt-5 text-xs leading-5 text-muted-foreground">
            {hasFilters ? "当前处于筛选视图。" : filterTypeLabel(contentType)}
          </p>
        </div>
      </div>
    </header>
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
    <section className="border-b border-border/30 pb-6">
      <form
        className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_96px_auto]"
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
            className="h-11 rounded-none border-border/40 bg-transparent pl-10 shadow-none hover:border-border focus-visible:bg-background"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center gap-2 bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <Search className="h-4 w-4" suppressHydrationWarning />
          搜索
        </button>
        {hasFilters ? (
          <Link
            href="/category"
            className="inline-flex h-11 items-center justify-center border border-border/40 px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            清除
          </Link>
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
      className="-mx-5 mt-6 flex gap-6 overflow-x-auto border-b border-border/30 px-5 md:mx-0 md:px-0"
    >
      {items.map((item) => (
        <Link
          key={item.value}
          href={buildCategoryPath({ query, type: item.value })}
          aria-current={activeType === item.value ? "page" : undefined}
          className={`inline-flex h-11 shrink-0 items-center border-b border-transparent text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
            activeType === item.value
              ? "border-primary text-foreground"
              : "text-muted-foreground hover:border-border hover:text-foreground"
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
    <section className="mt-4 flex flex-col gap-2 border-l border-border/50 px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
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

function SummaryLedger({
  items,
}: {
  items: { label: string; value: number; detail: string }[];
}) {
  return (
    <section
      aria-label="分类概览"
      className="mt-6 grid gap-px border-y border-border/35 bg-border/25 sm:grid-cols-2 lg:grid-cols-4"
    >
      {items.map((item) => (
        <div key={item.label} className="bg-background px-4 py-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {item.label}
          </p>
          <p className="mt-2 font-serif text-2xl leading-none text-foreground">
            {item.value}
          </p>
          <p className="mt-2 truncate text-xs text-muted-foreground">
            {item.detail}
          </p>
        </div>
      ))}
    </section>
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
      <div className="border-b border-border/30 pb-4">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Browse
        </p>
        <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-serif text-2xl">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
          <span className="text-sm text-muted-foreground">
            {categories.length} 个
          </span>
        </div>
      </div>
      <div className="grid">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/category/${category.slug}`}
            className="group grid min-w-0 gap-3 border-b border-border/25 py-5 transition-colors hover:bg-muted/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:grid-cols-[minmax(0,1fr)_120px_24px]"
          >
            <span className="min-w-0">
              <span className="block truncate font-serif text-xl leading-tight transition-all duration-300 group-hover:italic group-hover:text-primary">
                {category.name}
              </span>
              <span className="mt-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {categoryTypeLabel(category.type)}
                </span>
                <span className="truncate text-sm text-muted-foreground">
                  {category.slug || "未设置 slug"}
                </span>
              </span>
            </span>
            <span className="text-sm text-muted-foreground sm:text-right">
              {category.postCount} 篇内容
            </span>
            <ArrowRight
              className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground sm:justify-self-end"
              suppressHydrationWarning
            />
          </Link>
        ))}
      </div>
    </section>
  );
}

function ContinuePanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
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
      <div className="py-3">{children}</div>
    </section>
  );
}
