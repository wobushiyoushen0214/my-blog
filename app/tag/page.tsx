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
      <PublicPageShell className="max-w-[960px] py-10 md:py-12">
        <TagIndexHero
          title={status === DEFAULT_STATUS ? "所有标签" : statusLabel(status)}
          filteredCount={filteredTags.length}
          totalCount={tagsWithCount.length}
          usedCount={usedTags.length}
          unusedCount={tagsWithCount.length - usedTags.length}
          status={status}
          hasFilters={hasFilters}
        />

        <TagSearchBar
          rawQuery={rawQuery}
          status={status}
          hasFilters={hasFilters}
        />

        <TagStatusSwitch query={query} activeStatus={status} />

        <ActiveTagSummary query={query} status={status} />

        <SummaryLedger
          items={[
            {
              label: hasFilters ? "匹配标签" : "全部标签",
              value: hasFilters ? filteredTags.length : tagsWithCount.length,
              detail: statusLabel(status),
            },
            {
              label: "已使用标签",
              value: usedTags.length,
              detail: "已有内容关联",
            },
            {
              label: hasFilters ? "匹配关联" : "内容关联",
              value: hasFilters ? filteredTaggedPosts : totalTaggedPosts,
              detail: "发布内容引用",
            },
            {
              label: "未使用标签",
              value: tagsWithCount.length - usedTags.length,
              detail: "等待整理",
            },
          ]}
        />

        {filteredTags.length > 0 ? (
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
            <section className="min-w-0 space-y-4">
              <div className="border-b border-border/60 pb-3">
                <p className="text-sm text-muted-foreground">
                  Browse
                </p>
                <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">
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

              <div className="grid">
                {filteredTags.map((tag) => (
                  <TagResultRow key={tag.id} tag={tag} />
                ))}
              </div>
            </section>

            <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
              {topTags.length > 0 ? (
                <section className="py-1">
                  <div className="border-b border-border/60 pb-3">
                    <h2 className="text-sm font-medium text-foreground">
                      高频标签
                    </h2>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      从内容关联最多的关键词继续浏览。
                    </p>
                  </div>
                  <div className="grid">
                    {topTags.map((tag) => (
                      <Link
                        key={tag.id}
                        href={`/tag/${tag.slug}`}
                        className="group grid min-h-11 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border/20 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <Hash
                            className="h-3.5 w-3.5"
                            suppressHydrationWarning
                          />
                          <span className="truncate">{tag.name}</span>
                        </span>
                        <span className="text-xs tabular-nums text-muted-foreground transition-colors group-hover:text-foreground">
                          {tag.postCount}
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}

              <ContinuePanel
                title="继续浏览"
                description="标签适合交叉检索；如果想按时间或主题浏览，可以切换入口。"
              >
                <PublicIndexLinks
                  ariaLabel="标签页继续浏览"
                  items={[
                    {
                      href: "/posts",
                      label: "文章列表",
                      description: "回到按时间排序的长文流",
                    },
                    {
                      href: "/category",
                      label: "所有分类",
                      description: "按一级主题浏览内容",
                      icon: FolderOpen,
                    },
                  ]}
                />
              </ContinuePanel>
            </aside>
          </div>
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
    <header className="mb-8 border-b border-border/60 pb-6">
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_240px] md:items-end">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            Tags
          </p>
          <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            通过关键词聚合相关内容，适合快速交叉浏览。
          </p>
        </div>

        <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
          <p className="text-xs text-muted-foreground">
            Tag Index / {filteredCount} / {totalCount}
          </p>
          <dl className="mt-3 grid gap-2 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">当前视图</dt>
              <dd className="font-semibold tabular-nums">
                {filteredCount}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">已使用</dt>
              <dd className="tabular-nums text-foreground">
                {usedCount}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">未使用</dt>
              <dd className="tabular-nums text-foreground">
                {unusedCount}
              </dd>
            </div>
          </dl>
          <p className="mt-5 text-xs leading-5 text-muted-foreground">
            {hasFilters ? "当前处于筛选视图。" : statusLabel(status)}
          </p>
        </div>
      </div>
    </header>
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
    <section className="border-b border-border/60 pb-5">
      <form
        className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_96px_auto]"
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
            className="h-10 rounded-md border-border/60 bg-background pl-10 shadow-none hover:bg-muted/30 focus-visible:bg-background"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <Search className="h-4 w-4" suppressHydrationWarning />
          搜索
        </button>
        {hasFilters ? (
          <Link
            href="/tag"
            className="inline-flex h-10 items-center justify-center rounded-md border border-border/60 px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            清除
          </Link>
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
      className="-mx-5 mt-5 flex gap-4 overflow-x-auto border-b border-border/60 px-5 md:mx-0 md:px-0"
    >
      {items.map((item) => (
        <Link
          key={item.value}
          href={buildTagPath({ query, status: item.value })}
          aria-current={activeStatus === item.value ? "page" : undefined}
          className={`inline-flex h-11 shrink-0 items-center border-b border-transparent text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
            activeStatus === item.value
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
    <section className="mt-4 flex flex-col gap-2 border-l border-border/50 px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
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
      className="inline-flex h-7 max-w-full items-center gap-1.5 rounded-md border border-border/60 px-2 text-xs text-foreground transition-colors hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
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
      aria-label="标签概览"
      className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-border/60 bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">
            {item.label}
          </p>
          <p className="mt-1 text-lg font-semibold leading-none text-foreground">
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

function TagResultRow({ tag }: { tag: TagWithCount }) {
  return (
    <Link
      href={`/tag/${tag.slug}`}
      className="group grid min-w-0 gap-3 border-b border-border/25 py-5 transition-colors hover:bg-muted/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:grid-cols-[minmax(0,1fr)_120px_24px]"
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
        <span className="mt-2 block truncate text-base font-semibold leading-6 tracking-tight transition-colors group-hover:text-primary">
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
    <section className="rounded-lg border border-border/60 bg-muted/15 p-4">
      <div className="border-b border-border/60 pb-3">
        <h2 className="text-sm font-medium text-foreground">
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
