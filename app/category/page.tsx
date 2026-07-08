import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { DeviceShell } from "@/components/device-shell";
import {
  PublicActionLink,
  PublicEmptyState,
  PublicPageShell,
} from "@/components/public-page";
import { ArrowRight, FolderOpen, X } from "lucide-react";
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
  const hasFilters = Boolean(query || contentType !== DEFAULT_TYPE);
  const emptyFilteredDescription = query
    ? `没有匹配「${query}」的分类，可以换个关键词或查看全部分类。`
    : `当前没有${filterTypeLabel(contentType)}，可以切换到全部分类查看。`;

  return (
    <DeviceShell>
      <div className="public-device-layout">
      <Header />
      <PublicPageShell className="py-9 md:py-12">
        <CategoryIndexHero
          title={contentType === DEFAULT_TYPE ? "所有分类" : filterTypeLabel(contentType)}
          filteredCount={filteredCategories.length}
          totalCount={categoriesWithCount.length}
          postCategoryCount={allPostCategoryCount}
          momentCategoryCount={allMomentCategoryCount}
          contentType={contentType}
          hasFilters={hasFilters}
        />

        <CategoryTypeSwitch query={query} activeType={contentType} />

        <ActiveCategorySummary query={query} contentType={contentType} />

        {filteredCategories.length > 0 ? (
          <div className="mt-8 space-y-8">
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
    </DeviceShell>
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
    <header className="pixel-frame mb-7 p-4 md:p-5">
      <div className="min-w-0">
        <p className="pixel-label text-primary">
          Categories
        </p>
        <h1 className="mt-2 text-2xl font-semibold leading-tight md:text-3xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          按主题浏览文章和见闻，快速进入相关内容。
        </p>
      </div>
      <p className="mt-4 inline-flex border border-border bg-muted/60 px-2 py-1 font-mono text-xs text-muted-foreground">
        {hasFilters ? "筛选视图" : filterTypeLabel(contentType)} · 当前 {filteredCount} · 共 {totalCount} ·{" "}
        文章分类 {postCategoryCount} · 见闻分类 {momentCategoryCount}
      </p>
    </header>
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
      className="-mx-5 mt-4 flex gap-2 overflow-x-auto border-b border-border/80 px-5 pb-3 md:mx-0 md:px-0"
    >
      {items.map((item) => (
        <Link
          key={item.value}
          href={buildCategoryPath({ query, type: item.value })}
          aria-current={activeType === item.value ? "page" : undefined}
          className={`inline-flex h-9 shrink-0 items-center border px-2 font-mono text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
            activeType === item.value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-muted-foreground hover:border-primary hover:bg-accent hover:text-foreground"
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
    <section className="mt-3 flex flex-col gap-2 border-b border-border/70 pb-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="font-mono text-xs text-primary">FILTER</span>
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
    <section className="space-y-3">
      <div className="flex flex-col gap-1 border-b border-border/60 pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
        <span className="text-sm text-muted-foreground">
          {categories.length} 个
        </span>
      </div>
      <div className="grid">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/category/${category.slug}`}
            className="group grid min-w-0 gap-3 border-x border-b border-transparent border-b-border/60 px-3 py-5 transition-[background-color,border-color,box-shadow] hover:border-x-border hover:bg-accent/60 hover:shadow-[3px_3px_0_var(--terminal-shadow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:grid-cols-[minmax(0,1fr)_120px_24px]"
          >
            <span className="min-w-0">
              <span className="block truncate text-base font-medium leading-6 transition-colors group-hover:text-primary">
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
