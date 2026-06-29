import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
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
        <div className="overflow-hidden border border-border/80 bg-card text-card-foreground">
          <section
            aria-labelledby="home-hero-title"
            className="grid lg:min-h-[640px] lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]"
          >
            <FeaturePlate post={featuredPost} />
            <HeroPanel
              featuredPost={featuredPost}
              indexPosts={indexPosts}
              articleCount={articleCount}
              momentCount={momentCount}
              totalCount={publishedRows?.length || 0}
              topicCount={usedCategoryCount + usedTagCount}
              totalViews={totalViews}
            />
          </section>
        </div>

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

function FeaturePlate({ post }: { post: PostWithTaxonomy | null }) {
  return (
    <div className="flex min-h-[500px] flex-col border-b border-border/70 bg-card p-4 md:p-6 lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between gap-4 text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <Link
          href="/"
          className="font-serif text-base text-foreground transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          Lee / Notes
        </Link>
        <span>Personal Journal</span>
      </div>

      <figure className="mt-6 flex min-h-0 flex-1 flex-col border border-border/70 bg-background">
        <Link
          href={post ? `/blog/${post.slug}` : "/posts"}
          className="group relative block min-h-[360px] flex-1 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          {post?.cover_image ? (
            <Image
              src={post.cover_image}
              alt={post.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 48vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full min-h-[380px] items-center justify-center px-8 text-center">
              <div className="max-w-sm">
                <p className="font-serif text-5xl leading-none md:text-6xl">
                  Lee Notes
                </p>
                <p className="mt-5 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Code / Work / Life
                </p>
              </div>
            </div>
          )}
        </Link>
        <figcaption className="grid gap-2 border-t border-border/70 px-4 py-3 text-xs text-muted-foreground sm:grid-cols-[1fr_auto]">
          <span className="min-w-0 truncate">
            封面记录 / {post?.category?.name || "未分类手记"}
          </span>
          <span className="sm:text-right">{contentTypeLabel(post)} / Lee</span>
        </figcaption>
      </figure>
    </div>
  );
}

function HeroPanel({
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
  const excerpt = featuredPost
    ? stripHtml(featuredPost.excerpt || featuredPost.content || featuredPost.title)
    : "记录技术学习、项目复盘和日常见闻。这里把文章、短记录、分类索引和读者讨论整理成一份可以慢慢翻阅的个人档案。";

  return (
    <div className="flex min-h-[500px] flex-col p-5 md:p-8 lg:p-10">
      <div className="flex flex-col gap-3 text-xs uppercase tracking-[0.18em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>Selected Dispatch / 最新手记</p>
        <p>{formatNumber(totalViews)} Reads</p>
      </div>

      <div className="mt-12 md:mt-16">
        <h1
          id="home-hero-title"
          className="max-w-3xl font-serif text-5xl leading-[0.95] text-foreground md:text-7xl"
        >
          想法、代码
          <span className="block italic">与纸页相遇</span>
        </h1>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-[minmax(0,1fr)_180px]">
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
          <span className="font-medium text-foreground">DISCOVER / </span>
          {excerpt}
        </p>
        <p className="border-l border-border/70 pl-5 font-serif text-xl italic leading-snug text-muted-foreground">
          把值得复盘的
          <br />
          留在纸面上。
        </p>
      </div>

      <form
        action="/search"
        role="search"
        className="mt-9 grid gap-2 border-y border-border/70 py-4 sm:grid-cols-[minmax(0,1fr)_120px_104px]"
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
            className="h-10 border-border/70 bg-background/70 pl-9"
          />
        </div>
        <label htmlFor="home-search-type" className="sr-only">
          搜索类型
        </label>
        <select
          id="home-search-type"
          name="type"
          defaultValue="all"
          className="h-10 rounded-md border border-border/70 bg-background/70 px-3 text-sm text-foreground outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <option value="all">全部</option>
          <option value="post">文章</option>
          <option value="moment">见闻</option>
        </select>
        <Button
          type="submit"
          className="h-10"
        >
          <Search className="h-4 w-4" suppressHydrationWarning />
          搜索
        </Button>
      </form>

      <div className="mt-auto pt-10">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Inventory
        </p>
        <div className="mt-5 divide-y divide-border/70 border-y border-border/70">
          <InventoryRow
            href="/posts"
            code="01"
            title="文章"
            meta={`${articleCount} 篇长文`}
          />
          <InventoryRow
            href="/moments"
            code="02"
            title="见闻"
            meta={`${momentCount} 条短记录`}
          />
          <InventoryRow
            href="/archive"
            code="03"
            title="归档"
            meta={`${totalCount} 条记录`}
          />
          <InventoryRow
            href="/category"
            code="04"
            title="主题"
            meta={`${topicCount} 个入口`}
          />
        </div>

        {indexPosts.length > 0 ? (
          <div className="mt-6 grid gap-0 divide-y divide-border/70 border-y border-border/70">
            {indexPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group grid gap-2 py-3 text-sm transition-colors hover:bg-background/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:grid-cols-[88px_minmax(0,1fr)]"
              >
                <p className="text-xs text-muted-foreground">
                  {formatShortDate(post.created_at)}
                </p>
                <h2 className="line-clamp-1 font-serif text-lg leading-snug transition-opacity group-hover:opacity-70">
                  {post.title}
                </h2>
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </div>
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
    <section className="border border-border/70 bg-card p-5 md:p-7">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Recent Ledger
          </p>
          <h2 className="mt-2 font-serif text-3xl leading-none md:text-4xl">
            最近入档
          </h2>
        </div>
        <Link
          href="/archive"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          全部归档
        </Link>
      </div>

      {posts.length > 0 ? (
        <div className="mt-7 divide-y divide-border/70 border-y border-border/70">
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
                <span className="block font-serif text-xl leading-tight transition-opacity group-hover:opacity-70 md:text-2xl">
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
        <div className="mt-8 border border-dashed p-8 text-sm leading-7 text-muted-foreground">
          发布更多文章或见闻后，这里会形成一条最近更新目录。
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
    <aside className="border border-border/70 bg-card">
      <TopicList
        title="主题"
        items={categories}
        limit={8}
        hrefFor={(item) => categoryHref(item as CategorySummary)}
      />
      <TopicList
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
  title,
  items,
  limit,
  hrefFor,
}: {
  title: string;
  items: Array<CategorySummary | TagSummary>;
  limit: number;
  hrefFor: (item: CategorySummary | TagSummary) => string;
}) {
  const visibleItems = items
    .filter((item) => item.postCount > 0)
    .slice(0, limit);

  return (
    <section className="border-b border-border/70 p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </p>
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
    <section className="p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
        近期讨论
      </p>
      {items.length > 0 ? (
        <div className="mt-5 space-y-5">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/blog/${item.postSlug}#comments`}
              className="block border-l pl-4 transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
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
