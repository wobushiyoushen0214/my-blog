import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ContentRow } from "@/components/content-row";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
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
        <HomeSummary
          articleCount={articleCount}
          momentCount={momentCount}
          totalCount={publishedRows?.length || 0}
          topicCount={usedCategoryCount + usedTagCount}
          totalViews={totalViews}
        />

        <section className="mt-8">
          <RecentLedger posts={ledgerPosts} />
          <TopicDirectory categories={categorySummaries} tags={tagSummaries} />
        </section>
      </main>
      <Footer />
    </div>
  );
}

function HomeSummary({
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
    <section aria-labelledby="home-summary-title" className="border-b border-border/60 pb-6">
      <p className="text-sm text-muted-foreground">
        Lee Notes
      </p>
      <h1
        id="home-summary-title"
        className="mt-2 max-w-3xl text-2xl font-semibold leading-tight tracking-tight md:text-3xl"
      >
        最近入档
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        技术笔记、项目复盘和日常观察。全站入口放在顶部导航，这里只保留最近更新和主题索引。
      </p>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {articleCount} 篇文章 · {momentCount} 条见闻 · {totalCount} 份归档 ·{" "}
        {topicCount} 个主题 · {formatNumber(totalViews)} 次阅读
      </p>
    </section>
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
            <ContentRow
              key={post.id}
              post={post}
              dateLabel={formatShortDate(post.created_at)}
              typeLabel={contentTypeLabel(post)}
              rightMeta={[`${formatNumber(post.view_count)} 阅读`]}
              className="sm:grid-cols-[4.5rem_minmax(0,1fr)_6.5rem]"
            />
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
