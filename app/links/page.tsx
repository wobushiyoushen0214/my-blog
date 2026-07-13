import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { DeviceShell } from "@/components/device-shell";
import {
  PublicActionLink,
  PublicEmptyState,
  PublicPageHeader,
  PublicPageShell,
  publicPrimaryButtonClassName,
  publicSecondaryButtonClassName,
  publicSelectClassName,
} from "@/components/public-page";
import { Badge } from "@/components/ui/badge";
import {
  ExternalLink,
  Link2,
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
  const hasFilters = Boolean(query || status !== DEFAULT_STATUS);
  const countLabel = hasFilters
    ? `${filteredLinks.length} / ${friendLinks.length} 个站点`
    : `${friendLinks.length} 个站点`;

  return (
    <DeviceShell>
      <div className="public-device-layout">
      <Header />
      <PublicPageShell>
        <PublicPageHeader
          eyebrow="Links"
          title="友链"
          description="长期阅读和互相连接的站点。"
          countLabel={countLabel}
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

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="min-w-0 space-y-8">
            {filteredLinks.length > 0 ? (
              categories.map((category) => (
                <section key={category} className="space-y-4">
                  <div className="flex items-end justify-between gap-3 border-b border-border/60 pb-3">
                    <h2 className="text-base font-medium">{category}</h2>
                    <span className="text-sm text-muted-foreground">
                      {groupedLinks[category].length} 个
                    </span>
                  </div>
                  <div className="grid gap-1">
                    {groupedLinks[category].map((item) => (
                      <FriendLinkRow key={item.href} item={item} />
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
                description="友链目录还没有公开收录。可以先参考右侧的互链信息，通过文章评论区留下站点资料。"
                className="max-w-none"
              />
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <InfoPanel
              title="互链信息"
              description="本站资料和留言所需信息集中在这里。"
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
              <div className="mt-4 border-t border-border/60 pt-4">
                <h3 className="text-xs font-medium text-foreground">
                  留言时附上
                </h3>
                <ul className="mt-2 grid gap-2">
                  {applicationFields.map((field) => (
                    <li key={field} className="text-sm leading-6 text-muted-foreground">
                      {field}
                    </li>
                  ))}
                </ul>
              </div>
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

          </aside>
        </div>
      </PublicPageShell>
        <Footer />
      </div>
    </DeviceShell>
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
        aria-label="友链筛选"
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        {rawQuery ? <input type="hidden" name="q" value={rawQuery} /> : null}
        <label htmlFor="links-status" className="sr-only">
          友链状态
        </label>
        <select
          id="links-status"
          name="status"
          defaultValue={status}
          className={`${publicSelectClassName} sm:w-40`}
        >
          <option value="all">全部状态</option>
          <option value="active">已收录</option>
          <option value="new">新收录</option>
        </select>
        <button type="submit" className={publicPrimaryButtonClassName}>
          应用
        </button>
        {hasFilters ? (
          <Link href="/links" className={publicSecondaryButtonClassName}>
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
    <section className="mt-3 flex flex-col gap-2 border-b border-border/70 pb-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Filter
        </span>
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
        className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
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

function FriendLinkRow({ item }: { item: FriendLink }) {
  return (
    <Link
      href={item.href}
      target="_blank"
      rel="noreferrer"
      className="friend-link-row group grid min-w-0 gap-3 border-b border-border/70 px-1 py-5 transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:grid-cols-[minmax(0,1fr)_120px_24px] animate-in fade-in slide-in-from-bottom-2 duration-400 fill-mode-both"
    >
      <span className="min-w-0">
        <span className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="truncate font-serif text-lg font-light italic leading-6 text-foreground transition-opacity group-hover:opacity-75">
            {item.name}
          </span>
          <Badge
            variant="secondary"
            className="rounded-md font-normal"
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
              className="h-5 rounded-md px-1.5 py-0 text-[10px] font-normal"
            >
              {tag}
            </Badge>
          ))}
          {item.rss ? (
            <Badge
              variant="secondary"
              className="h-5 rounded-md px-1.5 py-0 text-[10px] font-normal"
            >
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
    <section className="surface-card border-y border-border/60 py-4 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both delay-100">
      <div className="pb-2">
        <h2 className="text-sm font-medium text-foreground">
          {title}
        </h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="pt-2">{children}</div>
    </section>
  );
}
