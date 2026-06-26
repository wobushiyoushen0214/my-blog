import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PostCard } from "@/components/post-card";
import { PublicEmptyState, PublicPageShell } from "@/components/public-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Archive,
  ArrowRight,
  FileText,
  FolderOpen,
  Hash,
  MessageSquare,
  NotebookText,
  Rss,
  Search,
} from "lucide-react";
import type { Category, Comment, Post, Tag } from "@/lib/types";

type PostWithTaxonomy = Post & {
  category?: Category | null;
  tags?: Tag[];
};
type CategorySummary = Category & { postCount: number };
type TagSummary = Tag & { postCount: number };
type Relation<T> = T | T[] | null | undefined;
type RecentDiscussionRow = Pick<
  Comment,
  "id" | "author_name" | "content" | "created_at"
> & {
  post?: Relation<Pick<Post, "title" | "slug" | "published">>;
};
type RecentDiscussion = Pick<
  Comment,
  "id" | "author_name" | "content" | "created_at"
> & {
  postTitle: string;
  postSlug: string;
};

async function attachTags(
  supabase: Awaited<ReturnType<typeof createClient>>,
  posts: PostWithTaxonomy[]
) {
  return Promise.all(
    posts.map(async (post) => {
      const { data: postTags } = await supabase
        .from("post_tags")
        .select("tag_id")
        .eq("post_id", post.id);

      if (!postTags || postTags.length === 0) {
        return { ...post, tags: [] };
      }

      const tagIds = postTags.map((postTag) => postTag.tag_id);
      const { data: tags } = await supabase.from("tags").select("*").in("id", tagIds);
      return { ...post, tags: tags || [] };
    })
  );
}

function categoryHref(category: CategorySummary) {
  return category.type === "moment"
    ? `/moments?category=${encodeURIComponent(category.slug)}`
    : `/posts?category=${encodeURIComponent(category.slug)}`;
}

function firstRelation<T>(relation: Relation<T>) {
  if (Array.isArray(relation)) return relation[0] || null;
  return relation || null;
}

function formatShortDate(date: string) {
  return new Date(date).toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
  });
}

export default async function HomePage() {
  const supabase = await createClient();

  const [
    { data: recentData },
    { data: publishedRows },
    { data: categories },
    { data: tags },
    { data: recentCommentsData },
  ] = await Promise.all([
    supabase
      .from("posts")
      .select("*, category:categories(*)")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(7),
    supabase
      .from("posts")
      .select("id, category_id, view_count")
      .eq("published", true),
    supabase.from("categories").select("*").order("name"),
    supabase.from("tags").select("*").order("name"),
    supabase
      .from("comments")
      .select("id,author_name,content,created_at,post:posts(title,slug,published)")
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const categoryById = new Map(
    (categories || []).map((category) => [category.id, category as Category])
  );
  const publishedPostIds = (publishedRows || []).map((post) => post.id);
  const categoryCounts = (publishedRows || []).reduce<Map<string, number>>(
    (counts, post) => {
      if (!post.category_id) return counts;
      counts.set(post.category_id, (counts.get(post.category_id) || 0) + 1);
      return counts;
    },
    new Map()
  );

  const categorySummaries: CategorySummary[] = (categories || [])
    .map((category) => ({
      ...category,
      postCount: categoryCounts.get(category.id) || 0,
    }))
    .sort((a, b) => {
      if (b.postCount !== a.postCount) return b.postCount - a.postCount;
      return a.name.localeCompare(b.name, "zh-Hans-CN");
    });

  const { data: postTags } =
    publishedPostIds.length > 0
      ? await supabase
          .from("post_tags")
          .select("post_id, tag_id")
          .in("post_id", publishedPostIds)
      : { data: [] };

  const tagCounts = (postTags || []).reduce<Map<string, number>>(
    (counts, postTag) => {
      counts.set(postTag.tag_id, (counts.get(postTag.tag_id) || 0) + 1);
      return counts;
    },
    new Map()
  );
  const tagSummaries: TagSummary[] = (tags || [])
    .map((tag) => ({
      ...tag,
      postCount: tagCounts.get(tag.id) || 0,
    }))
    .filter((tag) => tag.postCount > 0)
    .sort((a, b) => b.postCount - a.postCount);

  const postsWithTags = await attachTags(
    supabase,
    (recentData || []) as unknown as PostWithTaxonomy[]
  );

  const articleCount = (publishedRows || []).filter((post) => {
    const category = post.category_id ? categoryById.get(post.category_id) : null;
    return category?.type !== "moment";
  }).length;
  const momentCount = (publishedRows || []).filter((post) => {
    const category = post.category_id ? categoryById.get(post.category_id) : null;
    return category?.type === "moment";
  }).length;
  const totalViews = (publishedRows || []).reduce(
    (sum, post) => sum + (post.view_count || 0),
    0
  );
  const featuredPost = postsWithTags[0] || null;
  const listPosts = postsWithTags.slice(1);
  const usedCategoryCount = categorySummaries.filter(
    (category) => category.postCount > 0
  ).length;
  const usedTagCount = tagSummaries.length;
  const recentDiscussions: RecentDiscussion[] = (
    (recentCommentsData || []) as unknown as RecentDiscussionRow[]
  )
    .map((comment) => {
      const post = firstRelation(comment.post);
      if (!post?.published || !post.slug || !post.title) return null;

      return {
        id: comment.id,
        author_name: comment.author_name,
        content: comment.content,
        created_at: comment.created_at,
        postTitle: post.title,
        postSlug: post.slug,
      };
    })
    .filter((comment): comment is RecentDiscussion => Boolean(comment))
    .slice(0, 4);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <PublicPageShell className="max-w-[1280px]">
        <section className="border-b border-border/50 pb-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div className="min-w-0 space-y-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
                Community Notes
              </p>
              <div className="space-y-3">
                <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                  Lee 的个人博客
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  记录技术学习、项目复盘和日常见闻。首页按内容类型、主题和时间线组织，方便继续阅读。
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild>
                  <Link href="/posts">
                    阅读文章
                    <ArrowRight
                      className="h-4 w-4"
                      suppressHydrationWarning
                    />
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/moments">
                    <NotebookText
                      className="h-4 w-4"
                      suppressHydrationWarning
                    />
                    浏览见闻
                  </Link>
                </Button>
              </div>
            </div>

            <section className="rounded-lg border bg-card p-3">
              <form
                className="flex flex-col gap-2"
                role="search"
                action="/search"
              >
                <label htmlFor="home-search" className="text-sm font-medium">
                  快速搜索
                </label>
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_130px]">
                  <div className="relative min-w-0 flex-1">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                      suppressHydrationWarning
                    />
                    <Input
                      id="home-search"
                      type="search"
                      name="q"
                      placeholder="搜索标题、正文、分类或标签..."
                      className="h-10 border-border/60 bg-background pl-9"
                    />
                  </div>
                  <label htmlFor="home-search-type" className="sr-only">
                    搜索类型
                  </label>
                  <select
                    id="home-search-type"
                    name="type"
                    defaultValue="all"
                    className="h-10 rounded-md border border-border/60 bg-background px-3 text-sm text-foreground shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <option value="all">全部内容</option>
                    <option value="post">只看文章</option>
                    <option value="moment">只看见闻</option>
                  </select>
                </div>
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <label htmlFor="home-search-sort" className="sr-only">
                    搜索排序
                  </label>
                  <select
                    id="home-search-sort"
                    name="sort"
                    defaultValue="newest"
                    className="h-10 rounded-md border border-border/60 bg-background px-3 text-sm text-foreground shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <option value="newest">最新发布</option>
                    <option value="updated">最近更新</option>
                    <option value="popular">阅读最多</option>
                  </select>
                  <Button type="submit" className="h-10">
                    <Search
                      className="h-4 w-4"
                      suppressHydrationWarning
                    />
                    搜索
                  </Button>
                </div>
              </form>
            </section>
          </div>
        </section>

        <DiscoveryRail
          articleCount={articleCount}
          momentCount={momentCount}
          totalCount={publishedRows?.length || 0}
          topicCount={usedCategoryCount + usedTagCount}
        />

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="已发布内容" value={publishedRows?.length || 0} />
          <StatTile label="文章" value={articleCount} />
          <StatTile label="见闻" value={momentCount} />
          <StatTile label="累计阅读" value={totalViews} />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-8">
            {featuredPost ? (
              <section aria-labelledby="home-featured-title" className="space-y-3">
                <SectionTitle eyebrow="Latest" title="最近更新" id="home-featured-title" />
                <PostCard post={featuredPost} variant="featured" />
              </section>
            ) : (
              <PublicEmptyState
                icon={FileText}
                title="暂无内容"
                description="发布文章或见闻后，最近更新会展示在这里。"
                action={
                  <Button variant="outline" asChild>
                    <Link href="/posts">查看文章列表</Link>
                  </Button>
                }
                className="max-w-none"
              />
            )}

            {listPosts.length > 0 ? (
              <section aria-labelledby="home-more-title" className="space-y-4">
                <div className="flex flex-col gap-1 border-b border-border/50 pb-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
                      More
                    </p>
                    <h2 id="home-more-title" className="text-base font-medium">
                      更多内容
                    </h2>
                  </div>
                  <Link
                    href="/archive"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    全部内容
                    <ArrowRight
                      className="h-4 w-4"
                      suppressHydrationWarning
                    />
                  </Link>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {listPosts.map((post) => (
                    <PostCard key={post.id} post={post} variant="compact" />
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <RecentDiscussionPanel items={recentDiscussions} />
            <TopicPanel
              title="主题"
              description="按分类进入长期内容。"
              items={categorySummaries}
              limit={10}
              icon="category"
            />
            <TopicPanel
              title="标签"
              description="通过关键词交叉浏览。"
              items={tagSummaries}
              limit={14}
              icon="tag"
            />
            <section className="rounded-lg border bg-card p-4">
              <p className="text-sm font-medium">继续浏览</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                首页只展示最近内容，可以继续进入完整归档或订阅更新。
              </p>
              <div className="mt-4 grid gap-2">
                <Button variant="outline" className="justify-between" asChild>
                  <Link href="/category">
                    所有分类
                    <FolderOpen
                      className="h-4 w-4"
                      suppressHydrationWarning
                    />
                  </Link>
                </Button>
                <Button variant="outline" className="justify-between" asChild>
                  <Link href="/tag">
                    所有标签
                    <Hash className="h-4 w-4" suppressHydrationWarning />
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

function RecentDiscussionPanel({ items }: { items: RecentDiscussion[] }) {
  return (
    <section className="rounded-lg border bg-card">
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium">近期讨论</h2>
          <MessageSquare
            className="h-4 w-4 text-muted-foreground"
            suppressHydrationWarning
          />
        </div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          最近通过审核的读者评论。
        </p>
      </div>
      {items.length > 0 ? (
        <div className="divide-y divide-border/60">
          {items.map((item) => {
            const initial =
              item.author_name.trim().slice(0, 1).toUpperCase() || "?";

            return (
              <Link
                key={item.id}
                href={`/blog/${item.postSlug}#comments`}
                className="group flex min-w-0 gap-3 px-4 py-3 transition-colors hover:bg-muted/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border bg-background text-xs font-medium text-muted-foreground">
                  {initial}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex min-w-0 items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium transition-colors group-hover:text-primary">
                      {item.author_name}
                    </span>
                    <time
                      dateTime={item.created_at}
                      className="shrink-0 text-xs text-muted-foreground"
                    >
                      {formatShortDate(item.created_at)}
                    </time>
                  </span>
                  <span className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                    {item.content}
                  </span>
                  <span className="mt-1 block truncate text-xs text-muted-foreground/80">
                    {item.postTitle}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="px-4 py-5">
          <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 p-4 text-sm">
            <p className="font-medium">暂无公开讨论</p>
            <p className="mt-1 leading-6 text-muted-foreground">
              文章评论通过审核后，会出现在这里。
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function DiscoveryRail({
  articleCount,
  momentCount,
  totalCount,
  topicCount,
}: {
  articleCount: number;
  momentCount: number;
  totalCount: number;
  topicCount: number;
}) {
  const items = [
    {
      href: "/posts",
      label: "文章",
      description: "技术笔记、项目复盘和长期主题",
      countLabel: `${articleCount} 篇`,
      icon: FileText,
    },
    {
      href: "/moments",
      label: "见闻",
      description: "短记录、观察和轻量片段",
      countLabel: `${momentCount} 条`,
      icon: NotebookText,
    },
    {
      href: "/archive",
      label: "归档",
      description: "按年份和月份回看全部内容",
      countLabel: `${totalCount} 篇`,
      icon: Archive,
    },
    {
      href: "/category",
      label: "主题索引",
      description: "从分类和标签继续交叉发现",
      countLabel: `${topicCount} 个入口`,
      icon: FolderOpen,
    },
  ];

  return (
    <section
      aria-label="内容浏览入口"
      className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className="group flex min-w-0 items-start gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary/35 hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors group-hover:text-primary">
              <Icon className="h-4 w-4" suppressHydrationWarning />
            </span>
            <span className="min-w-0">
              <span className="flex min-w-0 items-center justify-between gap-2">
                <span className="truncate text-sm font-medium transition-colors group-hover:text-primary">
                  {item.label}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {item.countLabel}
                </span>
              </span>
              <span className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                {item.description}
              </span>
            </span>
          </Link>
        );
      })}
    </section>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight">
        {new Intl.NumberFormat("zh-CN").format(value)}
      </p>
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  id,
}: {
  eyebrow: string;
  title: string;
  id: string;
}) {
  return (
    <div className="border-b border-border/50 pb-3">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
        {eyebrow}
      </p>
      <h2 id={id} className="mt-1 text-base font-medium">
        {title}
      </h2>
    </div>
  );
}

function TopicPanel({
  title,
  description,
  items,
  limit,
  icon,
}: {
  title: string;
  description: string;
  items: Array<CategorySummary | TagSummary>;
  limit: number;
  icon: "category" | "tag";
}) {
  const visibleItems = items
    .filter((item) => item.postCount > 0)
    .slice(0, limit);

  if (visibleItems.length === 0) return null;

  return (
    <section className="rounded-lg border bg-card">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-medium">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 p-3">
        {visibleItems.map((item) => {
          const isTag = icon === "tag";
          const href = isTag
            ? `/tag/${item.slug}`
            : categoryHref(item as CategorySummary);

          return (
            <Link
              key={item.id}
              href={href}
              className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <Badge
                variant="outline"
                className="h-8 gap-1.5 rounded-md px-2.5 text-xs font-normal"
              >
                {isTag ? (
                  <Hash className="h-3.5 w-3.5" suppressHydrationWarning />
                ) : (
                  <FolderOpen
                    className="h-3.5 w-3.5"
                    suppressHydrationWarning
                  />
                )}
                {item.name}
                <span className="text-[11px] opacity-70">{item.postCount}</span>
              </Badge>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
