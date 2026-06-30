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
      <main className="mx-auto w-full max-w-[1120px] flex-1 px-4 py-10 md:px-6 md:py-14">
        <HomeIndex
          featuredPost={featuredPost}
          indexPosts={indexPosts}
          articleCount={articleCount}
          momentCount={momentCount}
          totalCount={publishedRows?.length || 0}
          topicCount={usedCategoryCount + usedTagCount}
          totalViews={totalViews}
        />

        <section className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
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
    { label: "文章", value: `${articleCount} 篇` },
    { label: "见闻", value: `${momentCount} 条` },
    { label: "归档", value: `${totalCount} 份` },
    { label: "阅读", value: formatNumber(totalViews) },
  ];

  return (
    <section aria-labelledby="home-index-title" className="pt-4 md:pt-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">
            个人博客 / 技术、项目和日常观察
          </p>
          <h1
            id="home-index-title"
            className="mt-4 max-w-3xl font-serif text-4xl leading-[1.05] tracking-normal md:text-6xl"
          >
            Lee / Notes
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">
            这里记录工程实践、产品想法和生活见闻。内容按文章、见闻、主题和时间归档，方便回看，也方便搜索。
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {stats.map((item) => (
              <span
                key={item.label}
                className="inline-flex items-center gap-2 bg-muted/20 px-3 py-1.5 text-sm text-muted-foreground"
              >
                <span>{item.label}</span>
                <span className="font-medium text-foreground">{item.value}</span>
              </span>
            ))}
          </div>

          <HomeSearch />

          <nav
            aria-label="首页快捷入口"
            className="mt-4 flex flex-wrap gap-2"
          >
            <HomeNavLink href="/posts" label="读文章" />
            <HomeNavLink href="/moments" label="看见闻" />
            <HomeNavLink href="/archive" label="按时间浏览" />
            <HomeNavLink href="/category" label={`${topicCount} 个主题入口`} />
          </nav>
        </div>

        <FeaturedDispatch post={featuredPost} />
      </div>

      {indexPosts.length > 0 ? (
        <div className="mt-10 grid gap-3 md:grid-cols-3">
          {indexPosts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group -mx-3 grid gap-2 px-3 py-3 text-sm transition-colors hover:bg-muted/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
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
      className="mt-7 grid gap-2 sm:grid-cols-[minmax(0,1fr)_120px_96px]"
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
          className="h-11 rounded-md border-transparent bg-muted/20 pl-9 shadow-none hover:bg-muted/25 focus-visible:bg-background"
        />
      </div>
      <label htmlFor="home-search-type" className="sr-only">
        搜索类型
      </label>
      <select
        id="home-search-type"
        name="type"
        defaultValue="all"
        className="h-11 rounded-md border border-transparent bg-muted/20 px-3 text-sm text-foreground outline-none transition-[background-color,color,box-shadow] hover:bg-muted/25 focus-visible:border-ring focus-visible:bg-background focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <option value="all">全部</option>
        <option value="post">文章</option>
        <option value="moment">见闻</option>
      </select>
      <button
        type="submit"
        className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
      >
        <Search className="h-4 w-4" suppressHydrationWarning />
        搜索
      </button>
    </form>
  );
}

function HomeNavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex h-9 items-center bg-muted/16 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/24 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      {label}
    </Link>
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
      className="group grid gap-5 bg-card/55 p-5 transition-colors hover:bg-card/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      {post?.cover_image ? (
        <span className="relative block aspect-[16/10] overflow-hidden bg-muted">
          <Image
            src={post.cover_image}
            alt={post.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 380px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </span>
      ) : (
        <span className="flex aspect-[16/10] items-end bg-muted/20 p-4">
          <span className="text-sm text-muted-foreground">
            最新内容会显示在这里
          </span>
        </span>
      )}
      <span className="min-w-0">
        <span className="text-sm font-medium text-muted-foreground">最新发布</span>
        <span className="mt-3 block font-serif text-2xl leading-tight">
          {post?.title || "暂无公开内容"}
        </span>
        <span className="mt-3 line-clamp-3 block text-sm leading-7 text-muted-foreground">
          {excerpt}
        </span>
      </span>
      <span className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>继续阅读</span>
        {post
          ? <span>{formatShortDate(post.created_at)} / {contentTypeLabel(post)}</span>
          : <span>暂无内容</span>}
      </span>
    </Link>
  );
}

function RecentLedger({ posts }: { posts: PostWithTaxonomy[] }) {
  return (
    <section>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="min-w-0">
          <h2 className="font-serif text-3xl leading-none">
            最近入档
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            按发布时间整理的文章和见闻。
          </p>
        </div>
        <Link
          href="/archive"
          className="inline-flex h-9 items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          全部归档
        </Link>
      </div>

      {posts.length > 0 ? (
        <div className="mt-6 grid gap-4">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group -mx-3 grid gap-3 px-3 py-4 transition-colors hover:bg-muted/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 md:grid-cols-[88px_minmax(0,1fr)_120px]"
            >
              <span className="text-sm text-muted-foreground">
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
        <div className="mt-8 py-3 text-sm">
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
    <aside className="space-y-8 bg-muted/10 p-5">
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
    <section>
      <p className="text-sm font-medium text-foreground">
        {title}
      </p>
      {visibleItems.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {visibleItems.map((item) => (
            <Link
              key={item.id}
              href={hrefFor(item)}
              className="inline-flex items-center gap-2 bg-muted/20 px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <span className="max-w-32 truncate">
                {item.name}
              </span>
              <span className="text-xs text-muted-foreground">
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
    <section>
      <p className="text-sm font-medium text-foreground">
        近期讨论
      </p>
      {items.length > 0 ? (
        <div className="mt-4 grid gap-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/blog/${item.postSlug}#comments`}
              className="block py-1.5 transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
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
