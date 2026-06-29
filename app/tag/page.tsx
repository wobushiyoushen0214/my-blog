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
import { ArrowRight, FolderOpen, Hash, Search, X } from "lucide-react";
import type { Metadata } from "next";
import type { Tag } from "@/lib/types";

export const metadata: Metadata = {
  title: "所有标签",
};

type TagWithCount = Tag & { postCount: number };
type TagStatus = "all" | "used" | "unused";

const DEFAULT_STATUS: TagStatus = "all";

function normalizeQuery(query: string) {
  return query.replace(/[%,()]/g, " ").replace(/\s+/g, " ").trim();
}

function parseStatus(value?: string): TagStatus {
  return value === "used" || value === "unused" ? value : DEFAULT_STATUS;
}

function statusLabel(status: TagStatus) {
  if (status === "used") return "已使用标签";
  if (status === "unused") return "未使用标签";
  return "全部标签";
}

function buildTagPath({
  query,
  status,
}: {
  query?: string;
  status?: TagStatus;
} = {}) {
  const params = new URLSearchParams();

  if (query) params.set("q", query);
  if (status && status !== DEFAULT_STATUS) params.set("status", status);

  const search = params.toString();
  return search ? `/tag?${search}` : "/tag";
}

export default async function TagsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status: statusParam } = await searchParams;
  const rawQuery = q?.trim() || "";
  const query = normalizeQuery(rawQuery);
  const status = parseStatus(statusParam);
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
    const statusMatched =
      status === DEFAULT_STATUS ||
      (status === "used" ? tag.postCount > 0 : tag.postCount === 0);
    if (!statusMatched) return false;
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
  const filteredTaggedPosts = filteredTags.reduce(
    (sum, tag) => sum + tag.postCount,
    0
  );
  const topTags = usedTags.slice(0, 12);
  const hasFilters = Boolean(query || status !== DEFAULT_STATUS);
  const emptyFilteredDescription = query
    ? `没有匹配「${query}」的标签，可以换个关键词或查看全部标签。`
    : `当前没有${statusLabel(status)}，可以切换到全部标签查看。`;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <PublicPageShell className="max-w-[1280px]">
        <PublicPageHeader
          eyebrow="Tags"
          title={status === DEFAULT_STATUS ? "所有标签" : statusLabel(status)}
          description="通过关键词聚合相关内容，适合快速交叉浏览。"
          countLabel={`${filteredTags.length} / ${tagsWithCount.length} 个标签`}
        />

        <TagSearchBar
          rawQuery={rawQuery}
          status={status}
          hasFilters={hasFilters}
        />

        <TagStatusSwitch query={query} activeStatus={status} />

        <ActiveTagSummary query={query} status={status} />

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label={hasFilters ? "匹配标签" : "全部标签"}
            value={hasFilters ? filteredTags.length : tagsWithCount.length}
          />
          <StatTile label="已使用标签" value={usedTags.length} />
          <StatTile
            label={hasFilters ? "匹配关联" : "内容关联"}
            value={hasFilters ? filteredTaggedPosts : totalTaggedPosts}
          />
          <StatTile
            label="未使用标签"
            value={tagsWithCount.length - usedTags.length}
          />
        </div>

        {filteredTags.length > 0 ? (
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
            <section className="min-w-0 space-y-4">
              <div className="border-b border-border/50 pb-3">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
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
                <section className="border bg-card">
                  <div className="border-b px-4 py-3">
                    <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      高频标签
                    </h2>
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

              <section className="border bg-card p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  继续浏览
                </p>
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
            description={emptyFilteredDescription}
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

function TagSearchBar({
  rawQuery,
  status,
  hasFilters,
}: {
  rawQuery: string;
  status: TagStatus;
  hasFilters: boolean;
}) {
  return (
    <section className="border bg-card p-3">
      <form
        className="flex flex-col gap-2 sm:flex-row"
        role="search"
        action="/tag"
      >
        {status !== DEFAULT_STATUS ? (
          <input type="hidden" name="status" value={status} />
        ) : null}
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
        <Button type="submit" className="h-10">
          <Search className="h-4 w-4" suppressHydrationWarning />
          搜索
        </Button>
        {hasFilters ? (
          <Button variant="outline" className="h-10" asChild>
            <Link href="/tag">清除</Link>
          </Button>
        ) : null}
      </form>
    </section>
  );
}

function TagStatusSwitch({
  query,
  activeStatus,
}: {
  query: string;
  activeStatus: TagStatus;
}) {
  const items: Array<{ value: TagStatus; label: string }> = [
    { value: "all", label: "全部" },
    { value: "used", label: "已使用" },
    { value: "unused", label: "未使用" },
  ];

  return (
    <nav
      aria-label="标签使用状态"
      className="-mx-4 mt-4 flex gap-2 overflow-x-auto border-b border-border/50 px-4 pb-4 md:mx-0 md:px-0"
    >
      {items.map((item) => (
        <Link
          key={item.value}
          href={buildTagPath({ query, status: item.value })}
          aria-current={activeStatus === item.value ? "page" : undefined}
          className={`inline-flex h-9 shrink-0 items-center rounded-md border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
            activeStatus === item.value
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

function ActiveTagSummary({
  query,
  status,
}: {
  query: string;
  status: TagStatus;
}) {
  const hasFilters = Boolean(query || status !== DEFAULT_STATUS);
  if (!hasFilters) return null;

  return (
    <section className="mt-3 flex flex-col gap-2 border border-border/70 bg-muted/20 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">当前筛选</span>
        {query ? (
          <FilterPill
            label={`关键词：${query}`}
            href={buildTagPath({ status })}
          />
        ) : null}
        {status !== DEFAULT_STATUS ? (
          <FilterPill
            label={`状态：${statusLabel(status)}`}
            href={buildTagPath({ query })}
          />
        ) : null}
      </div>
      <Link
        href="/tag"
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

function TagResultCard({ tag }: { tag: TagWithCount }) {
  return (
    <Link
      href={`/tag/${tag.slug}`}
      className="group border bg-card p-4 transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Badge variant="outline" className="rounded-md font-normal">
            <Hash className="h-3.5 w-3.5" suppressHydrationWarning />
            标签
          </Badge>
          <h3 className="mt-3 truncate font-serif text-xl leading-tight transition-opacity group-hover:opacity-70">
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
