import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ContentRow } from "@/components/content-row";
import {
  PublicActionLink,
  PublicEmptyState,
  PublicPageShell,
} from "@/components/public-page";
import {
  ArrowRight,
  CalendarDays,
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
  | "id"
  | "title"
  | "slug"
  | "excerpt"
  | "content"
  | "created_at"
  | "updated_at"
  | "view_count"
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
        "id,title,slug,excerpt,content,created_at,updated_at,view_count,category:categories(*)"
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
      <PublicPageShell className="py-9 md:py-12">
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

        <div className="mt-8">
          {yearGroups.length > 0 ? (
            <div className="space-y-8">
              <YearJumpNav groups={yearGroups} />
              <ArchiveTimeline groups={yearGroups} />
            </div>
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
    <header className="mb-7 border-b border-border/60 pb-5">
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            Archive
          </p>
          <div className="mt-2 flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-2">
            <h1 className="min-w-0 text-2xl font-semibold leading-tight md:text-3xl">
              {title}
            </h1>
            <span className="text-sm text-muted-foreground">
              {countLabel}
            </span>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            按发布时间回看文章和见闻。
          </p>
          <dl className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
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
        aria-label="归档筛选"
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        {rawQuery ? <input type="hidden" name="q" value={rawQuery} /> : null}
        <label htmlFor="archive-type" className="sr-only">
          内容类型
        </label>
        <select
          id="archive-type"
          name="type"
          defaultValue={type}
          className="h-10 rounded-md border border-border/60 bg-background px-3 text-sm text-foreground outline-none transition-[background-color,color,box-shadow] hover:bg-muted/30 focus-visible:border-ring focus-visible:bg-background focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:w-40"
        >
          <option value="all">全部内容</option>
          <option value="post">只看文章</option>
          <option value="moment">只看见闻</option>
        </select>
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-md border border-border/60 px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          应用
        </button>
        {hasFilters ? (
          <Link
            href="/archive"
            className="inline-flex h-10 items-center justify-center rounded-md border border-border/60 px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
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
    <section className="mt-3 flex flex-col gap-2 border-b border-border/50 pb-3 sm:flex-row sm:items-center sm:justify-between">
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
      className="inline-flex h-7 max-w-full items-center gap-1.5 rounded-md border border-border/60 px-2 text-xs text-foreground transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      aria-label={`移除${label}`}
    >
      <span className="truncate">{label}</span>
      <X className="h-3 w-3 shrink-0" suppressHydrationWarning />
    </Link>
  );
}

function ArchiveTimeline({
  groups,
}: {
  groups: YearGroup[];
}) {
  return (
    <section aria-label="归档时间线" className="space-y-8">
      <div className="space-y-8">
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
      className="scroll-mt-28 space-y-5"
    >
      <div className="grid gap-4 sm:grid-cols-[5rem_minmax(0,1fr)]">
        <div className="sm:pt-1">
          <h3 className="text-2xl font-semibold leading-none">
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
      <h4 className="text-sm text-muted-foreground sm:pt-4">
        {month.label.replace(/^\d+ 年 /, "")}
      </h4>
      <div className="min-w-0 border-l border-border/60 pl-4 sm:pl-5">
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
    <ContentRow
      post={post}
      dateLabel={formatDate(post.created_at)}
      typeLabel={getContentTypeLabel(post)}
      rightMeta={[`${formatNumber(post.view_count)} 阅读`]}
      className="sm:grid-cols-[4rem_minmax(0,1fr)_5.5rem]"
    />
  );
}

function YearJumpNav({ groups }: { groups: YearGroup[] }) {
  if (groups.length === 0) return null;

  return (
    <nav
      aria-label="归档年份索引"
      className="flex flex-wrap gap-x-4 gap-y-2 border-y border-border/60 py-3"
    >
        {groups.map((group) => (
          <Link
            key={group.year}
            href={`#archive-${group.year}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <span className="font-medium">{group.year}</span>
            <span className="text-xs text-muted-foreground">
              {group.count} 篇
            </span>
          </Link>
        ))}
    </nav>
  );
}
