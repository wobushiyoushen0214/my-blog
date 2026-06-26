import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import {
  PublicEmptyState,
  PublicPageHeader,
  PublicPageShell,
} from "@/components/public-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Link2,
  MessageSquareText,
  Rss,
  Search,
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

const friendLinks: FriendLink[] = [];

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

export default async function LinksPage() {
  const groupedLinks = friendLinks.reduce<Record<string, FriendLink[]>>(
    (groups, item) => {
      groups[item.category] = [...(groups[item.category] || []), item];
      return groups;
    },
    {}
  );
  const categories = Object.keys(groupedLinks);
  const rssCount = friendLinks.filter((item) => item.rss).length;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <PublicPageShell className="max-w-[1280px]">
        <PublicPageHeader
          eyebrow="Links"
          title="友链"
          description="收录长期阅读和互相连接的站点，也作为发现独立写作者的入口。"
          countLabel={`${friendLinks.length} 个站点`}
          action={
            <Button variant="outline" asChild>
              <Link href="/posts">
                <MessageSquareText
                  className="h-4 w-4"
                  suppressHydrationWarning
                />
                申请互链
              </Link>
            </Button>
          }
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile label="收录站点" value={friendLinks.length} />
          <StatTile label="主题分组" value={categories.length} />
          <StatTile label="RSS 可订阅" value={rssCount} />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-8">
            {friendLinks.length > 0 ? (
              categories.map((category) => (
                <section key={category} className="space-y-4">
                  <div className="border-b border-border/50 pb-3">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
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
                  <div className="grid gap-3 md:grid-cols-2">
                    {groupedLinks[category].map((item) => (
                      <FriendLinkCard key={item.href} item={item} />
                    ))}
                  </div>
                </section>
              ))
            ) : (
              <PublicEmptyState
                icon={Link2}
                title="暂无公开友链"
                description="友链目录还没有公开收录。欢迎通过文章评论区留下站点信息，审核后会展示在这里。"
                action={
                  <Button variant="outline" asChild>
                    <Link href="/posts">
                      去文章区留言
                      <ArrowRight
                        className="h-4 w-4"
                        suppressHydrationWarning
                      />
                    </Link>
                  </Button>
                }
                className="max-w-none"
              />
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <InfoPanel
              title="申请互链"
              description="留言时带上这些信息，后续整理时可以直接录入。"
            >
              <ul className="grid gap-2">
                {applicationFields.map((field) => (
                  <li key={field} className="flex gap-2 text-sm leading-6">
                    <CheckCircle2
                      className="mt-1 h-4 w-4 shrink-0 text-primary"
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

            <section className="rounded-lg border bg-card p-4">
              <p className="text-sm font-medium">继续浏览</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                如果只是想发现内容，可以从文章流或搜索入口继续。
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
                    <Search className="h-4 w-4" suppressHydrationWarning />
                  </Link>
                </Button>
                <Button variant="outline" className="justify-between" asChild>
                  <Link href="/rss.xml">
                    RSS 订阅
                    <Rss className="h-4 w-4" suppressHydrationWarning />
                  </Link>
                </Button>
              </div>
            </section>
          </aside>
        </div>
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

function FriendLinkCard({ item }: { item: FriendLink }) {
  return (
    <Link
      href={item.href}
      target="_blank"
      rel="noreferrer"
      className="group rounded-lg border border-border/60 bg-card p-4 transition-colors hover:border-primary/35 hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-medium transition-colors group-hover:text-primary">
              {item.name}
            </h2>
            <Badge
              variant={item.status === "new" ? "default" : "outline"}
              className="rounded-md font-normal"
            >
              {item.status === "new" ? "新收录" : "已收录"}
            </Badge>
          </div>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
            {item.description}
          </p>
        </div>
        <ExternalLink
          className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
          suppressHydrationWarning
        />
      </div>

      {(item.tags && item.tags.length > 0) || item.rss ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {item.tags?.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="h-5 rounded-md px-1.5 py-0 text-[10px] font-normal"
            >
              {tag}
            </Badge>
          ))}
          {item.rss ? (
            <Badge
              variant="outline"
              className="h-5 rounded-md px-1.5 py-0 text-[10px] font-normal"
            >
              <Rss className="h-3 w-3" suppressHydrationWarning />
              RSS
            </Badge>
          ) : null}
        </div>
      ) : null}
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
    <section className="rounded-lg border bg-card">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-medium">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
