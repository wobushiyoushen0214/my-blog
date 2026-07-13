import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { DeviceShell } from "@/components/device-shell";
import {
  PublicActionLink,
  PublicCompactHeader,
  PublicControlStrip,
  PublicEmptyState,
  PublicFilterPill,
  PublicFilterSummary,
  PublicMetaPill,
  PublicPageShell,
  PublicPillLink,
} from "@/components/public-page";
import { ArrowRight, FolderOpen } from "lucide-react";
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
      <PublicPageShell>
        <PublicCompactHeader
          eyebrow="Categories"
          title={contentType === DEFAULT_TYPE ? "所有分类" : filterTypeLabel(contentType)}
          description="按主题浏览文章和见闻，快速进入相关内容。"
          meta={
            <>
              <PublicMetaPill>
                {hasFilters ? "筛选视图" : filterTypeLabel(contentType)}
              </PublicMetaPill>
              <PublicMetaPill>当前 {filteredCategories.length}</PublicMetaPill>
              <PublicMetaPill>共 {categoriesWithCount.length}</PublicMetaPill>
              <PublicMetaPill>文章 {allPostCategoryCount}</PublicMetaPill>
              <PublicMetaPill>见闻 {allMomentCategoryCount}</PublicMetaPill>
            </>
          }
        />

        <PublicControlStrip>
          <CategoryTypeSwitch query={query} activeType={contentType} />
          <ActiveCategorySummary query={query} contentType={contentType} />
        </PublicControlStrip>

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
      className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0"
    >
      {items.map((item) => (
        <PublicPillLink
          key={item.value}
          href={buildCategoryPath({ query, type: item.value })}
          active={activeType === item.value}
          ariaCurrent={activeType === item.value ? "page" : undefined}
        >
          {item.label}
        </PublicPillLink>
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
    <PublicFilterSummary clearHref="/category">
      {query ? (
        <PublicFilterPill
          label={`关键词：${query}`}
          href={buildCategoryPath({ type: contentType })}
        />
      ) : null}
      {contentType !== DEFAULT_TYPE ? (
        <PublicFilterPill
          label={`类型：${filterTypeLabel(contentType)}`}
          href={buildCategoryPath({ query })}
        />
      ) : null}
    </PublicFilterSummary>
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
      <div className="flex flex-col gap-1 border-b border-border pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl font-light italic text-foreground">
            {title}
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {categories.length} 个
        </span>
      </div>
      <div className="grid border-t border-border">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/category/${category.slug}`}
            className="group grid min-w-0 gap-3 border-b border-border py-6 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:grid-cols-[minmax(0,1fr)_7rem_auto]"
          >
            <span className="min-w-0">
              <span className="block truncate font-serif text-xl font-light italic leading-snug text-foreground transition-opacity group-hover:opacity-70">
                {category.name}
              </span>
              <span className="mt-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <span>{categoryTypeLabel(category.type)}</span>
                <span className="truncate text-muted-foreground/70">
                  {category.slug || "—"}
                </span>
              </span>
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:text-right">
              {category.postCount} 篇
            </span>
            <ArrowRight
              className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-foreground sm:justify-self-end"
              suppressHydrationWarning
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
