import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CommentForm } from "@/components/comment-form";
import { CommentList } from "@/components/comment-list";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Tag,
} from "lucide-react";
import type { Metadata } from "next";
import type { Category, Post, PostTag, Tag as TagType } from "@/lib/types";

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
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
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
    return namedEntities[key] || match;
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

  return slug || `section-${index + 1}`;
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
      const nextIndex = usedIds.get(baseId) || 0;
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
    tags: tagsByPostId.get(post.id) || [],
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
    const sharedTagCount = sharedTagCounts.get(post.id) || 0;
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

    if (existing && (existing.relationRank || 0) >= relationRank) return;
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
      const rankDelta = (b.relationRank || 0) - (a.relationRank || 0);
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

  const currentTagIds = ((postTags || []) as CurrentPostTagRow[]).map(
    (pt) => pt.tag_id
  );
  const commentCount = comments?.length || 0;
  const siblingCategoryIds = (siblingCategories || []).map((category) => category.id);

  const { data: relatedPostTags } =
    currentTagIds.length > 0
      ? await supabase
          .from("post_tags")
          .select("post_id, tag_id")
          .in("tag_id", currentTagIds)
          .neq("post_id", post.id)
      : { data: [] };

  const sharedTagCounts = (relatedPostTags || []).reduce<Map<string, number>>(
    (counts, postTag) => {
      counts.set(postTag.post_id, (counts.get(postTag.post_id) || 0) + 1);
      return counts;
    },
    new Map()
  );
  const tagRelatedPostIds = Array.from(sharedTagCounts.keys());

  const tagRelatedPostsPromise = (async () => {
    if (tagRelatedPostIds.length === 0) return { data: [] };

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

    return query;
  })();

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
    { data: tagRelatedPostsData },
    { data: categoryRelatedPostsData },
    { data: previousPostData },
    { data: nextPostData },
  ] = await Promise.all([
    tagRelatedPostsPromise,
    categoryRelatedQuery,
    previousPostQuery.maybeSingle(),
    nextPostQuery.maybeSingle(),
  ]);
  const relatedCandidates = buildRelatedCandidates({
    tagRelatedPosts: (tagRelatedPostsData || []) as unknown as RelatedPost[],
    categoryRelatedPosts: (categoryRelatedPostsData || []) as unknown as RelatedPost[],
    sharedTagCounts,
    currentCategoryId: post.category_id,
  });
  const relatedCandidateIds = relatedCandidates.map((candidate) => candidate.id);
  const { data: candidatePostTags } =
    relatedCandidateIds.length > 0
      ? await supabase
          .from("post_tags")
          .select("post_id, tag_id")
          .in("post_id", relatedCandidateIds)
      : { data: [] };
  const candidatePostTagRows = (candidatePostTags || []) as PostTag[];
  const usedTagIds = Array.from(
    new Set([
      ...currentTagIds,
      ...candidatePostTagRows.map((postTag) => postTag.tag_id),
    ])
  );
  const { data: tagRows } =
    usedTagIds.length > 0
      ? await supabase.from("tags").select("*").in("id", usedTagIds)
      : { data: [] };
  const usedTags = (tagRows || []) as TagType[];
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
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <article className="mx-auto w-full max-w-[840px] px-5 py-10 md:px-6 md:py-12">
          <Link
            href={contentListHref}
            className="mb-6 inline-flex h-9 items-center gap-2 rounded-md px-0 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <ArrowLeft className="h-4 w-4" suppressHydrationWarning />
            返回{contentTypeLabel}
          </Link>

          <header className="border-b border-border/60 pb-6">
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
              <span>{contentTypeLabel}</span>
              {post.category ? (
                <>
                  <span aria-hidden="true">/</span>
                  <Link
                    href={getCategoryBrowseHref(post.category)}
                    className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    {post.category.name}
                  </Link>
                </>
              ) : null}
              <span aria-hidden="true">/</span>
              <time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
            </div>

            <div className="min-w-0 space-y-3 py-5">
              <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
                {post.title}
              </h1>
              {post.excerpt ? (
                <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                  {post.excerpt}
                </p>
              ) : null}
            </div>

            <p className="text-sm leading-6 text-muted-foreground">
              约 {readingMinutes} 分钟 · {numberFormatter.format(post.view_count + 1)} 次阅读 ·{" "}
              {commentCount} 条评论 · 更新于 {formatDate(post.updated_at || post.created_at)}
            </p>

            {tags.length > 0 ? (
              <nav
                aria-label="文章标签"
                className="mt-4 flex min-w-0 flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground"
              >
                {tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/tag/${tag.slug}`}
                    className="inline-flex h-8 items-center gap-1.5 underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    <Tag className="h-3.5 w-3.5" suppressHydrationWarning />
                    {tag.name}
                  </Link>
                ))}
              </nav>
            ) : null}
          </header>

          {post.cover_image ? (
            <figure className="mt-6 max-w-[680px]">
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                <Image
                  src={post.cover_image}
                  alt={post.title}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 680px"
                  className="object-cover"
                />
              </div>
              <figcaption className="mt-2 text-xs text-muted-foreground">
                {post.title}
              </figcaption>
            </figure>
          ) : null}

          <div className="max-w-[680px] py-10 md:py-12">
            <TableOfContents headings={headings} />

            <div
              className="prose prose-neutral dark:prose-invert max-w-none
                prose-headings:scroll-mt-24 prose-headings:font-semibold prose-headings:tracking-tight
                prose-p:leading-8 prose-p:text-foreground/90
                prose-a:text-primary prose-a:underline prose-a:decoration-primary/40 prose-a:underline-offset-4 hover:prose-a:decoration-primary
                prose-img:rounded-lg
                prose-blockquote:border-l-border prose-blockquote:text-muted-foreground
                prose-hr:border-border/60
                prose-pre:rounded-md prose-pre:bg-muted/60
                prose-code:before:content-none prose-code:after:content-none
                prose-code:rounded-md prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm"
              dangerouslySetInnerHTML={{ __html: articleContent }}
            />

            <ArticleFinishPanel
              category={post.category}
              tags={tags}
              commentCount={commentCount}
              contentType={contentType}
            />

            <ArticlePager previousPost={previousPost} nextPost={nextPost} />

            <RelatedSection
              posts={relatedPosts}
              contentListHref={contentListHref}
              contentTypeLabel={contentTypeLabel}
            />

            <section
              id="comments"
              aria-labelledby="comments-title"
              className="mt-12 border-t border-border/60 pt-8"
            >
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Discussion
                  </p>
                  <h2 id="comments-title" className="mt-1 text-lg font-semibold">
                    评论
                  </h2>
                </div>
                <span className="text-sm text-muted-foreground">
                  {commentCount} 条已审核评论
                </span>
              </div>
              <div className="space-y-8">
                <CommentList comments={comments || []} />
                <CommentForm postId={post.id} />
              </div>
            </section>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}

function ArticleFinishPanel({
  category,
  tags,
  commentCount,
  contentType,
}: {
  category?: Category | null;
  tags: TagType[];
  commentCount: number;
  contentType: ContentType;
}) {
  const contentTypeLabel = getContentTypeLabel(contentType);
  return (
    <section className="mt-12 border-t border-border/60 pt-8">
      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_220px]">
        <div>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">
              继续浏览
            </p>
            <h2 className="mt-1 text-lg font-semibold">读完之后</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              可以继续查看同主题{contentTypeLabel}，也可以在评论区补充你的想法。
            </p>
          </div>
          {tags.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2">
              {tags.slice(0, 4).map((tag) => (
                <Link
                  key={tag.id}
                  href={`/tag/${tag.slug}`}
                  className="inline-flex h-8 items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <Tag className="h-3.5 w-3.5" suppressHydrationWarning />
                  {tag.name}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
        <div className="grid gap-1">
          <a
            href="#comments"
            className="group flex min-h-11 items-center justify-between gap-3 border-b border-border/60 py-3 text-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <span className="inline-flex items-center gap-2 text-muted-foreground group-hover:text-foreground">
              <MessageSquare className="h-4 w-4" suppressHydrationWarning />
              评论区
            </span>
            <span className="text-xs text-muted-foreground">{commentCount}</span>
          </a>
          <Link
            href={category ? getCategoryBrowseHref(category) : getContentListHref(contentType)}
            className="group flex min-h-11 items-center justify-between gap-3 py-3 text-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <span className="text-muted-foreground group-hover:text-foreground">
              {category ? "同类内容" : `更多${contentTypeLabel}`}
            </span>
            <ArrowRight
              className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground"
              suppressHydrationWarning
            />
          </Link>
        </div>
      </div>
    </section>
  );
}

function TableOfContents({ headings }: { headings: TocItem[] }) {
  if (headings.length === 0) return null;

  return (
    <section className="mb-8 border-y border-border/60 py-4">
      <h2 className="text-sm font-medium text-foreground">
        目录
      </h2>
      <nav aria-label="文章目录" className="mt-3 grid gap-1">
        {headings.map((heading) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            className={cn(
              "line-clamp-2 min-h-8 px-2 py-1.5 text-sm leading-5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              heading.level === 3 && "pl-5 text-xs"
            )}
          >
            {heading.text}
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
      className="mt-10 grid gap-3 md:grid-cols-2"
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
      <div className="rounded-lg border border-border/60 bg-background p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          暂无更多相邻文章
        </p>
      </div>
    );
  }

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group rounded-lg border border-border/60 bg-background p-4 transition-colors hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <div className="flex items-start justify-between gap-3">
        {direction === "previous" ? (
          <ChevronLeft
            className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
            suppressHydrationWarning
          />
        ) : null}
        <div className={direction === "next" ? "min-w-0 text-right" : "min-w-0"}>
          <p className="text-xs text-muted-foreground">{label}</p>
          <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-6 transition-colors group-hover:text-primary">
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
  contentListHref,
  contentTypeLabel,
}: {
  posts: RelatedPost[];
  contentListHref: string;
  contentTypeLabel: string;
}) {
  return (
    <section className="mt-12 border-t border-border/60 pt-8">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Related
          </p>
          <h2 className="mt-1 text-lg font-semibold">
            相关内容
          </h2>
        </div>
        <Link
          href={contentListHref}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          全部{contentTypeLabel}
        </Link>
      </div>
      {posts.length > 0 ? (
        <RelatedContentList posts={posts} />
      ) : (
        <p className="text-sm leading-6 text-muted-foreground">
          暂无同类内容，可以回到{contentTypeLabel}列表继续浏览。
        </p>
      )}
    </section>
  );
}

function RelatedContentList({ posts }: { posts: RelatedPost[] }) {
  return (
    <div className="grid gap-1">
      {posts.map((post) => {
        const contentType = getContentType(post.category);
        return (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="group -mx-2 block px-2 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
              <span className="bg-muted/25 px-2 py-0.5 text-foreground">
                {getContentTypeLabel(contentType)}
              </span>
              {post.relationLabel ? (
                <span className="min-w-0 truncate">{post.relationLabel}</span>
              ) : post.category ? (
                <span className="min-w-0 truncate">{post.category.name}</span>
              ) : null}
            </div>
            <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-6 transition-colors group-hover:text-primary">
              {post.title}
            </h3>
            {post.excerpt ? (
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                {post.excerpt}
              </p>
            ) : null}
            {post.tags && post.tags.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {post.tags.slice(0, 3).map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="h-5 rounded-md px-2 py-0 text-[10px] font-normal text-muted-foreground"
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
