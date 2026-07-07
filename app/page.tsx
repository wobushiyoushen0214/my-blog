import { createClient } from "@/lib/supabase/server";
import { ContentRow } from "@/components/content-row";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { DeviceShell } from "@/components/device-shell";
import { PixelStartMenu } from "@/components/pixel-start-menu";
import type { Category, Post, PostTag, Tag } from "@/lib/types";

type PostWithTaxonomy = Post & {
  category?: Category | null;
  tags?: Tag[];
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
  const { data: postTags } =
    publishedPostIds.length > 0
      ? await supabase
          .from("post_tags")
          .select("post_id, tag_id")
          .in("post_id", publishedPostIds)
      : { data: [] };

  const postTagRows = (postTags || []) as PostTag[];
  const tagRows = (tags || []) as Tag[];
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

  return (
    <DeviceShell>
      <div className="public-device-layout">
      <Header />
      <main className="mx-auto w-full max-w-[980px] flex-1 px-5 py-9 md:px-6 md:py-12">
        <PixelStartMenu
          articleCount={articleCount}
          momentCount={momentCount}
          totalCount={publishedRows?.length || 0}
          totalViews={totalViews}
        />

        <RecentLedger posts={ledgerPosts} />
      </main>
        <Footer />
      </div>
    </DeviceShell>
  );
}

function RecentLedger({ posts }: { posts: PostWithTaxonomy[] }) {
  return (
    <section className="mt-7" aria-label="最近内容">
      {posts.length > 0 ? (
        <div className="border-t border-border/80">
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
