import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import {
  PublicActionLink,
  PublicEmptyState,
  PublicIndexLinks,
  PublicInfoPanel,
  PublicPageHeader,
  PublicPageShell,
} from "@/components/public-page";
import { Badge } from "@/components/ui/badge";
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
              <PublicInfoPanel
                title="继续浏览"
                description="不确定主题时，可以直接从文章流或搜索入口继续探索。"
                contentClassName="py-1"
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
              </PublicInfoPanel>
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
    <section className="py-1">
      <form
        className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_88px_auto]"
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
            className="h-10 rounded-none border-transparent bg-muted/20 pl-10 shadow-none hover:bg-muted/25 focus-visible:bg-background"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center gap-2 bg-foreground px-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <Search className="h-4 w-4" suppressHydrationWarning />
          搜索
        </button>
        {hasFilters ? (
          <Link
            href="/category"
            className="inline-flex h-10 items-center justify-center bg-muted/20 px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
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
      className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 py-1 md:mx-0 md:px-0"
    >
      {items.map((item) => (
        <Link
          key={item.value}
          href={buildCategoryPath({ query, type: item.value })}
          aria-current={activeType === item.value ? "page" : undefined}
          className={`inline-flex h-9 shrink-0 items-center px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
            activeType === item.value
              ? "bg-muted/30 text-foreground"
              : "bg-muted/10 text-muted-foreground hover:bg-muted/20 hover:text-foreground"
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
    <section className="mt-3 flex flex-col gap-2 bg-muted/15 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
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
      className="inline-flex h-7 max-w-full items-center gap-1.5 bg-muted/25 px-2 text-xs text-foreground transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
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
      className="mt-6 grid gap-1"
    >
      {items.map((item, index) => (
        <div
          key={item.label}
          className="-mx-2 grid gap-2 px-2 py-2.5 text-sm sm:grid-cols-[44px_minmax(0,1fr)_90px_minmax(0,1fr)]"
        >
          <span className="text-muted-foreground">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="min-w-0 truncate text-muted-foreground">
            {item.label}
          </span>
          <span className="font-serif text-xl leading-none">{item.value}</span>
          <span className="min-w-0 truncate text-muted-foreground sm:text-right">
            {item.detail}
          </span>
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
      <div className="pb-1">
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
      <div className="grid gap-1">
        {categories.map((category, index) => (
          <Link
            key={category.id}
            href={`/category/${category.slug}`}
            className="group -mx-2 grid min-w-0 gap-3 px-2 py-4 transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:grid-cols-[44px_minmax(0,1fr)_120px_24px]"
          >
            <span className="text-sm text-muted-foreground">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-serif text-xl leading-tight transition-opacity group-hover:opacity-70">
                {category.name}
              </span>
              <span className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
                <Badge variant="secondary" className="rounded-none font-normal">
                  {categoryTypeLabel(category.type)}
                </Badge>
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
