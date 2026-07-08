import { createClient } from "@/lib/supabase/server";
import { ContentRow } from "@/components/content-row";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import Link from "next/link";
import {
  Archive,
  Link as LinkIcon,
  Layers,
  Pin,
  Rss,
} from "lucide-react";
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
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value || 0);
}

function contentTypeLabel(post?: PostWithTaxonomy | null) {
  return post?.category?.type === "moment" ? "见闻" : "文章";
}

function estimateReadingMinutes(post: Pick<PostWithTaxonomy, "title" | "content" | "excerpt">) {
  const text = (post.content || post.excerpt || post.title)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const cjkCount = text.match(/[\u4e00-\u9fff]/g)?.length || 0;
  const latinWordCount =
    text
      .replace(/[\u4e00-\u9fff]/g, " ")
      .match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g)?.length || 0;

  return Math.max(1, Math.ceil(cjkCount / 450 + latinWordCount / 220));
}

function stripHtml(value?: string | null) {
  return (value || "")
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
  const featuredPost = ledgerPosts[0] || null;
  const regularPosts = ledgerPosts.slice(1);
  const visibleCategories = ((categories || []) as Category[])
    .filter((category) => category.type !== "moment")
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-slate-800 transition-colors duration-300 dark:bg-[#0a0a0a] dark:text-neutral-200">
      <Header />
      <main className="min-h-[calc(100vh-5rem)]">
        <div className="narrative-catalog mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            <section
              className="space-y-10 lg:col-span-3"
              aria-label="Garden catalog"
            >
              <CategoryFilterStrip
                categories={visibleCategories}
                totalCount={publishedRows?.length || 0}
              />

              {featuredPost ? (
                <div className="space-y-12">
                  <FeaturedEssay post={featuredPost} />
                  <RecentLedger posts={regularPosts} />
                </div>
              ) : (
                <div className="py-16 text-center">
                  <p className="font-serif text-base font-light italic text-slate-950 dark:text-white">
                    Garden is empty
                  </p>
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    发布内容后，这里会展示最新的 garden notes。
                  </p>
                </div>
              )}
            </section>

            <aside className="lg:col-span-1" aria-label="Garden profile">
              <div className="sticky top-24 space-y-6">
                <AuthorProfile />
                <GardenStatus
                  articleCount={articleCount}
                  momentCount={momentCount}
                  totalCount={publishedRows?.length || 0}
                  totalViews={totalViews}
                />
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function RecentLedger({ posts }: { posts: PostWithTaxonomy[] }) {
  return (
    <section className="space-y-4" aria-label="Recent garden notes">
      {posts.length > 0 ? (
        <>
          <div className="font-sans text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            <span>Recent Garden Notes</span>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {posts.map((post) => (
            <ContentRow
              key={post.id}
              post={post}
              dateLabel={formatShortDate(post.created_at)}
              typeLabel={contentTypeLabel(post)}
              rightMeta={[`${formatNumber(post.view_count)} 阅读`]}
            />
          ))}
          </div>
        </>
      ) : (
        <div className="py-10 text-center">
          <span className="text-xs leading-6 text-neutral-500 dark:text-neutral-400">
            继续发布后，这里会形成最近的 garden notes。
          </span>
        </div>
      )}
    </section>
  );
}

function CategoryFilterStrip({
  categories,
  totalCount,
}: {
  categories: Category[];
  totalCount: number;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-50 pb-5 dark:border-zinc-800/40 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        <Link className="narrative-pill narrative-pill-active" href="/posts">
          All Seeds
        </Link>
        {categories.map((category) => (
          <Link
            key={category.id}
            className="narrative-pill"
            href={`/posts?category=${encodeURIComponent(category.slug)}`}
          >
            {category.name}
          </Link>
        ))}
      </div>
      <span className="font-mono text-[10px] uppercase text-slate-400 dark:text-zinc-500">
        Showing {totalCount} logs
      </span>
    </div>
  );
}

function FeaturedEssay({ post }: { post: PostWithTaxonomy }) {
  const coverImage = post.cover_image?.trim();

  return (
    <section className="space-y-4" aria-label="Featured essay">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400 dark:text-neutral-500">
        <Pin className="h-3.5 w-3.5 rotate-45 text-neutral-400" suppressHydrationWarning />
        <span>Featured Essay</span>
      </div>

      <Link
        href={`/blog/${post.slug}`}
        className="group relative flex cursor-pointer flex-col overflow-hidden rounded-md border border-neutral-200 bg-white transition-all hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900/10 dark:hover:border-neutral-700 md:flex-row"
      >
        <div
          className="narrative-media-slot relative aspect-[16/10] overflow-hidden bg-neutral-100 dark:bg-neutral-900 md:w-2/5 md:aspect-auto"
          style={
            coverImage
              ? { backgroundImage: `url("${coverImage.replace(/"/g, '\\"')}")` }
              : undefined
          }
          aria-label={coverImage ? post.title : undefined}
        >
          {coverImage ? (
            <span className="absolute inset-0 bg-neutral-950/10 transition-colors duration-500 group-hover:bg-transparent" />
          ) : (
            <span className="absolute inset-0 flex flex-col justify-between p-5">
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-neutral-400">
                leempty
              </span>
              <span className="max-w-[11rem] font-serif text-2xl italic leading-tight text-neutral-500 dark:text-neutral-400">
                {contentTypeLabel(post)}
              </span>
            </span>
          )}
        </div>
        <div className="flex flex-col justify-between p-8 md:w-3/5">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="bg-neutral-100 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">
                {contentTypeLabel(post)}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                {estimateReadingMinutes(post)} min read
              </span>
            </div>
            <h2 className="font-serif text-3xl font-light italic leading-[1.2] text-slate-950 transition-colors dark:text-white">
              {post.title}
            </h2>
            {post.excerpt ? (
              <p className="line-clamp-3 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                {stripHtml(post.excerpt)}
              </p>
            ) : null}
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-neutral-100 pt-6 dark:border-neutral-800/40">
            <div className="flex min-w-0 flex-wrap gap-2">
              {(post.tags || []).slice(0, 4).map((tag) => (
                <span
                  key={tag.id}
                  className="font-mono text-[10px] text-neutral-400 dark:text-neutral-500"
                >
                  #{tag.name.toLowerCase()}
                </span>
              ))}
            </div>
            <span className="flex shrink-0 items-center gap-4 text-slate-950 dark:text-white">
              <span className="text-[10px] font-semibold uppercase tracking-[0.25em]">
                Read Essay
              </span>
              <span className="h-px w-10 bg-neutral-400 transition-all duration-300 group-hover:w-16 dark:bg-neutral-600" />
            </span>
          </div>
        </div>
      </Link>
    </section>
  );
}

function AuthorProfile() {
  return (
    <section className="rounded-md border border-neutral-200 bg-white p-6 text-center dark:border-neutral-800 dark:bg-neutral-900/10">
      <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
        <span className="font-serif text-xl font-semibold italic text-slate-950 dark:text-white">
          Lee
        </span>
      </div>

      <h2 className="font-serif text-base font-light text-slate-950 dark:text-white">
        Lee
      </h2>
      <span className="mt-1 block font-sans text-[8px] font-bold uppercase tracking-[0.25em] text-neutral-400 dark:text-neutral-500">
        Developer & Writer
      </span>

      <p className="mt-4 px-2 text-center font-serif text-xs italic leading-relaxed text-neutral-500 dark:text-neutral-400">
        &quot;Cultivating notes across engineering practice, project retrospectives,
        and small observations.&quot;
      </p>

      <div className="mt-5 flex items-center justify-center gap-4 text-neutral-400 dark:text-neutral-500">
        <Link href="/links" className="transition-colors hover:text-slate-900 dark:hover:text-white" title="Links">
          <LinkIcon className="h-4 w-4" suppressHydrationWarning />
        </Link>
        <Link href="/archive" className="transition-colors hover:text-slate-900 dark:hover:text-white" title="Archive">
          <Archive className="h-4 w-4" suppressHydrationWarning />
        </Link>
        <Link href="/rss.xml" className="transition-colors hover:text-slate-900 dark:hover:text-white" title="RSS dispatch">
          <Rss className="h-4 w-4" suppressHydrationWarning />
        </Link>
      </div>
    </section>
  );
}

function GardenStatus({
  articleCount,
  momentCount,
  totalCount,
  totalViews,
}: {
  articleCount: number;
  momentCount: number;
  totalCount: number;
  totalViews: number;
}) {
  return (
    <section className="rounded-md border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900/10">
      <h2 className="mb-4 flex items-center gap-2 border-b border-neutral-100 pb-2.5 font-sans text-[9px] font-bold uppercase tracking-[0.25em] text-neutral-400 dark:border-neutral-800 dark:text-neutral-500">
        <Layers className="h-3.5 w-3.5" suppressHydrationWarning />
        <span>Garden Status</span>
      </h2>
      <ul className="space-y-3 text-xs text-neutral-500 dark:text-neutral-400">
        <li className="flex items-center justify-between">
          <span>Total Active Seeds</span>
          <span className="font-serif font-bold italic text-slate-950 dark:text-white">
            {totalCount}
          </span>
        </li>
        <li className="flex items-center justify-between">
          <span>Essays</span>
          <span className="font-serif font-bold italic text-slate-950 dark:text-white">
            {articleCount}
          </span>
        </li>
        <li className="flex items-center justify-between">
          <span>Field Logs</span>
          <span className="font-serif font-bold italic text-slate-950 dark:text-white">
            {momentCount}
          </span>
        </li>
        <li className="flex items-center justify-between">
          <span>Total Views</span>
          <span className="font-mono text-[10px] text-neutral-400">
            {formatNumber(totalViews)}
          </span>
        </li>
      </ul>
    </section>
  );
}
