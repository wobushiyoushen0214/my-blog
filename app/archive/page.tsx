import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import {
  PublicActionLink,
  PublicEmptyState,
  PublicIndexLinks,
  PublicInfoPanel,
  PublicPageShell,
} from "@/components/public-page";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  CalendarDays,
  Eye,
  FileText,
  Hash,
  NotebookText,
  Rss,
  Search,
  X,
} from "lucide-react";
import type { Category, Post, PostTag, Tag } from "@/lib/types";

export const metadata: Metadata = {
  title: "归档",
};

type ArchiveType = "all" | "post" | "moment";
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

const DEFAULT_TYPE: ArchiveType = "all";

function normalizeQuery(query: string) {
  return query.replace(/[%,().]/g, " ").replace(/\s+/g, " ").trim();
}

function parseType(value?: string): ArchiveType {
  return value === "post" || value === "moment" ? value : DEFAULT_TYPE;
}

function buildArchivePath({
  query,
  type,
}: {
  query?: string;
  type?: ArchiveType;
} = {}) {
  const params = new URLSearchParams();

  if (query) params.set("q", query);
  if (type && type !== DEFAULT_TYPE) params.set("type", type);

  const search = params.toString();
  return search ? `/archive?${search}` : "/archive";
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  });
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value || 0);
}

function getMonthMeta(date: string) {
  const value = new Date(date);
  const year = String(value.getFullYear());
  const month = String(value.getMonth() + 1).padStart(2, "0");

  return {
    year,
    key: `${year}-${month}`,
    label: `${year} 年 ${month} 月`,
  };
}

function getContentType(post: Pick<ArchivePost, "category">): Exclude<ArchiveType, "all"> {
  return post.category?.type === "moment" ? "moment" : "post";
}

function getContentTypeLabel(post: Pick<ArchivePost, "category">) {
  return getContentType(post) === "moment" ? "见闻" : "文章";
}

function matchesArchiveQuery(post: ArchivePost, query: string) {
  if (!query) return true;

  const normalized = query.toLowerCase();
  const values = [
    post.title,
    post.excerpt,
    post.category?.name,
    post.category?.slug,
    ...post.tags.flatMap((tag) => [tag.name, tag.slug]),
  ];

  return values.some((value) => value?.toLowerCase().includes(normalized));
}

function filterArchivePosts(
  posts: ArchivePost[],
  query: string,
  type: ArchiveType
) {
  return posts.filter((post) => {
    const matchesType = type === DEFAULT_TYPE || getContentType(post) === type;
    return matchesType && matchesArchiveQuery(post, query);
  });
}

function groupArchivePosts(posts: ArchivePost[]) {
  const yearMap = new Map<
    string,
    { year: string; count: number; months: Map<string, MonthGroup> }
  >();

  posts.forEach((post) => {
    const month = getMonthMeta(post.created_at);

    if (!yearMap.has(month.year)) {
      yearMap.set(month.year, {
        year: month.year,
        count: 0,
        months: new Map(),
      });
    }

    const yearGroup = yearMap.get(month.year)!;

    if (!yearGroup.months.has(month.key)) {
      yearGroup.months.set(month.key, {
        key: month.key,
        label: month.label,
        posts: [],
      });
    }

    yearGroup.months.get(month.key)!.posts.push(post);
    yearGroup.count += 1;
  });

  return Array.from(yearMap.values()).map((yearGroup) => ({
    year: yearGroup.year,
    count: yearGroup.count,
    months: Array.from(yearGroup.months.values()),
  }));
}

function getTypeLabel(type: ArchiveType) {
  if (type === "post") return "文章";
  if (type === "moment") return "见闻";
  return "全部内容";
}

function getYearRange(groups: YearGroup[]) {
  if (groups.length === 0) return "暂无年份";
  if (groups.length === 1) return groups[0].year;

  return `${groups[groups.length - 1].year} - ${groups[0].year}`;
}

function attachTagsFromRows(
  posts: ArchivePostBase[],
  postTags: PostTag[],
  tags: Tag[]
) {
  const tagById = new Map(tags.map((tag) => [tag.id, tag]));
  const tagsByPostId = new Map<string, Tag[]>();

  postTags.forEach((postTag) => {
    const tag = tagById.get(postTag.tag_id);
    if (!tag) return;

    const groupedTags = tagsByPostId.get(postTag.post_id);
    if (groupedTags) {
      groupedTags.push(tag);
      return;
    }

    tagsByPostId.set(postTag.post_id, [tag]);
  });

  return posts.map((post) => ({
    ...post,
    tags: tagsByPostId.get(post.id) || [],
  }));
}

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { q, type: typeParam } = await searchParams;
  const rawQuery = q?.trim() || "";
  const query = normalizeQuery(rawQuery);
  const type = parseType(typeParam);
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

  const allPosts = attachTagsFromRows(
    posts,
    (postTags || []) as PostTag[],
    (tags || []) as Tag[]
  );
  const filteredPosts = filterArchivePosts(allPosts, query, type);
  const yearGroups = groupArchivePosts(filteredPosts);
  const articleCount = filteredPosts.filter(
    (post) => getContentType(post) === "post"
  ).length;
  const momentCount = filteredPosts.filter(
    (post) => getContentType(post) === "moment"
  ).length;
  const totalViews = filteredPosts.reduce(
    (sum, post) => sum + (post.view_count || 0),
    0
  );
  const hasFilters = Boolean(query || type !== DEFAULT_TYPE);
  const countLabel = hasFilters
    ? `${filteredPosts.length} / ${allPosts.length} 篇`
    : `${allPosts.length} 篇`;
  const pageTitle = query ? `归档 · ${query}` : "归档";

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <PublicPageShell className="py-10 md:py-14">
        <ArchiveHero
          title={pageTitle}
          countLabel={countLabel}
          articleCount={articleCount}
          momentCount={momentCount}
          totalViews={totalViews}
          yearRange={getYearRange(yearGroups)}
          hasContent={allPosts.length > 0}
        />

        <ArchiveFilterBar
          rawQuery={rawQuery}
          type={type}
          hasFilters={hasFilters}
        />

        <ActiveArchiveSummary query={query} type={type} />

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="min-w-0">
            {yearGroups.length > 0 ? (
              <ArchiveTimeline groups={yearGroups} totalViews={totalViews} />
            ) : allPosts.length > 0 ? (
              <PublicEmptyState
                icon={Search}
                title="没有匹配的归档内容"
                description={
                  query
                    ? `没有找到包含「${query}」的内容，可以换个关键词或清除筛选。`
                    : "当前类型下暂无归档内容，可以切换到全部内容查看。"
                }
                action={
                  <PublicActionLink href="/archive">清除筛选</PublicActionLink>
                }
                className="max-w-none"
              />
            ) : (
              <PublicEmptyState
                icon={CalendarDays}
                title="暂无归档内容"
                description="发布文章或见闻后，这里会按年份和月份自动整理。"
                action={
                  <PublicActionLink href="/posts">
                    查看文章列表
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
            <YearIndex groups={yearGroups} />
            <PublicInfoPanel
              title="继续浏览"
              description="也可以按内容类型、关键词或订阅源继续发现内容。"
              contentClassName="py-1"
            >
              <PublicIndexLinks
                ariaLabel="归档页继续浏览"
                items={[
                  {
                    href: "/posts",
                    label: "文章列表",
                    description: "按分类和排序浏览长文",
                    icon: FileText,
                  },
                  {
                    href: "/moments",
                    label: "见闻列表",
                    description: "查看更轻量的记录",
                    icon: NotebookText,
                  },
                  {
                    href: "/search",
                    label: "搜索内容",
                    description: "按关键词检索全站",
                    icon: Search,
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

function ArchiveHero({
  title,
  countLabel,
  articleCount,
  momentCount,
  totalViews,
  yearRange,
  hasContent,
}: {
  title: string;
  countLabel: string;
  articleCount: number;
  momentCount: number;
  totalViews: number;
  yearRange: string;
  hasContent: boolean;
}) {
  const metaItems = hasContent
    ? [
        `${articleCount} 篇文章`,
        `${momentCount} 条见闻`,
        `${formatNumber(totalViews)} 次阅读`,
        yearRange,
      ]
    : ["等待第一篇记录", "按年份自动整理"];

  return (
    <header className="mb-8 border-b-[0.5px] border-border/25 pb-8 md:mb-9 md:pb-10">
      <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="min-w-0">
          <p className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
            <span className="h-px w-7 bg-primary/50" aria-hidden="true" />
            Archive
          </p>
          <div className="mt-4 flex min-w-0 flex-wrap items-end gap-x-4 gap-y-2">
            <h1 className="min-w-0 font-serif text-5xl leading-[0.95] tracking-tight italic md:text-6xl">
              {title}
            </h1>
            <span className="pb-1.5 text-sm text-muted-foreground">
              {countLabel}
            </span>
          </div>
          <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground">
            按发布时间回看文章和见闻。这里更像一份索引：先看时间，再顺手按关键词、类型或年份缩小范围。
          </p>
          <dl className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
            {metaItems.map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 after:h-1 after:w-1 after:bg-border last:after:hidden"
              >
                <dt className="sr-only">归档信息</dt>
                <dd>{item}</dd>
              </div>
            ))}
          </dl>
        </div>
        <PublicActionLink href="/rss.xml" className="md:mb-1">
          <Rss className="h-4 w-4" suppressHydrationWarning />
          RSS
        </PublicActionLink>
      </div>
    </header>
  );
}

function ArchiveFilterBar({
  rawQuery,
  type,
  hasFilters,
}: {
  rawQuery: string;
  type: ArchiveType;
  hasFilters: boolean;
}) {
  return (
    <section className="py-1">
      <form
        action="/archive"
        role="search"
        className="grid gap-2 md:grid-cols-[minmax(0,1fr)_150px_auto_auto]"
      >
        <label htmlFor="archive-search" className="sr-only">
          搜索归档
        </label>
        <div className="relative min-w-0">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            suppressHydrationWarning
          />
          <Input
            id="archive-search"
            type="search"
            name="q"
            defaultValue={rawQuery}
            placeholder="搜索标题、摘要、分类或标签..."
            className="h-11 rounded-none border-transparent bg-muted/25 pl-10 shadow-none hover:bg-muted/35 focus-visible:bg-background"
          />
        </div>
        <label htmlFor="archive-type" className="sr-only">
          内容类型
        </label>
        <select
          id="archive-type"
          name="type"
          defaultValue={type}
          className="h-11 rounded-none border border-transparent bg-muted/25 px-3 text-sm text-foreground outline-none transition-[background-color,color,box-shadow] hover:bg-muted/35 focus-visible:border-ring focus-visible:bg-background focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <option value="all">全部内容</option>
          <option value="post">只看文章</option>
          <option value="moment">只看见闻</option>
        </select>
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          筛选
        </button>
        {hasFilters ? (
          <Link
            href="/archive"
            className="inline-flex h-11 items-center justify-center bg-muted/25 px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/35 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            清除
          </Link>
        ) : null}
      </form>
    </section>
  );
}

function ActiveArchiveSummary({
  query,
  type,
}: {
  query: string;
  type: ArchiveType;
}) {
  const hasFilters = Boolean(query || type !== DEFAULT_TYPE);
  if (!hasFilters) return null;

  return (
    <section className="mt-3 flex flex-col gap-2 bg-muted/15 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">当前筛选</span>
        {query ? (
          <FilterPill
            label={`关键词：${query}`}
            href={buildArchivePath({ type })}
          />
        ) : null}
        {type !== DEFAULT_TYPE ? (
          <FilterPill
            label={`类型：${getTypeLabel(type)}`}
            href={buildArchivePath({ query })}
          />
        ) : null}
      </div>
      <Link
        href="/archive"
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

function ArchiveTimeline({
  groups,
  totalViews,
}: {
  groups: YearGroup[];
  totalViews: number;
}) {
  return (
    <section aria-labelledby="archive-timeline-title" className="space-y-8">
      <div className="flex flex-col gap-1 border-b-[0.5px] border-border/25 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Timeline
          </p>
          <h2 id="archive-timeline-title" className="mt-1 font-serif text-2xl leading-tight italic">
            完整时间线
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {formatNumber(totalViews)} 次累计阅读
        </p>
      </div>

      <div className="space-y-12">
        {groups.map((group) => (
          <YearSection key={group.year} group={group} />
        ))}
      </div>
    </section>
  );
}

function YearSection({ group }: { group: YearGroup }) {
  return (
    <section
      id={`archive-${group.year}`}
      className="scroll-mt-28 space-y-6"
    >
      <div className="grid gap-4 sm:grid-cols-[6rem_minmax(0,1fr)]">
        <div className="sm:pt-1">
          <h3 className="font-serif text-4xl leading-none tracking-tight">
            {group.year}
          </h3>
          <p className="mt-2 text-xs text-muted-foreground">{group.count} 篇</p>
        </div>
        <div className="min-w-0 space-y-7">
          {group.months.map((month) => (
            <MonthSection key={month.key} month={month} />
          ))}
        </div>
      </div>
    </section>
  );
}

function MonthSection({ month }: { month: MonthGroup }) {
  return (
    <section className="grid gap-3 sm:grid-cols-[5rem_minmax(0,1fr)]">
      <h4 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground sm:pt-4">
        {month.label.replace(/^\d+ 年 /, "")}
      </h4>
      <div className="min-w-0 border-l-[0.5px] border-border/30 pl-4 sm:pl-5">
        <div className="grid gap-1">
          {month.posts.map((post) => (
            <ArchiveRow key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ArchiveRow({ post }: { post: ArchivePost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group grid min-w-0 gap-3 border-b-[0.5px] border-border/15 py-4 transition-colors last:border-b-0 hover:bg-muted/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:grid-cols-[4rem_minmax(0,1fr)_5.5rem]"
    >
      <time
        dateTime={post.created_at}
        className="text-sm tabular-nums text-muted-foreground"
      >
        {formatDate(post.created_at)}
      </time>

      <span className="min-w-0">
        <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5">
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {getContentTypeLabel(post)}
          </span>
          {post.category ? (
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {post.category.name}
            </span>
          ) : null}
        </span>

        <span className="mt-2 block line-clamp-2 font-serif text-xl leading-tight tracking-tight transition-opacity group-hover:opacity-70">
          {post.title}
        </span>

        {post.excerpt ? (
          <span className="mt-2 block line-clamp-2 text-sm leading-6 text-muted-foreground">
            {post.excerpt}
          </span>
        ) : null}

        {post.tags.length > 0 ? (
          <span className="mt-3 flex min-w-0 flex-wrap gap-1.5">
            {post.tags.slice(0, 4).map((tag) => (
              <span
                key={tag.id}
                className="inline-flex h-5 items-center gap-1 border-[0.5px] border-border/35 px-1.5 text-[10px] text-muted-foreground"
              >
                <Hash className="h-3 w-3" suppressHydrationWarning />
                {tag.name}
              </span>
            ))}
          </span>
        ) : null}
      </span>

      <span className="flex items-start gap-1.5 text-xs text-muted-foreground sm:justify-end sm:text-right">
        <Eye className="mt-0.5 h-3.5 w-3.5" suppressHydrationWarning />
        <span>{formatNumber(post.view_count)}</span>
      </span>
    </Link>
  );
}

function YearIndex({ groups }: { groups: YearGroup[] }) {
  if (groups.length === 0) return null;

  return (
    <PublicInfoPanel
      title="年份索引"
      description="直接跳到某一年份的归档记录。"
      contentClassName="py-1"
    >
      <nav aria-label="归档年份索引" className="grid gap-1">
        {groups.map((group) => (
          <Link
            key={group.year}
            href={`#archive-${group.year}`}
            className={cn(
              "flex items-center justify-between gap-3 px-2 py-2.5 text-sm transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            )}
          >
            <span className="font-medium">{group.year}</span>
            <span className="text-xs text-muted-foreground">
              {group.count} 篇
            </span>
          </Link>
        ))}
      </nav>
    </PublicInfoPanel>
  );
}
