import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CommentForm } from "@/components/comment-form";
import { CommentList } from "@/components/comment-list";
import { ReaderProgress } from "@/components/reader-progress";
import { ReaderToolbar } from "@/components/reader-toolbar";
import { cn } from "@/lib/utils";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  CornerDownRight,
  MessageSquare,
  Share2,
  Tag,
} from "lucide-react";
import type { Metadata } from "next";
import type {
  Category,
  Comment as CommentType,
  Post,
  PostTag,
  Tag as TagType,
} from "@/lib/types";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

type PostWithCategory = Post & {
  category?: Category | null;
};

type CategoryMeta = Pick<Category, "name" | "slug" | "type">;

type RelatedPost = Post & {
  category?: CategoryMeta | null;
  tags?: TagType[];
  relationLabel?: string;
  relationRank?: number;
};

type NavigationPost = Pick<Post, "id" | "title" | "slug" | "created_at"> & {
  category?: CategoryMeta | null;
};

type CurrentPostTagRow = Pick<PostTag, "tag_id">;

type TocItem = {
  id: string;
  text: string;
  level: 2 | 3;
};

type ContentType = "post" | "moment";

const numberFormatter = new Intl.NumberFormat("zh-CN");

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function getContentType(category?: Pick<Category, "type"> | null): ContentType {
  return category?.type === "moment" ? "moment" : "post";
}

function getContentTypeLabel(type: ContentType) {
  return type === "moment" ? "见闻" : "文章";
}

function getContentListHref(type: ContentType) {
  return type === "moment" ? "/moments" : "/posts";
}

function getCategoryBrowseHref(
  category?: Pick<Category, "slug" | "type"> | null
) {
  if (!category) return "/posts";
  return category.type === "moment"
    ? `/moments?category=${encodeURIComponent(category.slug)}`
    : `/posts?category=${encodeURIComponent(category.slug)}`;
}

function estimateReadingMinutes(html: string) {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const chineseChars = text.match(/[\u4e00-\u9fff]/g)?.length ?? 0;
  const latinWords = text
    .replace(/[\u4e00-\u9fff]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  const minutes = Math.ceil((chineseChars + latinWords * 2) / 500);
  return Math.max(1, minutes);
}

function decodeHtmlEntities(value: string) {
  const namedEntities: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: "\"",
    apos: "'",
    nbsp: " ",
  };

  return value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (match, entity) => {
    const key = entity.toLowerCase();
    if (key.startsWith("#x")) {
      const code = Number.parseInt(key.slice(2), 16);
      return Number.isNaN(code) ? match : String.fromCodePoint(code);
    }
    if (key.startsWith("#")) {
      const code = Number.parseInt(key.slice(1), 10);
      return Number.isNaN(code) ? match : String.fromCodePoint(code);
    }
    return namedEntities[key] ?? match;
  });
}

function headingTextFromHtml(html: string) {
  return decodeHtmlEntities(html.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function slugifyHeading(text: string, index: number) {
  const slug = text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  return slug.length > 0 ? slug : `section-${index + 1}`;
}

function buildArticleContent(html: string) {
  const headings: TocItem[] = [];
  const usedIds = new Map<string, number>();

  const content = html.replace(
    /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (match, levelText: string, attrs: string, innerHtml: string) => {
      const text = headingTextFromHtml(innerHtml);
      if (!text) return match;

      const baseId = slugifyHeading(text, headings.length);
      const nextIndex = usedIds.get(baseId) ?? 0;
      usedIds.set(baseId, nextIndex + 1);
      const id = nextIndex === 0 ? baseId : `${baseId}-${nextIndex + 1}`;
      const level = Number(levelText) as 2 | 3;
      const attrsWithoutId = attrs.replace(/\s+id=(["']).*?\1/i, "");

      headings.push({ id, text, level });
      return `<h${level}${attrsWithoutId} id="${id}">${innerHtml}</h${level}>`;
    }
  );

  return { content, headings };
}

function attachTagsFromRows(
  posts: RelatedPost[],
  postTags: PostTag[],
  tags: TagType[]
) {
  if (posts.length === 0) return [];

  const postIds = new Set(posts.map((post) => post.id));
  const tagById = new Map(tags.map((tag) => [tag.id, tag]));
  const tagsByPostId = new Map<string, TagType[]>();

  postTags.forEach((postTag) => {
    if (!postIds.has(postTag.post_id)) return;

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
    tags: tagsByPostId.get(post.id) ?? [],
  }));
}

function buildRelatedCandidates({
  tagRelatedPosts,
  categoryRelatedPosts,
  sharedTagCounts,
  currentCategoryId,
}: {
  tagRelatedPosts: RelatedPost[];
  categoryRelatedPosts: RelatedPost[];
  sharedTagCounts: Map<string, number>;
  currentCategoryId: string | null;
}) {
  const byId = new Map<string, RelatedPost>();

  const addPost = (post: RelatedPost) => {
    const sharedTagCount = sharedTagCounts.get(post.id) ?? 0;
    const sameCategory = Boolean(
      currentCategoryId && post.category_id === currentCategoryId
    );
    const relationRank = sharedTagCount * 10 + (sameCategory ? 2 : 0);
    const relationLabel =
      sharedTagCount > 0
        ? sameCategory
          ? sharedTagCount > 1
            ? `${sharedTagCount} 个共同标签 · 同分类`
            : "同标签 · 同分类"
          : sharedTagCount > 1
            ? `${sharedTagCount} 个共同标签`
            : "同标签"
        : sameCategory
          ? "同分类"
          : "同类型";
    const existing = byId.get(post.id);

    if (existing && (existing.relationRank ?? 0) >= relationRank) return;
    byId.set(post.id, {
      ...post,
      relationLabel,
      relationRank,
    });
  };

  tagRelatedPosts.forEach(addPost);
  categoryRelatedPosts.forEach(addPost);

  return Array.from(byId.values())
    .sort((a, b) => {
      const rankDelta = (b.relationRank ?? 0) - (a.relationRank ?? 0);
      if (rankDelta !== 0) return rankDelta;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .slice(0, 4);
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("posts")
    .select("title, excerpt")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!post) return { title: "文章未找到" };

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const supabase = await createClient();

  const { data: postData } = await supabase
    .from("posts")
    .select("*, category:categories(*)")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!postData) notFound();

  const post = postData as PostWithCategory;

  const { content: articleContent, headings } = buildArticleContent(post.content);
  const readingMinutes = estimateReadingMinutes(post.content);
  const contentType = getContentType(post.category);
  const contentTypeLabel = getContentTypeLabel(contentType);
  const contentListHref = getContentListHref(contentType);

  const [
    { data: postTags },
    { data: comments },
    { data: siblingCategories },
  ] = await Promise.all([
    supabase.from("post_tags").select("tag_id").eq("post_id", post.id),
    supabase
      .from("comments")
      .select("*")
      .eq("post_id", post.id)
      .eq("approved", true)
      .order("created_at", { ascending: true }),
    supabase.from("categories").select("id").eq("type", contentType),
    supabase
      .from("posts")
      .update({ view_count: post.view_count + 1 })
      .eq("id", post.id),
  ]);

  const postTagRows = postTags as CurrentPostTagRow[];
  const commentRows = comments as CommentType[];
  const siblingCategoryRows = siblingCategories as Pick<Category, "id">[];

  const currentTagIds = postTagRows.map((pt) => pt.tag_id);
  const commentCount = commentRows.length;
  const siblingCategoryIds = siblingCategoryRows.map((category) => category.id);

  let relatedPostTagRows: PostTag[] = [];
  if (currentTagIds.length > 0) {
    const { data } = await supabase
      .from("post_tags")
      .select("post_id, tag_id")
      .in("tag_id", currentTagIds)
      .neq("post_id", post.id);
    relatedPostTagRows = data as PostTag[];
  }

  const sharedTagCounts = relatedPostTagRows.reduce<Map<string, number>>(
    (counts, postTag) => {
      counts.set(postTag.post_id, (counts.get(postTag.post_id) ?? 0) + 1);
      return counts;
    },
    new Map()
  );
  const tagRelatedPostIds = Array.from(sharedTagCounts.keys());

  let tagRelatedPostsData: RelatedPost[] = [];
  if (tagRelatedPostIds.length > 0) {
    let query = supabase
      .from("posts")
      .select("*, category:categories(name,slug,type)")
      .eq("published", true)
      .in("id", tagRelatedPostIds)
      .order("created_at", { ascending: false })
      .limit(12);

    if (siblingCategoryIds.length > 0) {
      query = query.in("category_id", siblingCategoryIds);
    }

    const { data } = await query;
    tagRelatedPostsData = data as unknown as RelatedPost[];
  }

  let categoryRelatedQuery = supabase
    .from("posts")
    .select("*, category:categories(name,slug,type)")
    .eq("published", true)
    .neq("id", post.id)
    .order("created_at", { ascending: false })
    .limit(8);

  if (post.category_id) {
    categoryRelatedQuery = categoryRelatedQuery.eq("category_id", post.category_id);
  } else if (siblingCategoryIds.length > 0) {
    categoryRelatedQuery = categoryRelatedQuery.in("category_id", siblingCategoryIds);
  }

  let previousPostQuery = supabase
    .from("posts")
    .select("id,title,slug,created_at, category:categories(name,slug,type)")
    .eq("published", true)
    .lt("created_at", post.created_at)
    .order("created_at", { ascending: false })
    .limit(1);

  let nextPostQuery = supabase
    .from("posts")
    .select("id,title,slug,created_at, category:categories(name,slug,type)")
    .eq("published", true)
    .gt("created_at", post.created_at)
    .order("created_at", { ascending: true })
    .limit(1);

  if (siblingCategoryIds.length > 0) {
    previousPostQuery = previousPostQuery.in("category_id", siblingCategoryIds);
    nextPostQuery = nextPostQuery.in("category_id", siblingCategoryIds);
  }

  const [
    { data: categoryRelatedPostsData },
    { data: previousPostData },
    { data: nextPostData },
  ] = await Promise.all([
    categoryRelatedQuery,
    previousPostQuery.maybeSingle(),
    nextPostQuery.maybeSingle(),
  ]);
  const categoryRelatedPosts = categoryRelatedPostsData as unknown as RelatedPost[];
  const relatedCandidates = buildRelatedCandidates({
    tagRelatedPosts: tagRelatedPostsData,
    categoryRelatedPosts,
    sharedTagCounts,
    currentCategoryId: post.category_id,
  });
  const relatedCandidateIds = relatedCandidates.map((candidate) => candidate.id);
  let candidatePostTagRows: PostTag[] = [];
  if (relatedCandidateIds.length > 0) {
    const { data } = await supabase
      .from("post_tags")
      .select("post_id, tag_id")
      .in("post_id", relatedCandidateIds);
    candidatePostTagRows = data as PostTag[];
  }
  const usedTagIds = Array.from(
    new Set([
      ...currentTagIds,
      ...candidatePostTagRows.map((postTag) => postTag.tag_id),
    ])
  );
  let usedTags: TagType[] = [];
  if (usedTagIds.length > 0) {
    const { data } = await supabase.from("tags").select("*").in("id", usedTagIds);
    usedTags = data as TagType[];
  }
  const tagById = new Map(usedTags.map((tag) => [tag.id, tag]));
  const tags = currentTagIds
    .map((tagId) => tagById.get(tagId))
    .filter((tag): tag is TagType => Boolean(tag));
  const relatedPosts = attachTagsFromRows(
    relatedCandidates,
    candidatePostTagRows,
    usedTags
  );
  const previousPost = previousPostData as unknown as NavigationPost | null;
  const nextPost = nextPostData as unknown as NavigationPost | null;

  return (
    <div className="min-h-screen bg-background font-sans text-foreground transition-colors duration-300">
      <Header />
      <ReaderProgress />

      <main className="relative min-h-[calc(100vh-5rem)] pb-20">
        <div className="mx-auto max-w-[92rem] px-4 pt-10 sm:px-6 lg:px-8">
          <ReaderToolbar backHref={contentListHref} />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[6.5rem_minmax(0,52rem)_18rem] lg:justify-center xl:grid-cols-[7.5rem_minmax(0,54rem)_18.5rem]">
            <aside className="hidden lg:block" aria-label="Reader actions">
              <div className="sticky top-28 flex flex-col items-start gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both delay-150">
                <div className="space-y-1">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60">
                    Read
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {readingMinutes} min
                  </p>
                </div>
                <a
                  href="#comments"
                  className="space-y-1 transition-colors hover:text-foreground"
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60">
                    Notes
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {commentCount} comments
                  </p>
                </a>
              </div>
            </aside>

            <article>
              <div className="reader-article-card surface-card mx-auto max-w-[52rem] px-6 py-10 sm:px-8 sm:py-12 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both">
                <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  <span>{contentTypeLabel}</span>
                  {post.category ? (
                    <>
                      <span className="text-border">
                        /
                      </span>
                      <Link
                        href={getCategoryBrowseHref(post.category)}
                        className="transition-colors hover:text-foreground"
                      >
                        {post.category.name}
                      </Link>
                    </>
                  ) : null}
                </div>

                <h1 className="mt-5 font-serif text-4xl font-light italic leading-[1.05] tracking-tight text-foreground sm:text-5xl">
                  {post.title}
                </h1>

                <div className="mt-7 w-16 border-t border-border" />

                {post.excerpt ? (
                  <p className="mt-7 max-w-2xl font-serif text-lg font-light italic leading-relaxed text-muted-foreground">
                    {post.excerpt}
                  </p>
                ) : null}

                <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  <time
                    dateTime={post.created_at}
                    className="flex items-center gap-1.5"
                  >
                    <Calendar className="h-3.5 w-3.5" suppressHydrationWarning />
                    <span>Published {formatDate(post.created_at)}</span>
                  </time>
                  <span className="text-border">/</span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" suppressHydrationWarning />
                    <span>{readingMinutes} min read</span>
                  </span>
                </div>

                {post.cover_image ? (
                  <div
                    className="narrative-media-slot mb-8 aspect-[16/10] overflow-hidden border border-border bg-muted/40"
                    style={{
                      backgroundImage: `url("${post.cover_image.replace(/"/g, '\\"')}")`,
                    }}
                    aria-label={post.title}
                  />
                ) : null}

                <div
                  id="article-content"
                  className="prose prose-neutral dark:prose-invert max-w-none
                    reader-prose
                    prose-headings:scroll-mt-24
                    prose-p:my-5 prose-p:text-muted-foreground prose-p:leading-relaxed
                    prose-a:text-foreground prose-a:underline prose-a:decoration-border prose-a:underline-offset-4 hover:prose-a:decoration-foreground
                    prose-blockquote:border-l-2 prose-blockquote:border-border prose-blockquote:bg-muted/30 prose-blockquote:py-3 prose-blockquote:pl-5 prose-blockquote:text-muted-foreground
                    prose-pre:rounded-md prose-pre:border prose-pre:border-border prose-pre:bg-foreground prose-pre:text-background prose-pre:text-xs
                    prose-code:before:content-none prose-code:after:content-none prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:text-[11px]"
                  dangerouslySetInnerHTML={{ __html: articleContent }}
                />

                {tags.length > 0 ? (
                  <nav
                    aria-label="文章标签"
                    className="mt-10 flex flex-wrap items-baseline gap-x-4 gap-y-2 border-t border-border pt-6"
                  >
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60">
                      Tags
                    </span>
                    {tags.map((tagItem) => (
                      <Link
                        key={tagItem.id}
                        href={`/tag/${tagItem.slug}`}
                        className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {tagItem.name}
                      </Link>
                    ))}
                  </nav>
                ) : null}
              </div>

              <div className="reader-width-frame mx-auto mt-8 flex max-w-[52rem] items-center justify-around border-y border-border py-3 lg:hidden">
                <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                  <Clock className="h-4 w-4" suppressHydrationWarning />
                  {readingMinutes} Min Read
                </span>
                <a
                  href="#comments"
                  className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground"
                >
                  <MessageSquare className="h-4 w-4" suppressHydrationWarning />
                  {commentCount} Comments
                </a>
              </div>

              <ArticlePager previousPost={previousPost} nextPost={nextPost} />

              <section
                id="comments"
                aria-labelledby="comments-title"
                className="reader-article-card surface-card mx-auto mt-8 max-w-[52rem] p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-6 duration-700 fill-mode-both"
              >
                <div className="mb-6 flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      Discussion
                    </p>
                    <h2
                      id="comments-title"
                      className="mt-1 font-serif text-xl font-light italic text-foreground"
                    >
                      评论
                    </h2>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {commentCount} approved comments
                  </span>
                </div>
                <div className="space-y-8">
                  <CommentList comments={commentRows} />
                  <CommentForm postId={post.id} />
                </div>
              </section>
            </article>

            <aside className="hidden lg:block" aria-label="Reader navigation">
              <div className="sticky top-28 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both delay-300">
                <TableOfContents headings={headings} />

                <section className="surface-card p-5 animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both delay-[400ms]">
                  <h2 className="mb-4 flex items-center gap-2 border-b border-border pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    <Share2 className="h-3.5 w-3.5" suppressHydrationWarning />
                    <span>Signals</span>
                  </h2>
                  <ul className="space-y-3 text-xs text-muted-foreground">
                    <li className="flex items-center justify-between">
                      <span>Reading Time</span>
                      <span className="font-serif font-bold italic text-foreground">
                        {readingMinutes}m
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Total Views</span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {numberFormatter.format(post.view_count + 1)}
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Comments</span>
                      <span className="font-serif font-bold italic text-foreground">
                        {commentCount}
                      </span>
                    </li>
                  </ul>
                </section>

                <RelatedSection
                  posts={relatedPosts}
                  contentTypeLabel={contentTypeLabel}
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

function TableOfContents({ headings }: { headings: TocItem[] }) {
  if (headings.length === 0) return null;

  return (
    <section className="surface-card p-5 animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both delay-[350ms]">
      <h2 className="mb-4 border-b border-border pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        Contents
      </h2>
      <nav aria-label="文章目录" className="space-y-2">
        {headings.map((heading) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            className={cn(
              "group flex items-start text-left text-[11px] text-muted-foreground transition-colors hover:text-foreground",
              heading.level === 3 && "pl-3 text-muted-foreground/80"
            )}
          >
            {heading.level === 3 ? (
              <CornerDownRight
                className="mr-1 mt-0.5 h-2.5 w-2.5 shrink-0 opacity-40"
                suppressHydrationWarning
              />
            ) : null}
            <span className="line-clamp-1">{heading.text}</span>
          </a>
        ))}
      </nav>
    </section>
  );
}

function ArticlePager({
  previousPost,
  nextPost,
}: {
  previousPost: NavigationPost | null;
  nextPost: NavigationPost | null;
}) {
  if (!previousPost && !nextPost) return null;

  return (
    <nav
      aria-label="相邻文章"
      className="reader-width-frame mx-auto mt-8 grid max-w-[52rem] overflow-hidden border border-border bg-card/60 md:grid-cols-2"
    >
      <NavigationPostCard
        post={previousPost}
        label="上一篇"
        direction="previous"
      />
      <NavigationPostCard post={nextPost} label="下一篇" direction="next" />
    </nav>
  );
}

function NavigationPostCard({
  post,
  label,
  direction,
}: {
  post: NavigationPost | null;
  label: string;
  direction: "previous" | "next";
}) {
  if (!post) {
    return (
      <div
        className={cn(
          "p-5",
          direction === "previous" ? "md:border-r md:border-border" : "md:text-right"
        )}
      >
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          暂无更多相邻文章
        </p>
      </div>
    );
  }

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group p-5 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        direction === "previous" && "md:border-r md:border-border"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {direction === "previous" ? (
          <ChevronLeft
            className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
            suppressHydrationWarning
          />
        ) : null}
        <div className={direction === "next" ? "min-w-0 text-right" : "min-w-0"}>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <h3 className="mt-2 line-clamp-2 font-serif text-base font-light italic leading-6 text-foreground transition-colors">
            {post.title}
          </h3>
          {post.category ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {post.category.name}
            </p>
          ) : null}
        </div>
        {direction === "next" ? (
          <ChevronRight
            className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
            suppressHydrationWarning
          />
        ) : null}
      </div>
    </Link>
  );
}

function RelatedSection({
  posts,
  contentTypeLabel,
}: {
  posts: RelatedPost[];
  contentTypeLabel: string;
}) {
  return (
    <section className="surface-card p-5 animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both delay-[500ms]">
      <h2 className="mb-4 flex items-center gap-2 border-b border-border pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        <Tag className="h-3.5 w-3.5" suppressHydrationWarning />
        <span>Related</span>
      </h2>
      {posts.length > 0 ? (
        <RelatedContentList posts={posts} />
      ) : (
        <p className="font-serif text-[11px] italic leading-relaxed text-muted-foreground">
          暂无同类{contentTypeLabel}。
        </p>
      )}
    </section>
  );
}

function RelatedContentList({ posts }: { posts: RelatedPost[] }) {
  return (
    <div className="space-y-3">
      {posts.map((post) => {
        const contentType = getContentType(post.category);
        return (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="group block border-l-2 border-border py-0.5 pl-3 transition-colors hover:border-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <div className="flex min-w-0 items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              <span>
                {getContentTypeLabel(contentType)}
              </span>
              {post.relationLabel ? (
                <span className="min-w-0 truncate">{post.relationLabel}</span>
              ) : post.category ? (
                <span className="min-w-0 truncate">{post.category.name}</span>
              ) : null}
            </div>
            <h3 className="mt-1 line-clamp-2 font-serif text-sm font-light italic leading-5 text-foreground transition-opacity group-hover:opacity-75">
              {post.title}
            </h3>
            {post.excerpt ? (
              <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-muted-foreground">
                {post.excerpt}
              </p>
            ) : null}
            {post.tags && post.tags.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[9px] text-muted-foreground">
                {post.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag.id}
                    className="max-w-36 truncate"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
