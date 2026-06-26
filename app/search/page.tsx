import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PostCard } from "@/components/post-card";
import {
  PublicEmptyState,
  PublicPageHeader,
  PublicPageShell,
} from "@/components/public-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, FolderOpen, Hash, Search } from "lucide-react";
import type { Metadata } from "next";
import type { Category, Post, Tag } from "@/lib/types";

export const metadata: Metadata = {
  title: "搜索",
};

type PostRow = Post & { category?: Category | null; tags?: Tag[] };

function normalizeQuery(query: string) {
  return query.replace(/[%,()]/g, " ").replace(/\s+/g, " ").trim();
}

function matchesQuery(values: Array<string | null | undefined>, query: string) {
  const normalized = query.toLowerCase();
  return values.some((value) => value?.toLowerCase().includes(normalized));
}

function mergePosts(groups: PostRow[][]) {
  const seen = new Map<string, PostRow>();

  groups.flat().forEach((post) => {
    if (!seen.has(post.id)) {
      seen.set(post.id, post);
    }
  });

  return Array.from(seen.values()).sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

async function attachTags(
  supabase: Awaited<ReturnType<typeof createClient>>,
  posts: PostRow[]
) {
  return Promise.all(
    posts.map(async (post) => {
      const { data: postTags } = await supabase
        .from("post_tags")
        .select("tag_id")
        .eq("post_id", post.id);

      if (!postTags || postTags.length === 0) {
        return { ...post, tags: [] };
      }

      const tagIds = postTags.map((postTag) => postTag.tag_id);
      const { data: tags } = await supabase.from("tags").select("*").in("id", tagIds);
      return { ...post, tags: tags || [] };
    })
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const rawQuery = q?.trim() || "";
  const query = normalizeQuery(rawQuery);
  const supabase = await createClient();

  const [{ data: categories }, { data: tags }, { data: recentData }] =
    await Promise.all([
      supabase.from("categories").select("*").order("name"),
      supabase.from("tags").select("*").order("name"),
      supabase
        .from("posts")
        .select("*, category:categories(*)")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

  const categorySummaries = await Promise.all(
    (categories || []).map(async (category) => {
      const { count } = await supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("published", true)
        .eq("category_id", category.id);
      return { ...category, postCount: count || 0 };
    })
  );

  const tagSummaries = await Promise.all(
    (tags || []).map(async (tag) => {
      const { count } = await supabase
        .from("post_tags")
        .select("post_id", { count: "exact", head: true })
        .eq("tag_id", tag.id);
      return { ...tag, postCount: count || 0 };
    })
  );

  let results: PostRow[] = [];
  let matchedCategories: Category[] = [];
  let matchedTags: Tag[] = [];

  if (query) {
    const escaped = query.replace(/\./g, " ");
    matchedCategories = (categories || []).filter((category) =>
      matchesQuery([category.name, category.slug], query)
    );
    matchedTags = (tags || []).filter((tag) =>
      matchesQuery([tag.name, tag.slug], query)
    );

    const categoryIds = matchedCategories.map((category) => category.id);
    const tagIds = matchedTags.map((tag) => tag.id);

    const [
      { data: keywordPosts },
      { data: categoryPosts },
      { data: matchedPostTags },
    ] = await Promise.all([
      supabase
        .from("posts")
        .select("*, category:categories(*)")
        .eq("published", true)
        .or(
          [
            `title.ilike.%${escaped}%`,
            `excerpt.ilike.%${escaped}%`,
            `content.ilike.%${escaped}%`,
          ].join(",")
        )
        .order("created_at", { ascending: false })
        .limit(24),
      categoryIds.length > 0
        ? supabase
            .from("posts")
            .select("*, category:categories(*)")
            .eq("published", true)
            .in("category_id", categoryIds)
            .order("created_at", { ascending: false })
            .limit(24)
        : Promise.resolve({ data: [] }),
      tagIds.length > 0
        ? supabase
            .from("post_tags")
            .select("post_id")
            .in("tag_id", tagIds)
        : Promise.resolve({ data: [] }),
    ]);

    const tagPostIds = Array.from(
      new Set((matchedPostTags || []).map((postTag) => postTag.post_id))
    );
    const { data: tagPosts } =
      tagPostIds.length > 0
        ? await supabase
            .from("posts")
            .select("*, category:categories(*)")
            .eq("published", true)
            .in("id", tagPostIds)
            .order("created_at", { ascending: false })
            .limit(24)
        : { data: [] };

    const mergedResults = mergePosts([
      (keywordPosts || []) as unknown as PostRow[],
      (categoryPosts || []) as unknown as PostRow[],
      (tagPosts || []) as unknown as PostRow[],
    ]).slice(0, 24);

    results = await attachTags(supabase, mergedResults);
  }

  const recentPosts = await attachTags(
    supabase,
    (recentData || []) as unknown as PostRow[]
  );
  const shownPosts = query ? results : recentPosts;
  const featuredPost = shownPosts[0] || null;
  const listPosts = shownPosts.slice(1);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <PublicPageShell className="max-w-[1280px]">
        <PublicPageHeader
          eyebrow="Search"
          title={query ? `搜索 · ${query}` : "搜索与发现"}
          description="按关键词检索标题、正文、分类和标签，也可以从主题入口继续探索。"
          countLabel={query ? `${results.length} 条结果` : undefined}
        />

        <section className="rounded-lg border bg-card p-3">
          <form
            className="flex flex-col gap-2 sm:flex-row"
            role="search"
            action="/search"
          >
            <label htmlFor="site-search" className="sr-only">
              搜索关键词
            </label>
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                suppressHydrationWarning
              />
              <Input
                id="site-search"
                type="search"
                name="q"
                defaultValue={rawQuery}
                placeholder="搜索标题、正文、分类或标签..."
                className="h-10 border-border/60 bg-background pl-10"
              />
            </div>
            <Button type="submit" className="sm:w-auto">
              <Search className="h-4 w-4" suppressHydrationWarning />
              搜索
            </Button>
            {query ? (
              <Button variant="outline" asChild>
                <Link href="/search">清除</Link>
              </Button>
            ) : null}
          </form>
        </section>

        {query && (matchedCategories.length > 0 || matchedTags.length > 0) ? (
          <SearchMatchPanel
            categories={matchedCategories}
            tags={matchedTags}
          />
        ) : null}

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-8">
            {shownPosts.length > 0 ? (
              <>
                {featuredPost ? (
                  <section className="space-y-3">
                    <SectionTitle
                      eyebrow={query ? "Best Match" : "Recent"}
                      title={query ? "最相关内容" : "最近发布"}
                    />
                    <PostCard
                      post={featuredPost}
                      variant={query ? "compact" : "featured"}
                    />
                  </section>
                ) : null}

                {listPosts.length > 0 ? (
                  <section className="space-y-4">
                    <SectionTitle
                      eyebrow={query ? "Results" : "More"}
                      title={query ? "更多结果" : "更多内容"}
                    />
                    <div className="grid gap-4 md:grid-cols-2">
                      {listPosts.map((post) => (
                        <PostCard key={post.id} post={post} variant="compact" />
                      ))}
                    </div>
                  </section>
                ) : null}
              </>
            ) : query ? (
              <PublicEmptyState
                icon={Search}
                title="没有找到相关文章"
                description={`没有匹配「${query}」的内容，可以换个关键词或从右侧主题继续浏览。`}
                action={
                  <Button variant="outline" asChild>
                    <Link href="/posts">查看全部文章</Link>
                  </Button>
                }
              />
            ) : (
              <PublicEmptyState
                icon={Search}
                title="输入关键词开始搜索"
                description="可以搜索技术主题、标签、文章标题、摘要或正文中的关键词。"
              />
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <DiscoveryPanel
              title="分类"
              description="按长期主题浏览。"
              items={categorySummaries}
              hrefFor={(item) => `/category/${item.slug}`}
              icon="category"
              limit={8}
            />
            <DiscoveryPanel
              title="标签"
              description="通过关键词交叉发现内容。"
              items={tagSummaries}
              hrefFor={(item) => `/tag/${item.slug}`}
              icon="tag"
              limit={16}
            />
            <section className="rounded-lg border bg-card p-4">
              <p className="text-sm font-medium">继续浏览</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                不确定关键词时，可以直接进入文章流按时间和主题浏览。
              </p>
              <Button className="mt-4 w-full" variant="outline" asChild>
                <Link href="/posts">
                  文章列表
                  <ArrowRight className="h-4 w-4" suppressHydrationWarning />
                </Link>
              </Button>
            </section>
          </aside>
        </div>
      </PublicPageShell>
      <Footer />
    </div>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="border-b border-border/50 pb-3">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-base font-medium">{title}</h2>
    </div>
  );
}

function SearchMatchPanel({
  categories,
  tags,
}: {
  categories: Category[];
  tags: Tag[];
}) {
  return (
    <section className="mt-4 rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium">主题命中</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            搜索结果已包含匹配分类和标签下的已发布内容。
          </p>
        </div>
        <div className="flex min-w-0 flex-wrap gap-2">
          {categories.slice(0, 6).map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <Badge
                variant="outline"
                className="h-8 gap-1.5 rounded-md px-2.5 text-xs font-normal"
              >
                <FolderOpen className="h-3.5 w-3.5" suppressHydrationWarning />
                {category.name}
              </Badge>
            </Link>
          ))}
          {tags.slice(0, 8).map((tag) => (
            <Link
              key={tag.id}
              href={`/tag/${tag.slug}`}
              className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <Badge
                variant="outline"
                className="h-8 gap-1.5 rounded-md px-2.5 text-xs font-normal"
              >
                <Hash className="h-3.5 w-3.5" suppressHydrationWarning />
                {tag.name}
              </Badge>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function DiscoveryPanel<T extends { id: string; name: string; postCount: number }>({
  title,
  description,
  items,
  hrefFor,
  icon,
  limit,
}: {
  title: string;
  description: string;
  items: T[];
  hrefFor: (item: T) => string;
  icon: "category" | "tag";
  limit: number;
}) {
  const visibleItems = items
    .filter((item) => item.postCount > 0)
    .sort((a, b) => b.postCount - a.postCount)
    .slice(0, limit);

  if (visibleItems.length === 0) return null;

  return (
    <section className="rounded-lg border bg-card">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-medium">{title}</h2>
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
              variant="outline"
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
