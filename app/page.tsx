import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
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

function postTypeLabel(post?: PostWithTaxonomy | null) {
  return post?.category?.type === "moment" ? "见闻" : "文章";
}

function cleanText(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-zA-Z0-9#]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
  const inventoryPosts = postsWithTags.slice(1, 5);
  const morePosts = postsWithTags.slice(5);
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
    <div className="min-h-screen bg-[oklch(0.965_0.006_88)] text-[oklch(0.17_0.006_80)] dark:bg-background dark:text-foreground">
      <Header />
      <main className="mx-auto w-full max-w-[1840px] px-3 py-3 md:px-5 md:py-5">
        <EditorialHero
          featuredPost={featuredPost}
          inventoryPosts={inventoryPosts}
          articleCount={articleCount}
          momentCount={momentCount}
          totalCount={publishedRows?.length || 0}
          totalViews={totalViews}
          topicCount={usedCategoryCount + usedTagCount}
        />

        <section className="grid border-x border-b border-[oklch(0.78_0.008_84)] bg-[oklch(0.972_0.004_88)] dark:border-border dark:bg-card lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <EditorialIndex posts={morePosts} />
          <div className="border-t border-[oklch(0.78_0.008_84)] dark:border-border lg:border-l lg:border-t-0">
            <TopicArchive
              categories={categorySummaries}
              tags={tagSummaries}
              discussions={recentDiscussions}
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function EditorialHero({
  featuredPost,
  inventoryPosts,
  articleCount,
  momentCount,
  totalCount,
  totalViews,
  topicCount,
}: {
  featuredPost: PostWithTaxonomy | null;
  inventoryPosts: PostWithTaxonomy[];
  articleCount: number;
  momentCount: number;
  totalCount: number;
  totalViews: number;
  topicCount: number;
}) {
  const excerpt = featuredPost
    ? cleanText(featuredPost.excerpt || featuredPost.content || featuredPost.title)
    : "记录技术学习、项目复盘和日常见闻。这里把长期文章、短记录、分类索引和读者讨论整理成一份可以慢慢翻阅的个人档案。";

  return (
    <section className="grid min-h-[calc(100vh-6.5rem)] border border-[oklch(0.78_0.008_84)] bg-[oklch(0.972_0.004_88)] dark:border-border dark:bg-card lg:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)]">
      <div className="flex min-h-[720px] flex-col border-b border-[oklch(0.78_0.008_84)] p-5 dark:border-border md:p-8 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-4 text-xs uppercase text-[oklch(0.45_0.006_80)]">
          <Link
            href="/"
            className="font-serif text-xl tracking-[0.18em] text-[oklch(0.18_0.006_80)] transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:text-foreground"
          >
            The Archivist
          </Link>
          <span className="tracking-[0.18em]">Est. 2024</span>
        </div>

        <figure className="mt-8 flex min-h-0 flex-1 flex-col border border-[oklch(0.76_0.008_84)] bg-[oklch(0.94_0.004_88)] dark:border-border dark:bg-muted">
          <Link
            href={featuredPost ? `/blog/${featuredPost.slug}` : "/posts"}
            className="group relative block min-h-[460px] flex-1 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {featuredPost?.cover_image ? (
              <Image
                src={featuredPost.cover_image}
                alt={featuredPost.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 48vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              />
            ) : (
              <div className="flex h-full min-h-[520px] items-center justify-center p-8 text-center">
                <div>
                  <p className="font-serif text-5xl leading-none md:text-7xl">
                    Lee
                  </p>
                  <p className="mt-4 text-xs uppercase tracking-[0.28em] text-muted-foreground">
                    Notes / Projects / Field Records
                  </p>
                </div>
              </div>
            )}
          </Link>
          <figcaption className="grid grid-cols-[1fr_auto] border-t border-[oklch(0.76_0.008_84)] px-5 py-4 font-mono text-xs uppercase tracking-[0.16em] dark:border-border">
            <span className="min-w-0 truncate">
              Plate IV. - {featuredPost?.category?.name || "The Writer's Instrument"}
            </span>
            <span>{postTypeLabel(featuredPost)} / Lee</span>
          </figcaption>
        </figure>
      </div>

      <div className="flex min-h-[720px] flex-col p-5 md:p-8 lg:p-12">
        <div className="text-xs uppercase tracking-[0.28em] text-[oklch(0.48_0.006_80)]">
          Curated Notes - Series N° 04
        </div>

        <div className="mt-16 md:mt-20">
          <h1 className="font-serif text-5xl leading-none text-[oklch(0.14_0.006_80)] dark:text-foreground md:text-7xl xl:text-8xl">
            Where
            <span className="block italic">Code &</span>
            Notes Meet
          </h1>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-[minmax(0,1fr)_180px] md:items-start">
          <p className="max-w-xl text-sm leading-7 text-[oklch(0.25_0.006_80)] dark:text-muted-foreground md:text-base md:leading-8">
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-[oklch(0.18_0.006_80)] dark:text-foreground">
              Discover
            </span>{" "}
            {excerpt}
          </p>
          <div className="border-l border-[oklch(0.72_0.008_84)] pl-7 font-serif text-2xl italic leading-snug text-[oklch(0.42_0.006_80)] dark:border-border dark:text-muted-foreground">
            Forma,
            <br />
            Substantia.
          </div>
        </div>

        <form
          action="/search"
          role="search"
          className="mt-10 grid gap-3 border-y border-[oklch(0.78_0.008_84)] py-4 dark:border-border md:grid-cols-[minmax(0,1fr)_140px_120px]"
        >
          <label htmlFor="home-search" className="sr-only">
            搜索关键词
          </label>
          <input
            id="home-search"
            name="q"
            type="search"
            placeholder="Search the archive..."
            className="min-h-10 border-0 bg-transparent font-mono text-sm uppercase tracking-[0.12em] outline-none placeholder:text-[oklch(0.48_0.006_80)] focus-visible:ring-2 focus-visible:ring-ring/50"
          />
          <label htmlFor="home-search-type" className="sr-only">
            搜索类型
          </label>
          <select
            id="home-search-type"
            name="type"
            defaultValue="all"
            className="min-h-10 border-0 bg-transparent font-mono text-xs uppercase tracking-[0.12em] outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <option value="all">All</option>
            <option value="post">Posts</option>
            <option value="moment">Moments</option>
          </select>
          <button
            type="submit"
            className="min-h-10 border border-[oklch(0.26_0.006_80)] px-4 font-mono text-xs uppercase tracking-[0.16em] transition-colors hover:bg-[oklch(0.18_0.006_80)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:border-border"
          >
            Search
          </button>
        </form>

        <div className="mt-auto pt-10">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[oklch(0.48_0.006_80)]">
            The Inventory
          </p>
          <div className="mt-8 divide-y divide-[oklch(0.82_0.008_84)] border-y border-[oklch(0.82_0.008_84)] dark:divide-border dark:border-border">
            <InventoryRow href="/posts" code="04.01" title="Articles" meta={`${articleCount} records`} action="Index" />
            <InventoryRow href="/moments" code="04.02" title="Moments" meta={`${momentCount} field notes`} action="Browse" />
            <InventoryRow href="/archive" code="04.03" title="Chronology" meta={`${totalCount} total entries`} action="Archive" />
            <InventoryRow href="/category" code="04.04" title="Subjects" meta={`${topicCount} routes / ${formatNumber(totalViews)} reads`} action="Map" />
          </div>
          {inventoryPosts.length > 0 ? (
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {inventoryPosts.slice(0, 2).map((post, index) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group border border-[oklch(0.82_0.008_84)] p-4 transition-colors hover:bg-[oklch(0.94_0.005_88)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:border-border dark:hover:bg-muted/30"
                >
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    04.{String(index + 5).padStart(2, "0")} / {postTypeLabel(post)}
                  </p>
                  <h2 className="mt-3 line-clamp-2 font-serif text-xl leading-snug transition-opacity group-hover:opacity-70">
                    {post.title}
                  </h2>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function InventoryRow({
  href,
  code,
  title,
  meta,
  action,
}: {
  href: string;
  code: string;
  title: string;
  meta: string;
  action: string;
}) {
  return (
    <Link
      href={href}
      className="grid grid-cols-[64px_minmax(0,1fr)] gap-4 py-4 text-sm transition-colors hover:bg-[oklch(0.94_0.005_88)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:hover:bg-muted/30 md:grid-cols-[72px_minmax(0,1fr)_190px_84px]"
    >
      <span className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
        {code}
      </span>
      <span className="min-w-0 font-serif text-lg italic leading-none">
        {title}
      </span>
      <span className="hidden font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground md:block">
        {meta}
      </span>
      <span className="hidden text-right font-mono text-xs uppercase tracking-[0.12em] md:block">
        {action}
      </span>
    </Link>
  );
}

function EditorialIndex({ posts }: { posts: PostWithTaxonomy[] }) {
  return (
    <section className="p-5 md:p-8 lg:p-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
            Recent Ledger
          </p>
          <h2 className="mt-3 font-serif text-3xl leading-none md:text-5xl">
            Newly Filed
          </h2>
        </div>
        <Link
          href="/archive"
          className="font-mono text-xs uppercase tracking-[0.18em] transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          Full Archive
        </Link>
      </div>

      {posts.length > 0 ? (
        <div className="mt-10 divide-y divide-[oklch(0.82_0.008_84)] border-y border-[oklch(0.82_0.008_84)] dark:divide-border dark:border-border">
          {posts.map((post, index) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group grid gap-3 py-5 transition-colors hover:bg-[oklch(0.94_0.005_88)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:hover:bg-muted/30 md:grid-cols-[76px_minmax(0,1fr)_160px]"
            >
              <span className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
                {String(index + 1).padStart(2, "0")}.{formatShortDate(post.created_at)}
              </span>
              <span className="min-w-0">
                <span className="block font-serif text-2xl leading-tight transition-opacity group-hover:opacity-70">
                  {post.title}
                </span>
                <span className="mt-2 line-clamp-2 block text-sm leading-6 text-muted-foreground">
                  {post.excerpt ? cleanText(post.excerpt) : cleanText(post.content)}
                </span>
              </span>
              <span className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground md:text-right">
                {post.category?.name || postTypeLabel(post)}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-10 border border-dashed border-[oklch(0.76_0.008_84)] p-8 text-sm leading-7 text-muted-foreground dark:border-border">
          暂无更多归档。发布新的文章或见闻后，会按时间顺序陈列在这里。
        </div>
      )}
    </section>
  );
}

function TopicArchive({
  categories,
  tags,
  discussions,
}: {
  categories: CategorySummary[];
  tags: TagSummary[];
  discussions: RecentDiscussion[];
}) {
  return (
    <aside className="grid gap-0">
      <TopicList
        title="Subjects"
        description="按长期主题进入内容。"
        items={categories}
        limit={8}
        hrefFor={(item) => categoryHref(item as CategorySummary)}
      />
      <TopicList
        title="Marginalia"
        description="通过关键词横向浏览。"
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
  description,
  items,
  limit,
  hrefFor,
}: {
  title: string;
  description: string;
  items: Array<CategorySummary | TagSummary>;
  limit: number;
  hrefFor: (item: CategorySummary | TagSummary) => string;
}) {
  const visibleItems = items
    .filter((item) => item.postCount > 0)
    .slice(0, limit);

  return (
    <section className="border-b border-[oklch(0.78_0.008_84)] p-5 dark:border-border md:p-8">
      <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
        {title}
      </p>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
      {visibleItems.length > 0 ? (
        <div className="mt-7 divide-y divide-[oklch(0.84_0.008_84)] border-y border-[oklch(0.84_0.008_84)] dark:divide-border dark:border-border">
          {visibleItems.map((item, index) => (
            <Link
              key={item.id}
              href={hrefFor(item)}
              className="grid grid-cols-[42px_minmax(0,1fr)_48px] gap-3 py-3 text-sm transition-colors hover:bg-[oklch(0.94_0.005_88)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:hover:bg-muted/30"
            >
              <span className="font-mono text-xs text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 truncate font-serif text-lg leading-none">
                {item.name}
              </span>
              <span className="text-right font-mono text-xs text-muted-foreground">
                {item.postCount}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">暂无可浏览条目。</p>
      )}
    </section>
  );
}

function DiscussionList({ items }: { items: RecentDiscussion[] }) {
  return (
    <section className="p-5 md:p-8">
      <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
        Correspondence
      </p>
      {items.length > 0 ? (
        <div className="mt-7 space-y-5">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/blog/${item.postSlug}#comments`}
              className="block border-l border-[oklch(0.72_0.008_84)] pl-4 transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:border-border"
            >
              <div className="flex items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                <span className="truncate">{item.author_name}</span>
                <time dateTime={item.created_at}>{formatLongDate(item.created_at)}</time>
              </div>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-[oklch(0.28_0.006_80)] dark:text-muted-foreground">
                {item.content}
              </p>
              <p className="mt-2 truncate font-serif text-base italic">
                {item.postTitle}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-6 text-sm leading-6 text-muted-foreground">
          评论通过审核后，会作为读者来信陈列在这里。
        </p>
      )}
    </section>
  );
}
