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
import { ArrowRight, FolderOpen, Search } from "lucide-react";
import type { Metadata } from "next";
import type { Category } from "@/lib/types";

export const metadata: Metadata = {
  title: "所有分类",
};

type CategoryWithCount = Category & { postCount: number };

function normalizeQuery(query: string) {
  return query.replace(/[%,()]/g, " ").replace(/\s+/g, " ").trim();
}

function categoryTypeLabel(type: Category["type"]) {
  return type === "moment" ? "见闻分类" : "文章分类";
}

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const rawQuery = q?.trim() || "";
  const query = normalizeQuery(rawQuery);
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  const categoriesWithCount = await Promise.all(
    (categories || []).map(async (category) => {
      const { count } = await supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("published", true)
        .eq("category_id", category.id);
      return { ...category, postCount: count || 0 };
    })
  );

  const filteredCategories = categoriesWithCount.filter((category) => {
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

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <PublicPageShell className="max-w-[1280px]">
        <PublicPageHeader
          eyebrow="Categories"
          title="所有分类"
          description="按主题浏览文章和见闻，快速进入相关内容。"
          countLabel={`${filteredCategories.length} / ${categoriesWithCount.length} 个分类`}
        />

        <section className="rounded-lg border bg-card p-3">
          <form
            className="flex flex-col gap-2 sm:flex-row"
            role="search"
            action="/category"
          >
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
            <Button type="submit">
              <Search className="h-4 w-4" suppressHydrationWarning />
              搜索
            </Button>
            {query ? (
              <Button variant="outline" asChild>
                <Link href="/category">清除</Link>
              </Button>
            ) : null}
          </form>
        </section>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label={query ? "匹配分类" : "全部分类"}
            value={query ? filteredCategories.length : categoriesWithCount.length}
          />
          <StatTile label="文章分类" value={allPostCategoryCount} />
          <StatTile label="见闻分类" value={allMomentCategoryCount} />
          <StatTile label="已发布内容" value={totalPosts} />
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
              <section className="rounded-lg border bg-card p-4">
                <p className="text-sm font-medium">继续浏览</p>
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
            description={`没有匹配「${query}」的分类，可以换个关键词或查看全部分类。`}
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

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
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
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
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
            className="group rounded-lg border bg-card p-4 transition-colors hover:border-primary/35 hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Badge variant="outline" className="rounded-md font-normal">
                  {categoryTypeLabel(category.type)}
                </Badge>
                <h3 className="mt-3 truncate text-base font-medium transition-colors group-hover:text-primary">
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
