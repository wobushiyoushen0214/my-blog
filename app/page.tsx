import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { Category, Comment, Post, PostTag, Tag } from "@/lib/types";

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

function attachTagsFromRows(
  posts: PostWithTaxonomy[],
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
    month: "2-digit",
    day: "2-digit",
  });
}

function formatLongDate(date: string) {
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value || 0);
}

function stripHtml(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-zA-Z0-9#]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function contentTypeLabel(post?: PostWithTaxonomy | null) {
  return post?.category?.type === "moment" ? "见闻" : "文章";
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
      .limit(8),
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

  const postTagRows = (postTags || []) as PostTag[];
  const tagRows = (tags || []) as Tag[];
  const tagCounts = postTagRows.reduce<Map<string, number>>(
    (counts, postTag) => {
      counts.set(postTag.tag_id, (counts.get(postTag.tag_id) || 0) + 1);
      return counts;
    },
    new Map()
  );
  const tagSummaries: TagSummary[] = tagRows
    .map((tag) => ({
      ...tag,
      postCount: tagCounts.get(tag.id) || 0,
    }))
    .filter((tag) => tag.postCount > 0)
    .sort((a, b) => b.postCount - a.postCount);

  const postsWithTags = attachTagsFromRows(
    (recentData || []) as unknown as PostWithTaxonomy[],
    postTagRows,
    tagRows
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
  const indexPosts = postsWithTags.slice(1, 4);
  const ledgerPosts = postsWithTags.slice(1, 8);
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
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-8 md:px-6 md:py-10">
        <HomeIndex
          featuredPost={featuredPost}
          indexPosts={indexPosts}
          articleCount={articleCount}
          momentCount={momentCount}
          totalCount={publishedRows?.length || 0}
          topicCount={usedCategoryCount + usedTagCount}
          totalViews={totalViews}
        />

        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <RecentLedger posts={ledgerPosts} />
          <SideArchive
            categories={categorySummaries}
            tags={tagSummaries}
            discussions={recentDiscussions}
          />
        </section>
      </main>
      <Footer />
    </div>
  );
}

function HomeIndex({
  featuredPost,
  indexPosts,
  articleCount,
  momentCount,
  totalCount,
  topicCount,
  totalViews,
}: {
  featuredPost: PostWithTaxonomy | null;
  indexPosts: PostWithTaxonomy[];
  articleCount: number;
  momentCount: number;
  totalCount: number;
  topicCount: number;
  totalViews: number;
}) {
  const stats = [
    { label: "文章", value: articleCount },
    { label: "见闻", value: momentCount },
    { label: "记录", value: totalCount },
    { label: "阅读", value: formatNumber(totalViews) },
  ];

  return (
    <section
      aria-labelledby="home-index-title"
      className="border-y border-border/80"
    >
      <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] lg:divide-x lg:divide-border/70">
        <div className="py-5 lg:pr-6">
          <div className="grid gap-4 md:grid-cols-[44px_minmax(0,1fr)_auto] md:items-start">
            <span className="font-mono text-xs text-muted-foreground">00</span>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Personal Archive
              </p>
              <h1
                id="home-index-title"
                className="mt-2 font-serif text-3xl leading-none md:text-4xl"
              >
                Lee / Notes
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
                技术笔记、项目复盘和日常见闻按时间、主题和讨论整理成可检索的个人档案。
              </p>
            </div>
            <Link
              href="/archive"
              className="inline-flex h-9 items-center justify-center border-y border-border/60 px-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              Archive
            </Link>
          </div>

          <HomeSearch />
          <FeaturedDispatch post={featuredPost} />
        </div>

        <aside className="border-t border-border/70 py-5 lg:border-t-0 lg:pl-6">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Ledger
          </p>
          <div className="mt-4 divide-y divide-border/70 border-y border-border/70">
            {stats.map((item, index) => (
              <div
                key={item.label}
                className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 py-3 text-sm"
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 truncate text-muted-foreground">
                  {item.label}
                </span>
                <span className="font-serif text-xl leading-none">
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 divide-y divide-border/70 border-y border-border/70">
            <InventoryRow
              href="/posts"
              code="P"
              title="文章"
              meta={`${articleCount} 篇长文`}
            />
            <InventoryRow
              href="/moments"
              code="M"
              title="见闻"
              meta={`${momentCount} 条短记录`}
            />
            <InventoryRow
              href="/archive"
              code="A"
              title="归档"
              meta={`${totalCount} 条记录`}
            />
            <InventoryRow
              href="/category"
              code="T"
              title="主题"
              meta={`${topicCount} 个入口`}
            />
          </div>
        </aside>
      </div>
      {indexPosts.length > 0 ? (
        <div className="grid divide-y divide-border/70 border-t border-border/70 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          {indexPosts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group grid gap-2 py-3 text-sm transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 lg:px-4 first:lg:pl-0 last:lg:pr-0"
            >
              <p className="text-xs text-muted-foreground">
                {formatShortDate(post.created_at)} / {contentTypeLabel(post)}
              </p>
              <h2 className="line-clamp-1 font-serif text-lg leading-snug transition-opacity group-hover:opacity-70">
                {post.title}
              </h2>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function HomeSearch() {
  return (
    <form
      action="/search"
      role="search"
      className="mt-5 grid gap-2 border-y border-border/70 py-3 sm:grid-cols-[minmax(0,1fr)_120px_96px]"
    >
      <div className="relative min-w-0">
        <label htmlFor="home-search" className="sr-only">
          搜索关键词
        </label>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          suppressHydrationWarning
        />
        <Input
          id="home-search"
          name="q"
          type="search"
          placeholder="搜索标题、正文、分类或标签..."
          className="h-10 rounded-none border-border/70 bg-background/70 pl-9 shadow-none"
        />
      </div>
      <label htmlFor="home-search-type" className="sr-only">
        搜索类型
      </label>
      <select
        id="home-search-type"
        name="type"
        defaultValue="all"
        className="h-10 rounded-none border border-border/70 bg-background/70 px-3 text-sm text-foreground outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <option value="all">全部</option>
        <option value="post">文章</option>
        <option value="moment">见闻</option>
      </select>
      <button
        type="submit"
        className="inline-flex h-10 items-center justify-center gap-2 border border-border/70 bg-foreground px-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
      >
        <Search className="h-4 w-4" suppressHydrationWarning />
        搜索
      </button>
    </form>
  );
}

function FeaturedDispatch({ post }: { post: PostWithTaxonomy | null }) {
  const href = post ? `/blog/${post.slug}` : "/posts";
  const excerpt = post
    ? stripHtml(post.excerpt || post.content || post.title)
    : "发布内容后，最新文章或见闻会显示在这里。";

  return (
    <Link
      href={href}
      className="group mt-5 grid gap-4 border-y border-border/70 py-4 transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 md:grid-cols-[112px_minmax(0,1fr)_auto]"
    >
      {post?.cover_image ? (
        <span className="relative block aspect-[4/3] overflow-hidden border border-border/70 bg-muted">
          <Image
            src={post.cover_image}
            alt={post.title}
            fill
            priority
            sizes="112px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </span>
      ) : (
        <span className="flex aspect-[4/3] items-end border border-border/70 bg-muted/20 p-2 text-xs text-muted-foreground">
          Latest
        </span>
      )}
      <span className="min-w-0">
        <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Selected Dispatch
        </span>
        <span className="mt-2 block font-serif text-xl leading-tight md:text-2xl">
          {post?.title || "暂无公开内容"}
        </span>
        <span className="mt-2 line-clamp-2 block text-sm leading-6 text-muted-foreground">
          {excerpt}
        </span>
      </span>
      <span className="text-xs text-muted-foreground md:text-right">
        {post
          ? `${formatShortDate(post.created_at)} / ${contentTypeLabel(post)}`
          : "00 / Empty"}
      </span>
    </Link>
  );
}

function InventoryRow({
  href,
  code,
  title,
  meta,
}: {
  href: string;
  code: string;
  title: string;
  meta: string;
}) {
  return (
    <Link
      href={href}
      className="grid grid-cols-[44px_minmax(0,1fr)] gap-4 py-3 text-sm transition-colors hover:bg-background/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 md:grid-cols-[44px_minmax(0,1fr)_180px]"
    >
      <span className="text-muted-foreground">{code}</span>
      <span className="min-w-0 truncate font-serif text-lg italic leading-none">
        {title}
      </span>
      <span className="hidden truncate text-right text-muted-foreground md:block">
        {meta}
      </span>
    </Link>
  );
}

function RecentLedger({ posts }: { posts: PostWithTaxonomy[] }) {
  return (
    <section className="border-y border-border/70 py-4">
      <div className="grid gap-3 sm:grid-cols-[44px_minmax(0,1fr)_auto] sm:items-end">
        <span className="font-mono text-xs text-muted-foreground">01</span>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Recent Ledger
          </p>
          <h2 className="mt-2 font-serif text-2xl leading-none md:text-3xl">
            最近入档
          </h2>
        </div>
        <Link
          href="/archive"
          className="inline-flex h-9 items-center border-y border-border/60 px-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          全部归档
        </Link>
      </div>

      {posts.length > 0 ? (
        <div className="mt-5 divide-y divide-border/70 border-y border-border/70">
          {posts.map((post, index) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group grid gap-3 py-5 transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 md:grid-cols-[76px_minmax(0,1fr)_132px]"
            >
              <span className="text-sm text-muted-foreground">
                {String(index + 1).padStart(2, "0")}.
                {formatShortDate(post.created_at)}
              </span>
              <span className="min-w-0">
                <span className="block font-serif text-lg leading-tight transition-opacity group-hover:opacity-70 md:text-xl">
                  {post.title}
                </span>
                <span className="mt-2 line-clamp-2 block text-sm leading-6 text-muted-foreground">
                  {stripHtml(post.excerpt || post.content)}
                </span>
              </span>
              <span className="text-sm text-muted-foreground md:text-right">
                {post.category?.name || contentTypeLabel(post)}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-8 grid gap-3 border-y border-border/70 py-5 text-sm sm:grid-cols-[3rem_minmax(0,1fr)]">
          <span className="text-xs tabular-nums text-muted-foreground">00</span>
          <span className="leading-7 text-muted-foreground">
            发布更多文章或见闻后，这里会形成一条最近更新目录。
          </span>
        </div>
      )}
    </section>
  );
}

function SideArchive({
  categories,
  tags,
  discussions,
}: {
  categories: CategorySummary[];
  tags: TagSummary[];
  discussions: RecentDiscussion[];
}) {
  return (
    <aside className="space-y-4">
      <TopicList
        code="CA"
        title="主题"
        items={categories}
        limit={8}
        hrefFor={(item) => categoryHref(item as CategorySummary)}
      />
      <TopicList
        code="TG"
        title="标签"
        items={tags}
        limit={12}
        hrefFor={(item) => `/tag/${item.slug}`}
      />
      <DiscussionList items={discussions} />
    </aside>
  );
}

function TopicList({
  code,
  title,
  items,
  limit,
  hrefFor,
}: {
  code: string;
  title: string;
  items: Array<CategorySummary | TagSummary>;
  limit: number;
  hrefFor: (item: CategorySummary | TagSummary) => string;
}) {
  const visibleItems = items
    .filter((item) => item.postCount > 0)
    .slice(0, limit);

  return (
    <section className="border-y border-border/70 py-4">
      <div className="grid grid-cols-[36px_minmax(0,1fr)] gap-3">
        <span className="font-mono text-xs text-muted-foreground">{code}</span>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </p>
      </div>
      {visibleItems.length > 0 ? (
        <div className="mt-4 divide-y divide-border/70 border-y border-border/70">
          {visibleItems.map((item, index) => (
            <Link
              key={item.id}
              href={hrefFor(item)}
              className="grid grid-cols-[36px_minmax(0,1fr)_42px] gap-3 py-3 text-sm transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <span className="text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 truncate font-serif text-lg leading-none">
                {item.name}
              </span>
              <span className="text-right text-muted-foreground">
                {item.postCount}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">暂无条目。</p>
      )}
    </section>
  );
}

function DiscussionList({ items }: { items: RecentDiscussion[] }) {
  return (
    <section className="border-y border-border/70 py-4">
      <div className="grid grid-cols-[36px_minmax(0,1fr)] gap-3">
        <span className="font-mono text-xs text-muted-foreground">CM</span>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          近期讨论
        </p>
      </div>
      {items.length > 0 ? (
        <div className="mt-4 divide-y divide-border/70 border-y border-border/70">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/blog/${item.postSlug}#comments`}
              className="block py-3 transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span className="truncate">{item.author_name}</span>
                <time dateTime={item.created_at}>
                  {formatLongDate(item.created_at)}
                </time>
              </div>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                {item.content}
              </p>
              <p className="mt-2 truncate font-serif text-base italic text-foreground">
                {item.postTitle}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          评论通过审核后，会展示在这里。
        </p>
      )}
    </section>
  );
}
