import Link from "next/link";
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
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Link2,
  MessageSquareText,
  Rss,
  Search,
  X,
} from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "友链",
};

type FriendLink = {
  name: string;
  href: string;
  description: string;
  category: string;
  status: "active" | "new";
  tags?: string[];
  rss?: string;
};
type LinkStatus = "all" | FriendLink["status"];

const friendLinks: FriendLink[] = [];
const DEFAULT_STATUS: LinkStatus = "all";

const applicationFields = [
  "站点名称和首页链接",
  "一句话简介，建议 30 字以内",
  "主要内容方向或常写主题",
  "头像、Logo 或 RSS 地址（可选）",
];

const linkRules = [
  "以个人博客、技术写作、产品记录或长期维护的内容站点为主。",
  "站点需要可以稳定访问，首页不要只有聚合广告或跳转页。",
  "互链信息变更后可以再次留言，我会定期整理。",
];

const siteProfile = [
  { label: "站点名称", value: "Lee 的个人博客" },
  { label: "内容方向", value: "技术笔记、项目复盘、日常见闻" },
  { label: "首页", value: "/" },
  { label: "RSS", value: "/rss.xml" },
];

function normalizeQuery(query: string) {
  return query.replace(/[%,().]/g, " ").replace(/\s+/g, " ").trim();
}

function parseStatus(value?: string): LinkStatus {
  return value === "active" || value === "new" ? value : DEFAULT_STATUS;
}

function getStatusLabel(status: LinkStatus) {
  if (status === "active") return "已收录";
  if (status === "new") return "新收录";
  return "全部状态";
}

function buildLinksPath({
  query,
  status,
}: {
  query?: string;
  status?: LinkStatus;
} = {}) {
  const params = new URLSearchParams();

  if (query) params.set("q", query);
  if (status && status !== DEFAULT_STATUS) params.set("status", status);

  const search = params.toString();
  return search ? `/links?${search}` : "/links";
}

function matchesQuery(item: FriendLink, query: string) {
  if (!query) return true;

  const normalized = query.toLowerCase();
  const values = [
    item.name,
    item.href,
    item.description,
    item.category,
    ...(item.tags || []),
  ];

  return values.some((value) => value.toLowerCase().includes(normalized));
}

export default async function LinksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status: statusParam } = await searchParams;
  const rawQuery = q?.trim() || "";
  const query = normalizeQuery(rawQuery);
  const status = parseStatus(statusParam);
  const filteredLinks = friendLinks.filter(
    (item) =>
      matchesQuery(item, query) &&
      (status === DEFAULT_STATUS || item.status === status)
  );
  const groupedLinks = filteredLinks.reduce<Record<string, FriendLink[]>>(
    (groups, item) => {
      groups[item.category] = [...(groups[item.category] || []), item];
      return groups;
    },
    {}
  );
  const categories = Object.keys(groupedLinks);
  const rssCount = filteredLinks.filter((item) => item.rss).length;
  const hasFilters = Boolean(query || status !== DEFAULT_STATUS);
  const countLabel = hasFilters
    ? `${filteredLinks.length} / ${friendLinks.length} 个站点`
    : `${friendLinks.length} 个站点`;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <PublicPageShell className="max-w-[1280px]">
        <PublicPageHeader
          eyebrow="Links"
          title="友链"
          description="收录长期阅读和互相连接的站点，也作为发现独立写作者的入口。"
          countLabel={countLabel}
          action={
            <Link
              href="/posts"
              className="inline-flex h-9 items-center gap-2 px-0 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <MessageSquareText
                className="h-4 w-4"
                suppressHydrationWarning
              />
              申请互链
            </Link>
          }
        />

        {friendLinks.length > 0 ? (
          <>
            <LinkFilterBar
              rawQuery={rawQuery}
              status={status}
              hasFilters={hasFilters}
            />
            <ActiveLinkSummary query={query} status={status} />
          </>
        ) : null}

        {friendLinks.length > 0 ? (
          <SummaryLedger
            items={[
              {
                label: hasFilters ? "匹配站点" : "收录站点",
                value: filteredLinks.length,
                detail: getStatusLabel(status),
              },
              {
                label: "主题分组",
                value: categories.length,
                detail: "目录分栏",
              },
              {
                label: "RSS 可订阅",
                value: rssCount,
                detail: "可持续阅读",
              },
            ]}
          />
        ) : null}

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-8">
            {filteredLinks.length > 0 ? (
              categories.map((category) => (
                <section key={category} className="space-y-4">
                  <div className="pb-1">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      Directory
                    </p>
                    <div className="mt-1 flex items-end justify-between gap-3">
                      <div>
                        <h2 className="text-base font-medium">{category}</h2>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          按主题整理的站点，点击会在新窗口打开。
                        </p>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {groupedLinks[category].length} 个
                      </span>
                    </div>
                  </div>
                  <div className="grid gap-1">
                    {groupedLinks[category].map((item, index) => (
                      <FriendLinkRow key={item.href} item={item} index={index} />
                    ))}
                  </div>
                </section>
              ))
            ) : friendLinks.length > 0 ? (
              <PublicEmptyState
                icon={Search}
                title="没有匹配的站点"
                description={
                  query
                    ? `没有匹配「${query}」的友链，可以换个关键词或清除筛选。`
                    : "当前状态下暂无站点，可以清除筛选后查看全部。"
                }
                action={
                  <PublicActionLink href="/links">清除筛选</PublicActionLink>
                }
                className="max-w-none"
              />
            ) : (
              <PublicEmptyState
                icon={Link2}
                title="暂无公开友链"
                description="友链目录还没有公开收录。可以先参考右侧的本站信息，通过文章评论区留下站点资料。"
                action={
                  <PublicActionLink href="/posts">
                    去文章区留言
                    <ArrowRight
                      className="h-4 w-4"
                      suppressHydrationWarning
                    />
                  </PublicActionLink>
                }
                className="max-w-none"
              />
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <InfoPanel
              title="本站信息"
              description="申请互链时可直接引用这些资料。"
            >
              <div className="grid gap-1">
                {siteProfile.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start justify-between gap-3 py-2 text-sm first:pt-0 last:pb-0"
                  >
                    <span className="shrink-0 text-muted-foreground">
                      {item.label}
                    </span>
                    {item.value.startsWith("/") ? (
                      <Link
                        href={item.value}
                        className="min-w-0 truncate text-right font-medium transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      >
                        {item.value}
                      </Link>
                    ) : (
                      <span className="min-w-0 text-right font-medium">
                        {item.value}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </InfoPanel>

            <InfoPanel
              title="申请互链"
              description="留言时带上这些信息，后续整理时可以直接录入。"
            >
              <ul className="grid gap-2">
                {applicationFields.map((field) => (
                  <li key={field} className="flex gap-2 text-sm leading-6">
                    <CheckCircle2
                      className="mt-1 h-4 w-4 shrink-0 text-muted-foreground"
                      suppressHydrationWarning
                    />
                    <span className="text-muted-foreground">{field}</span>
                  </li>
                ))}
              </ul>
            </InfoPanel>

            <InfoPanel title="收录规则" description="保持目录可读、可维护。">
              <ul className="grid gap-3">
                {linkRules.map((rule) => (
                  <li key={rule} className="text-sm leading-6 text-muted-foreground">
                    {rule}
                  </li>
                ))}
              </ul>
            </InfoPanel>

            <PublicInfoPanel
              title="继续浏览"
              description="如果只是想发现内容，可以从文章流或搜索入口继续。"
              contentClassName="py-1"
            >
              <PublicIndexLinks
                ariaLabel="友链页继续浏览"
                items={[
                  {
                    href: "/posts",
                    label: "文章列表",
                    description: "进入按时间整理的长文流",
                  },
                  {
                    href: "/search",
                    label: "搜索内容",
                    description: "按关键词查找站内内容",
                    icon: Search,
                  },
                  {
                    href: "/rss.xml",
                    label: "RSS 订阅",
                    description: "订阅最新发布",
                    icon: Rss,
                  },
                ]}
              />
            </PublicInfoPanel>
          </aside>
        </div>
      </PublicPageShell>
      <Footer />
    </div>
  );
}

function LinkFilterBar({
  rawQuery,
  status,
  hasFilters,
}: {
  rawQuery: string;
  status: LinkStatus;
  hasFilters: boolean;
}) {
  return (
    <section className="py-1">
      <form
        action="/links"
        role="search"
        className="grid gap-2 md:grid-cols-[minmax(0,1fr)_150px_auto_auto]"
      >
        <label htmlFor="links-search" className="sr-only">
          搜索友链
        </label>
        <div className="relative min-w-0">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            suppressHydrationWarning
          />
          <Input
            id="links-search"
            type="search"
            name="q"
            defaultValue={rawQuery}
            placeholder="搜索站点名称、简介、分类或标签..."
            className="h-10 rounded-none border-border/60 bg-background pl-10 shadow-none"
          />
        </div>
        <label htmlFor="links-status" className="sr-only">
          友链状态
        </label>
        <select
          id="links-status"
          name="status"
          defaultValue={status}
          className="h-10 rounded-none border border-border/60 bg-background px-3 text-sm text-foreground outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <option value="all">全部状态</option>
          <option value="active">已收录</option>
          <option value="new">新收录</option>
        </select>
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center border border-border/70 bg-foreground px-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          筛选
        </button>
        {hasFilters ? (
          <Link
            href="/links"
            className="inline-flex h-10 items-center justify-center border border-border/70 bg-background px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            清除
          </Link>
        ) : null}
      </form>
    </section>
  );
}

function ActiveLinkSummary({
  query,
  status,
}: {
  query: string;
  status: LinkStatus;
}) {
  const hasFilters = Boolean(query || status !== DEFAULT_STATUS);
  if (!hasFilters) return null;

  return (
    <section className="mt-3 flex flex-col gap-2 bg-muted/15 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">当前筛选</span>
        {query ? (
          <FilterPill
            label={`关键词：${query}`}
            href={buildLinksPath({ status })}
          />
        ) : null}
        {status !== DEFAULT_STATUS ? (
          <FilterPill
            label={`状态：${getStatusLabel(status)}`}
            href={buildLinksPath({ query })}
          />
        ) : null}
      </div>
      <Link
        href="/links"
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
      aria-label="友链概览"
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

function FriendLinkRow({ item, index }: { item: FriendLink; index: number }) {
  return (
    <Link
      href={item.href}
      target="_blank"
      rel="noreferrer"
      className="group -mx-2 grid min-w-0 gap-3 px-2 py-4 transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:grid-cols-[44px_minmax(0,1fr)_120px_24px]"
    >
      <span className="text-sm text-muted-foreground">
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="min-w-0">
        <span className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="truncate font-serif text-xl leading-tight transition-opacity group-hover:opacity-70">
            {item.name}
          </span>
          <Badge
            variant="secondary"
            className="rounded-none font-normal"
          >
            {item.status === "new" ? "新收录" : "已收录"}
          </Badge>
        </span>
        <span className="mt-2 line-clamp-2 block text-sm leading-6 text-muted-foreground">
          {item.description}
        </span>
      </span>

      {(item.tags && item.tags.length > 0) || item.rss ? (
        <span className="flex flex-wrap gap-1.5 sm:justify-end">
          {item.tags?.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="h-5 rounded-none px-1.5 py-0 text-[10px] font-normal"
            >
              {tag}
            </Badge>
          ))}
          {item.rss ? (
            <Badge
              variant="secondary"
              className="h-5 rounded-none px-1.5 py-0 text-[10px] font-normal"
            >
              <Rss className="h-3 w-3" suppressHydrationWarning />
              RSS
            </Badge>
          ) : null}
        </span>
      ) : (
        <span className="text-sm text-muted-foreground sm:text-right">
          {item.category}
        </span>
      )}
      <ExternalLink
        className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground sm:justify-self-end"
        suppressHydrationWarning
      />
    </Link>
  );
}

function InfoPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2 py-1">
      <div className="py-2">
        <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
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
