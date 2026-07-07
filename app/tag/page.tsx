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
import { ArrowRight, Hash, X } from "lucide-react";
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
  const hasFilters = Boolean(query || status !== DEFAULT_STATUS);
  const emptyFilteredDescription = query
    ? `没有匹配「${query}」的标签，可以换个关键词或查看全部标签。`
    : `当前没有${statusLabel(status)}，可以切换到全部标签查看。`;

  return (
    <DeviceShell>
      <div className="public-device-layout">
      <Header />
      <PublicPageShell className="py-9 md:py-12">
        <TagIndexHero
          title={status === DEFAULT_STATUS ? "所有标签" : statusLabel(status)}
          filteredCount={filteredTags.length}
          totalCount={tagsWithCount.length}
          usedCount={usedTags.length}
          unusedCount={tagsWithCount.length - usedTags.length}
          status={status}
          hasFilters={hasFilters}
        />

        <TagStatusSwitch query={query} activeStatus={status} />

        <ActiveTagSummary query={query} status={status} />

        {filteredTags.length > 0 ? (
          <section
            className="mt-7 min-w-0 border-t border-border/60"
            aria-label={query ? "匹配标签" : "标签索引"}
          >
            <div className="grid">
              {filteredTags.map((tag) => (
                <TagResultRow key={tag.id} tag={tag} />
              ))}
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

function TagIndexHero({
  title,
  filteredCount,
  totalCount,
  usedCount,
  unusedCount,
  status,
  hasFilters,
}: {
  title: string;
  filteredCount: number;
  totalCount: number;
  usedCount: number;
  unusedCount: number;
  status: TagStatus;
  hasFilters: boolean;
}) {
  return (
    <header className="pixel-frame mb-7 p-4 md:p-5">
      <div className="min-w-0">
        <p className="pixel-label text-primary">
          Tags
        </p>
        <h1 className="mt-2 text-2xl font-semibold leading-tight md:text-3xl">
          &gt; {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          通过关键词聚合相关内容，适合快速交叉浏览。
        </p>
      </div>
      <p className="mt-4 inline-flex border border-border bg-muted/60 px-2 py-1 font-mono text-xs text-muted-foreground">
        {hasFilters ? "筛选视图" : statusLabel(status)} · 当前 {filteredCount} · 共 {totalCount} ·{" "}
        已使用 {usedCount} · 未使用 {unusedCount}
      </p>
    </header>
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
      className="-mx-5 mt-4 flex gap-2 overflow-x-auto border-b border-border/80 px-5 pb-3 md:mx-0 md:px-0"
    >
      {items.map((item) => (
        <Link
          key={item.value}
          href={buildTagPath({ query, status: item.value })}
          aria-current={activeStatus === item.value ? "page" : undefined}
          className={`inline-flex h-9 shrink-0 items-center border px-2 font-mono text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
            activeStatus === item.value
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
    <section className="mt-3 flex flex-col gap-2 border-b border-border/70 pb-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="font-mono text-xs text-primary">FILTER</span>
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

function TagResultRow({ tag }: { tag: TagWithCount }) {
  return (
    <Link
      href={`/tag/${tag.slug}`}
      className="group grid min-w-0 gap-3 border-x border-b border-transparent border-b-border/60 px-3 py-5 transition-[background-color,border-color,box-shadow] hover:border-x-border hover:bg-accent/60 hover:shadow-[3px_3px_0_var(--terminal-shadow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:grid-cols-[minmax(0,1fr)_120px_24px]"
    >
      <span className="min-w-0">
        <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
            <Hash className="h-3.5 w-3.5" suppressHydrationWarning />
            标签
          </span>
          <span className="truncate text-sm text-muted-foreground">
            {tag.slug || "未设置 slug"}
          </span>
        </span>
        <span className="mt-2 block truncate text-base font-medium leading-6 transition-colors group-hover:text-primary">
          {tag.name}
        </span>
      </span>
      <span className="text-sm text-muted-foreground sm:text-right">
        {tag.postCount} 篇内容
      </span>
      <ArrowRight
        className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground sm:justify-self-end"
        suppressHydrationWarning
      />
    </Link>
  );
}
