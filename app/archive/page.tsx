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
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Eye,
  FileText,
  Hash,
  NotebookText,
  Rss,
  Search,
} from "lucide-react";
import type { Metadata } from "next";
import type { Category, Post, Tag } from "@/lib/types";

export const metadata: Metadata = {
  title: "归档",
};

type ArchivePostBase = Pick<
  Post,
  "id" | "title" | "slug" | "excerpt" | "created_at" | "updated_at" | "view_count"
> & {
  category?: Category | null;
};

type ArchivePost = ArchivePostBase & {
  tags: Tag[];
};

type MonthGroup = {
  key: string;
  label: string;
  posts: ArchivePost[];
};

type YearGroup = {
  year: string;
  count: number;
  months: MonthGroup[];
};

type YearBucket = {
  year: string;
  count: number;
  months: Map<string, MonthGroup>;
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  });
}

function formatViews(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value || 0);
}

function getMonthKey(date: string) {
  const value = new Date(date);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  return {
    year: String(year),
    key: `${year}-${month}`,
    label: `${year} 年 ${month} 月`,
  };
}

function getCategoryHref(category: Category) {
  return category.type === "moment"
    ? `/moments?category=${encodeURIComponent(category.slug)}`
    : `/posts?category=${encodeURIComponent(category.slug)}`;
}

function getContentTypeLabel(category?: Category | null) {
  return category?.type === "moment" ? "见闻" : "文章";
}

function groupArchivePosts(posts: ArchivePost[]): YearGroup[] {
  const yearMap = posts.reduce<Map<string, YearBucket>>((groups, post) => {
    const month = getMonthKey(post.created_at);
    const yearGroup =
      groups.get(month.year) ||
      ({
        year: month.year,
        count: 0,
        months: new Map<string, MonthGroup>(),
      } satisfies YearBucket);
    const monthGroup =
      yearGroup.months.get(month.key) ||
      ({
        key: month.key,
        label: month.label,
        posts: [],
      } satisfies MonthGroup);

    monthGroup.posts.push(post);
    yearGroup.months.set(month.key, monthGroup);
    yearGroup.count += 1;
    groups.set(month.year, yearGroup);
    return groups;
  }, new Map());

  return Array.from(yearMap.values()).map((yearGroup) => ({
    year: yearGroup.year,
    count: yearGroup.count,
    months: Array.from(yearGroup.months.values()),
  }));
}

export default async function ArchivePage() {
  const supabase = await createClient();

  const [{ data: postRows }, { data: tags }] = await Promise.all([
    supabase
      .from("posts")
      .select(
        "id,title,slug,excerpt,created_at,updated_at,view_count,category:categories(*)"
      )
      .eq("published", true)
      .order("created_at", { ascending: false }),
    supabase.from("tags").select("*").order("name"),
  ]);

  const posts = (postRows || []) as unknown as ArchivePostBase[];
  const postIds = posts.map((post) => post.id);
  const { data: postTags } =
    postIds.length > 0
      ? await supabase
          .from("post_tags")
          .select("post_id, tag_id")
          .in("post_id", postIds)
      : { data: [] };

  const tagById = new Map((tags || []).map((tag) => [tag.id, tag as Tag]));
  const tagsByPostId = (postTags || []).reduce<Map<string, Tag[]>>(
    (groups, postTag) => {
      const tag = tagById.get(postTag.tag_id);
      if (!tag) return groups;
      groups.set(postTag.post_id, [...(groups.get(postTag.post_id) || []), tag]);
      return groups;
    },
    new Map()
  );

  const archivePosts: ArchivePost[] = posts.map((post) => ({
    ...post,
    tags: tagsByPostId.get(post.id) || [],
  }));
  const yearGroups = groupArchivePosts(archivePosts);
  const articleCount = archivePosts.filter(
    (post) => post.category?.type !== "moment"
  ).length;
  const momentCount = archivePosts.filter(
    (post) => post.category?.type === "moment"
  ).length;
  const totalViews = archivePosts.reduce(
    (sum, post) => sum + (post.view_count || 0),
    0
  );
  const yearRange =
    yearGroups.length > 1
      ? `${yearGroups[yearGroups.length - 1].year} - ${yearGroups[0].year}`
      : yearGroups[0]?.year || "0";
  const categoryStats = Array.from(
    archivePosts.reduce<Map<string, { category: Category; count: number }>>(
      (groups, post) => {
        if (!post.category) return groups;
        const current = groups.get(post.category.id);
        groups.set(post.category.id, {
          category: post.category,
          count: (current?.count || 0) + 1,
        });
        return groups;
      },
      new Map()
    ).values()
  ).sort((a, b) => b.count - a.count);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <PublicPageShell className="max-w-[1280px]">
        <PublicPageHeader
          eyebrow="Archive"
          title="归档"
          description="按发布时间回看文章和见闻，适合快速定位某个阶段的记录。"
          countLabel={`${archivePosts.length} 篇内容`}
          action={
            <Button variant="outline" asChild>
              <Link href="/search">
                <Search className="h-4 w-4" suppressHydrationWarning />
                搜索
              </Link>
            </Button>
          }
        />

        {archivePosts.length > 0 ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <ArchiveStat label="全部内容" value={archivePosts.length} />
              <ArchiveStat label="文章" value={articleCount} />
              <ArchiveStat label="见闻" value={momentCount} />
              <ArchiveStat label="年份跨度" value={yearRange} />
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
              <ArchiveTimeline yearGroups={yearGroups} totalViews={totalViews} />

              <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
                <YearIndex yearGroups={yearGroups} />
                <CategoryDistribution items={categoryStats.slice(0, 8)} />
                <BrowsePanel />
              </aside>
            </div>
          </>
        ) : (
          <PublicEmptyState
            icon={CalendarDays}
            title="暂无归档内容"
            description="发布文章或见闻后，这里会按年份和月份自动整理。"
            action={
              <Button variant="outline" asChild>
                <Link href="/posts">查看文章列表</Link>
              </Button>
            }
          />
        )}
      </PublicPageShell>
      <Footer />
    </div>
  );
}

function ArchiveStat({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function ArchiveTimeline({
  yearGroups,
  totalViews,
}: {
  yearGroups: YearGroup[];
  totalViews: number;
}) {
  return (
    <section aria-labelledby="archive-timeline-title" className="min-w-0 space-y-6">
      <div className="border-b border-border/50 pb-3">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
          Timeline
        </p>
        <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="archive-timeline-title" className="text-base font-medium">
              时间线
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {formatViews(totalViews)} 次累计阅读，按最新发布排序。
            </p>
          </div>
          <span className="text-sm text-muted-foreground">
            {yearGroups.length} 个年份
          </span>
        </div>
      </div>

      <div className="space-y-8">
        {yearGroups.map((yearGroup) => (
          <section
            key={yearGroup.year}
            id={`archive-${yearGroup.year}`}
            className="scroll-mt-24 space-y-3"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold tracking-tight">
                {yearGroup.year}
              </h3>
              <span className="text-sm text-muted-foreground">
                {yearGroup.count} 篇
              </span>
            </div>
            <div className="space-y-3">
              {yearGroup.months.map((monthGroup) => (
                <MonthArchiveGroup key={monthGroup.key} group={monthGroup} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

function MonthArchiveGroup({ group }: { group: MonthGroup }) {
  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
        <div className="inline-flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-muted-foreground" suppressHydrationWarning />
          <h4 className="text-sm font-medium">{group.label}</h4>
        </div>
        <span className="text-sm text-muted-foreground">{group.posts.length} 篇</span>
      </div>
      <div className="divide-y divide-border/60">
        {group.posts.map((post) => (
          <ArchivePostRow key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}

function ArchivePostRow({ post }: { post: ArchivePost }) {
  return (
    <article className="grid gap-3 px-4 py-3 transition-colors hover:bg-muted/20 sm:grid-cols-[4.5rem_minmax(0,1fr)_auto]">
      <time
        dateTime={post.created_at}
        className="text-sm font-medium tabular-nums text-muted-foreground"
      >
        {formatDate(post.created_at)}
      </time>

      <div className="min-w-0 space-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge variant="outline" className="h-5 rounded-md px-1.5 py-0 text-[10px] font-normal">
            {getContentTypeLabel(post.category)}
          </Badge>
          {post.category ? (
            <Badge
              variant="secondary"
              asChild
              className="h-5 rounded-md px-1.5 py-0 text-[10px] font-normal"
            >
              <Link href={getCategoryHref(post.category)}>{post.category.name}</Link>
            </Badge>
          ) : null}
        </div>

        <h3 className="truncate text-base font-medium tracking-tight">
          <Link
            href={`/blog/${post.slug}`}
            className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {post.title}
          </Link>
        </h3>

        {post.excerpt ? (
          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
            {post.excerpt}
          </p>
        ) : null}

        {post.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.slice(0, 4).map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                asChild
                className="h-5 rounded-md px-1.5 py-0 text-[10px] font-normal text-muted-foreground"
              >
                <Link href={`/tag/${tag.slug}`}>
                  <Hash className="h-3 w-3" suppressHydrationWarning />
                  {tag.name}
                </Link>
              </Badge>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex items-start gap-1.5 text-xs text-muted-foreground sm:justify-end">
        <Eye className="mt-0.5 h-3.5 w-3.5" suppressHydrationWarning />
        <span>{formatViews(post.view_count)} 阅读</span>
      </div>
    </article>
  );
}

function YearIndex({ yearGroups }: { yearGroups: YearGroup[] }) {
  return (
    <section className="rounded-lg border bg-card p-4">
      <p className="text-sm font-medium">年份索引</p>
      <div className="mt-3 grid gap-1">
        {yearGroups.map((yearGroup) => (
          <Link
            key={yearGroup.year}
            href={`#archive-${yearGroup.year}`}
            className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <span>{yearGroup.year}</span>
            <span>{yearGroup.count}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function CategoryDistribution({
  items,
}: {
  items: { category: Category; count: number }[];
}) {
  if (items.length === 0) return null;

  return (
    <section className="rounded-lg border bg-card p-4">
      <p className="text-sm font-medium">主题分布</p>
      <div className="mt-3 grid gap-1">
        {items.map((item) => (
          <Link
            key={item.category.id}
            href={getCategoryHref(item.category)}
            className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <span className="min-w-0 truncate">{item.category.name}</span>
            <span className="shrink-0">{item.count}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function BrowsePanel() {
  return (
    <section className="rounded-lg border bg-card p-4">
      <p className="text-sm font-medium">继续浏览</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        也可以按内容类型、主题或订阅源继续发现内容。
      </p>
      <div className="mt-4 grid gap-2">
        <Button variant="outline" className="justify-between" asChild>
          <Link href="/posts">
            <span className="inline-flex items-center gap-2">
              <FileText className="h-4 w-4" suppressHydrationWarning />
              文章
            </span>
            <ArrowRight className="h-4 w-4" suppressHydrationWarning />
          </Link>
        </Button>
        <Button variant="outline" className="justify-between" asChild>
          <Link href="/moments">
            <span className="inline-flex items-center gap-2">
              <NotebookText className="h-4 w-4" suppressHydrationWarning />
              见闻
            </span>
            <ArrowRight className="h-4 w-4" suppressHydrationWarning />
          </Link>
        </Button>
        <Button variant="outline" className="justify-between" asChild>
          <Link href="/rss.xml">
            <span className="inline-flex items-center gap-2">
              <Rss className="h-4 w-4" suppressHydrationWarning />
              RSS
            </span>
            <ArrowRight className="h-4 w-4" suppressHydrationWarning />
          </Link>
        </Button>
      </div>
    </section>
  );
}
