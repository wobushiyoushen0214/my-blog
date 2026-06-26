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
import { ArrowRight, FolderOpen, Hash, Search } from "lucide-react";
import type { Metadata } from "next";
import type { Tag } from "@/lib/types";

export const metadata: Metadata = {
  title: "所有标签",
};

type TagWithCount = Tag & { postCount: number };

function normalizeQuery(query: string) {
  return query.replace(/[%,()]/g, " ").replace(/\s+/g, " ").trim();
}

export default async function TagsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const rawQuery = q?.trim() || "";
  const query = normalizeQuery(rawQuery);
  const supabase = await createClient();

  const [{ data: tags }, { data: publishedPosts }, { data: postTags }] =
    await Promise.all([
      supabase.from("tags").select("*").order("name"),
      supabase.from("posts").select("id").eq("published", true),
      supabase.from("post_tags").select("post_id, tag_id"),
    ]);

  const publishedPostIds = new Set(
    (publishedPosts || []).map((post) => post.id)
  );
  const publishedTagCounts = (postTags || []).reduce<Map<string, number>>(
    (counts, postTag) => {
      if (!publishedPostIds.has(postTag.post_id)) return counts;
      counts.set(postTag.tag_id, (counts.get(postTag.tag_id) || 0) + 1);
      return counts;
    },
    new Map()
  );

  const tagsWithCount = (tags || [])
    .map((tag) => ({
      ...tag,
      postCount: publishedTagCounts.get(tag.id) || 0,
    }))
    .sort((a, b) => {
      if (b.postCount !== a.postCount) return b.postCount - a.postCount;
      return a.name.localeCompare(b.name, "zh-Hans-CN");
    });

  const filteredTags = tagsWithCount.filter((tag) => {
    if (!query) return true;
    return [tag.name, tag.slug]
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase());
  });
  const usedTags = tagsWithCount.filter((tag) => tag.postCount > 0);
  const totalTaggedPosts = tagsWithCount.reduce(
    (sum, tag) => sum + tag.postCount,
    0
  );
  const topTags = usedTags.slice(0, 12);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <PublicPageShell className="max-w-[1280px]">
        <PublicPageHeader
          eyebrow="Tags"
          title="所有标签"
          description="通过关键词聚合相关内容，适合快速交叉浏览。"
          countLabel={`${filteredTags.length} / ${tagsWithCount.length} 个标签`}
        />

        <section className="rounded-lg border bg-card p-3">
          <form
            className="flex flex-col gap-2 sm:flex-row"
            role="search"
            action="/tag"
          >
            <label htmlFor="tag-search" className="sr-only">
              搜索标签
            </label>
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                suppressHydrationWarning
              />
              <Input
                id="tag-search"
                type="search"
                name="q"
                defaultValue={rawQuery}
                placeholder="搜索标签名称或 slug..."
                className="h-10 border-border/60 bg-background pl-10"
              />
            </div>
            <Button type="submit">
              <Search className="h-4 w-4" suppressHydrationWarning />
              搜索
            </Button>
            {query ? (
              <Button variant="outline" asChild>
                <Link href="/tag">清除</Link>
              </Button>
            ) : null}
          </form>
        </section>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label={query ? "匹配标签" : "全部标签"}
            value={query ? filteredTags.length : tagsWithCount.length}
          />
          <StatTile label="已使用标签" value={usedTags.length} />
          <StatTile label="内容关联" value={totalTaggedPosts} />
          <StatTile label="未使用标签" value={tagsWithCount.length - usedTags.length} />
        </div>

        {filteredTags.length > 0 ? (
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
            <section className="min-w-0 space-y-4">
              <div className="border-b border-border/50 pb-3">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
                  Browse
                </p>
                <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-base font-medium">
                      {query ? "匹配标签" : "标签索引"}
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      按已发布内容数量排序，低频标签仍可直接进入归档页。
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {filteredTags.length} 个
                  </span>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {filteredTags.map((tag) => (
                  <TagResultCard key={tag.id} tag={tag} />
                ))}
              </div>
            </section>

            <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
              {topTags.length > 0 ? (
                <section className="rounded-lg border bg-card">
                  <div className="border-b px-4 py-3">
                    <h2 className="text-sm font-medium">高频标签</h2>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      从内容关联最多的关键词继续浏览。
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 p-3">
                    {topTags.map((tag) => (
                      <Link
                        key={tag.id}
                        href={`/tag/${tag.slug}`}
                        className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      >
                        <Badge
                          variant="outline"
                          className="h-8 gap-1.5 rounded-md px-2.5 text-xs font-normal transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                        >
                          <Hash
                            className="h-3.5 w-3.5"
                            suppressHydrationWarning
                          />
                          {tag.name}
                          <span className="text-[11px] opacity-70">
                            {tag.postCount}
                          </span>
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="rounded-lg border bg-card p-4">
                <p className="text-sm font-medium">继续浏览</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  标签适合交叉检索；如果想按时间或主题浏览，可以切换入口。
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
                    <Link href="/category">
                      所有分类
                      <FolderOpen
                        className="h-4 w-4"
                        suppressHydrationWarning
                      />
                    </Link>
                  </Button>
                </div>
              </section>
            </aside>
          </div>
        ) : tagsWithCount.length > 0 ? (
          <PublicEmptyState
            icon={Hash}
            title="没有匹配的标签"
            description={`没有匹配「${query}」的标签，可以换个关键词或查看全部标签。`}
            action={
              <Button variant="outline" asChild>
                <Link href="/tag">查看全部标签</Link>
              </Button>
            }
          />
        ) : (
          <PublicEmptyState
            icon={Hash}
            title="暂无标签"
            description="创建标签后，读者可以按关键词找到相关内容。"
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

function TagResultCard({ tag }: { tag: TagWithCount }) {
  return (
    <Link
      href={`/tag/${tag.slug}`}
      className="group rounded-lg border bg-card p-4 transition-colors hover:border-primary/35 hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Badge variant="outline" className="rounded-md font-normal">
            <Hash className="h-3.5 w-3.5" suppressHydrationWarning />
            标签
          </Badge>
          <h3 className="mt-3 truncate text-base font-medium transition-colors group-hover:text-primary">
            {tag.name}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {tag.postCount} 篇内容
          </p>
        </div>
        <ArrowRight
          className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
          suppressHydrationWarning
        />
      </div>
    </Link>
  );
}
