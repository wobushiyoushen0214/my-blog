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
import { Hash, X } from "lucide-react";
import type { Metadata } from "next";
import type { Tag } from "@/lib/types";
import { cn } from "@/lib/utils";

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

function tagWeightClass(count: number, maxCount: number) {
  if (maxCount <= 0 || count <= 0) {
    return "font-serif text-base font-light italic text-muted-foreground";
  }

  const ratio = count / maxCount;
  if (ratio >= 0.7) {
    return "font-serif text-3xl font-light italic text-foreground sm:text-4xl";
  }
  if (ratio >= 0.4) {
    return "font-serif text-2xl font-light italic text-foreground sm:text-3xl";
  }
  if (ratio >= 0.15) {
    return "font-serif text-xl font-light italic text-foreground";
  }
  return "font-serif text-lg font-light italic text-muted-foreground";
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
  const maxCount = Math.max(0, ...filteredTags.map((tag) => tag.postCount));
  const emptyFilteredDescription = query
    ? `没有匹配「${query}」的标签，可以换个关键词或查看全部标签。`
    : `当前没有${statusLabel(status)}，可以切换到全部标签查看。`;

  return (
    <DeviceShell>
      <div className="public-device-layout">
        <Header />
        <PublicPageShell className="py-9 md:py-12">
          <header className="mb-8 border-b border-border pb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
            <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <div className="min-w-0">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
                  Tags
                </p>
                <h1 className="mt-2 font-serif text-4xl font-light italic leading-tight tracking-tight text-foreground md:text-5xl">
                  {status === DEFAULT_STATUS ? "所有标签" : statusLabel(status)}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                  按关键词交叉浏览内容。字号反映相关文章数量。
                </p>
              </div>
              <dl className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground md:justify-end">
                <div>
                  <dt className="sr-only">当前</dt>
                  <dd>当前 {filteredTags.length}</dd>
                </div>
                <div>
                  <dt className="sr-only">全部</dt>
                  <dd>共 {tagsWithCount.length}</dd>
                </div>
                <div>
                  <dt className="sr-only">已使用</dt>
                  <dd>已用 {usedTags.length}</dd>
                </div>
                <div>
                  <dt className="sr-only">未使用</dt>
                  <dd>未用 {tagsWithCount.length - usedTags.length}</dd>
                </div>
              </dl>
            </div>
          </header>

          <TagStatusSwitch query={query} activeStatus={status} />
          <ActiveTagSummary query={query} status={status} />

          {filteredTags.length > 0 ? (
            <section
              className="mt-10 min-w-0"
              aria-label={query ? "匹配标签" : "标签索引"}
            >
              <div className="flex flex-wrap items-end gap-x-6 gap-y-5 sm:gap-x-8 sm:gap-y-7">
                {filteredTags.map((tag) => (
                  <TagCloudItem
                    key={tag.id}
                    tag={tag}
                    weightClass={tagWeightClass(tag.postCount, maxCount)}
                  />
                ))}
              </div>

              <div className="mt-14 border-t border-border pt-6">
                <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                  Index
                </p>
                <div className="grid gap-px border-t border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
                  {filteredTags.map((tag) => (
                    <TagIndexRow key={`index-${tag.id}`} tag={tag} />
                  ))}
                </div>
              </div>
            </section>
          ) : tagsWithCount.length > 0 ? (
            <PublicEmptyState
              icon={Hash}
              title="没有匹配的标签"
              description={emptyFilteredDescription}
              action={
                <PublicActionLink href="/tag">查看全部标签</PublicActionLink>
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
    </DeviceShell>
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
      className="border-y border-border/70 py-4"
    >
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-2">
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground/50">
          状态
        </span>
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1.5">
          {items.map((item) => (
            <Link
              key={item.value}
              href={buildTagPath({ query, status: item.value })}
              aria-current={activeStatus === item.value ? "page" : undefined}
              className={cn(
                "inline-flex shrink-0 items-baseline font-mono text-[11px] tracking-[0.14em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                activeStatus === item.value
                  ? "font-semibold text-foreground"
                  : "font-medium text-muted-foreground/70 hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
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
    <section className="mt-4 flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Filter
        </span>
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
        className="inline-flex h-8 shrink-0 items-center font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
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
      className="inline-flex h-7 max-w-full items-center gap-1.5 font-mono text-[10px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      aria-label={`移除${label}`}
    >
      <span className="truncate">{label}</span>
      <X className="h-3 w-3 shrink-0" suppressHydrationWarning />
    </Link>
  );
}

function TagCloudItem({
  tag,
  weightClass,
}: {
  tag: TagWithCount;
  weightClass: string;
}) {
  return (
    <Link
      href={`/tag/${tag.slug}`}
      className="group inline-flex max-w-full flex-col items-start gap-1 transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <span className={cn("leading-none", weightClass)}>{tag.name}</span>
      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/70">
        {tag.postCount} posts
      </span>
    </Link>
  );
}

function TagIndexRow({ tag }: { tag: TagWithCount }) {
  return (
    <Link
      href={`/tag/${tag.slug}`}
      className="group flex min-w-0 items-baseline justify-between gap-4 bg-background px-4 py-4 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <span className="min-w-0 truncate font-serif text-base font-light italic text-foreground">
        {tag.name}
      </span>
      <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {tag.postCount}
      </span>
    </Link>
  );
}
