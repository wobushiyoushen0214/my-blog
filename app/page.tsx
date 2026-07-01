import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { Category, Post, PostTag, Tag } from "@/lib/types";

type PostWithTaxonomy = Post & {
  category?: Category | null;
  tags?: Tag[];
};
type CategorySummary = Category & { postCount: number };
type TagSummary = Tag & { postCount: number };

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

function formatShortDate(date: string) {
  return new Date(date).toLocaleDateString("zh-CN", {
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
  const ledgerPosts = postsWithTags;
  const usedCategoryCount = categorySummaries.filter(
    (category) => category.postCount > 0
  ).length;
  const usedTagCount = tagSummaries.length;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="mx-auto w-full max-w-[840px] flex-1 px-5 py-10 md:px-6 md:py-12">
        <HomeIndex
          articleCount={articleCount}
          momentCount={momentCount}
          totalCount={publishedRows?.length || 0}
          topicCount={usedCategoryCount + usedTagCount}
          totalViews={totalViews}
        />

        <section className="mt-12">
          <RecentLedger posts={ledgerPosts} />
          <TopicDirectory categories={categorySummaries} tags={tagSummaries} />
        </section>
      </main>
      <Footer />
    </div>
  );
}

function HomeIndex({
  articleCount,
  momentCount,
  totalCount,
  topicCount,
  totalViews,
}: {
  articleCount: number;
  momentCount: number;
  totalCount: number;
  topicCount: number;
  totalViews: number;
}) {
  return (
    <section aria-labelledby="home-index-title" className="border-b border-border/60 pb-8">
      <p className="text-sm text-muted-foreground">
        个人博客 · 技术、项目与日常观察
      </p>
      <h1
        id="home-index-title"
        className="mt-3 max-w-3xl text-3xl font-semibold leading-tight tracking-tight md:text-4xl"
      >
        Lee Notes
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base md:leading-7">
        这里记录工程实践、产品想法和生活见闻。内容按文章、见闻、主题与时间归档，便于回看，也便于搜索。
      </p>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        {articleCount} 篇文章 · {momentCount} 条见闻 · {totalCount} 份归档 ·{" "}
        {topicCount} 个主题 · {formatNumber(totalViews)} 次阅读
      </p>

      <HomeSearch />

      <nav
        aria-label="首页快捷入口"
        className="mt-4 flex flex-wrap gap-x-4 gap-y-2"
      >
        <HomeNavLink href="/posts" label="文章" />
        <HomeNavLink href="/moments" label="见闻" />
        <HomeNavLink href="/archive" label="归档" />
        <HomeNavLink href="/category" label="主题" />
      </nav>
    </section>
  );
}

function HomeSearch() {
  return (
    <form
      action="/search"
      role="search"
      className="mt-6 grid gap-2 sm:grid-cols-[minmax(0,1fr)_120px_88px]"
    >
      <div className="relative min-w-0">
        <label htmlFor="home-search" className="sr-only">
          搜索关键词
        </label>
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          suppressHydrationWarning
        />
        <Input
          id="home-search"
          name="q"
          type="search"
          placeholder="搜索标题、正文、分类或标签..."
          className="h-10 rounded-md border-border/70 bg-background pl-10 shadow-none hover:bg-muted/40 focus-visible:bg-background"
        />
      </div>
      <label htmlFor="home-search-type" className="sr-only">
        搜索类型
      </label>
      <select
        id="home-search-type"
        name="type"
        defaultValue="all"
        className="h-10 rounded-md border border-border/70 bg-background px-3 text-sm text-foreground outline-none transition-[background-color,color,box-shadow] hover:bg-muted/40 focus-visible:border-ring focus-visible:bg-background focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <option value="all">全部</option>
        <option value="post">文章</option>
        <option value="moment">见闻</option>
      </select>
      <button
        type="submit"
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
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
      className="inline-flex h-8 items-center text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      {label}
    </Link>
  );
}

function RecentLedger({ posts }: { posts: PostWithTaxonomy[] }) {
  return (
    <section>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            按时间
          </p>
          <h2 className="mt-1 text-xl font-semibold leading-tight tracking-tight">
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
        <div className="mt-5 border-y border-border/60">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group grid gap-3 border-b border-border/60 py-4 transition-colors last:border-b-0 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 md:grid-cols-[80px_minmax(0,1fr)_112px]"
            >
              <span className="text-sm tabular-nums text-muted-foreground">
                {formatShortDate(post.created_at)}
              </span>
              <span className="min-w-0">
                <span className="block text-base font-semibold leading-6 tracking-tight transition-colors group-hover:text-primary">
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

function TopicDirectory({
  categories,
  tags,
}: {
  categories: CategorySummary[];
  tags: TagSummary[];
}) {
  return (
    <section className="mt-10 grid gap-8 border-t border-border/60 pt-8 sm:grid-cols-2">
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
    </section>
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
        <div className="mt-4 flex flex-wrap gap-2">
          {visibleItems.map((item) => (
            <Link
              key={item.id}
              href={hrefFor(item)}
              className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <span className="max-w-32 truncate">
                {item.name}
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">
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
