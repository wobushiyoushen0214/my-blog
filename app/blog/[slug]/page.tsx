import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CommentForm } from "@/components/comment-form";
import { CommentList } from "@/components/comment-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  MessageSquare,
  NotebookText,
  Tag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
    { data: tagRows },
    { data: comments },
    { data: siblingCategories },
  ] = await Promise.all([
    supabase.from("post_tags").select("tag_id").eq("post_id", post.id),
    supabase.from("tags").select("*"),
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

  const allTags = (tagRows || []) as TagType[];
  const tagById = new Map(allTags.map((tag) => [tag.id, tag]));
  const currentTagIds = ((postTags || []) as CurrentPostTagRow[]).map(
    (pt) => pt.tag_id
  );
  const tags = currentTagIds
    .map((tagId) => tagById.get(tagId))
    .filter((tag): tag is TagType => Boolean(tag));
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
  const relatedPosts = attachTagsFromRows(
    relatedCandidates,
    (candidatePostTags || []) as PostTag[],
    allTags
  );
  const previousPost = previousPostData as unknown as NavigationPost | null;
  const nextPost = nextPostData as unknown as NavigationPost | null;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <article className="mx-auto w-full max-w-[1280px] px-4 py-10 md:px-6 md:py-14">
          <Link
            href={contentListHref}
            className="mb-8 inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <ArrowLeft className="h-4 w-4" suppressHydrationWarning />
            返回{contentTypeLabel}
          </Link>

          <header className="grid gap-8 border-b border-border/50 pb-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
            <div className="min-w-0 space-y-5">
              <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2 py-1 text-xs font-medium text-foreground">
                  {contentType === "moment" ? (
                    <NotebookText className="h-3.5 w-3.5" suppressHydrationWarning />
                  ) : (
                    <FileText className="h-3.5 w-3.5" suppressHydrationWarning />
                  )}
                  {contentTypeLabel}
                </span>
                {post.category ? (
                  <Link
                    href={getCategoryBrowseHref(post.category)}
                    className="rounded-md border bg-background px-2 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    {post.category.name}
                  </Link>
                ) : null}
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays
                    className="h-3.5 w-3.5"
                    suppressHydrationWarning
                  />
                  <time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" suppressHydrationWarning />
                  {readingMinutes} 分钟阅读
                </span>
              </div>

              <div className="space-y-4">
                <h1 className="max-w-4xl text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
                  {post.title}
                </h1>
                {post.excerpt ? (
                  <p className="max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
                    {post.excerpt}
                  </p>
                ) : null}
              </div>

              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/tag/${tag.slug}`}
                      className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    >
                      <Badge variant="outline" className="rounded-md font-normal">
                        <Tag className="h-3.5 w-3.5" suppressHydrationWarning />
                        {tag.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>

            <ArticleMetaPanel
              views={post.view_count + 1}
              comments={commentCount}
              updatedAt={post.updated_at || post.created_at}
              contentTypeLabel={contentTypeLabel}
            />
          </header>

          {post.cover_image ? (
            <div className="mt-8">
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border bg-muted md:aspect-[21/9]">
                <Image
                  src={post.cover_image}
                  alt={post.title}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 1280px"
                  className="object-cover"
                />
              </div>
            </div>
          ) : null}

          <div className="grid gap-10 py-10 lg:grid-cols-[minmax(0,760px)_280px] lg:items-start lg:justify-center">
            <div className="min-w-0">
              <div
                className="prose prose-neutral dark:prose-invert max-w-none
                  prose-headings:scroll-mt-24 prose-headings:font-semibold prose-headings:tracking-tight
                  prose-p:leading-[1.85] prose-p:text-foreground/90
                  prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                  prose-img:rounded-lg prose-img:border
                  prose-blockquote:border-l-primary/50 prose-blockquote:not-italic prose-blockquote:text-muted-foreground
                  prose-hr:border-border/60
                  prose-pre:rounded-lg prose-pre:border prose-pre:bg-muted/60
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

              <section
                id="comments"
                aria-labelledby="comments-title"
                className="mt-16 border-t border-border/50 pt-10"
              >
                <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
                      Discussion
                    </p>
                    <h2 id="comments-title" className="text-xl font-semibold tracking-tight">
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

            <aside className="space-y-4 lg:sticky lg:top-20">
              <TableOfContents headings={headings} />

              <InfoPanel title="内容信息">
                <InfoRow label="类型" value={contentTypeLabel} />
                <InfoRow label="阅读量" value={numberFormatter.format(post.view_count + 1)} />
                <InfoRow label="评论" value={`${commentCount} 条`} />
                <InfoRow label="更新" value={formatDate(post.updated_at || post.created_at)} />
              </InfoPanel>

              <InfoPanel title="阅读路径">
                <div className="grid gap-2">
                  <Button variant="outline" className="justify-between" asChild>
                    <a href="#comments">
                      参与讨论
                      <MessageSquare
                        className="h-4 w-4"
                        suppressHydrationWarning
                      />
                    </a>
                  </Button>
                  <Button variant="outline" className="justify-between" asChild>
                    <Link href={contentListHref}>
                      {contentTypeLabel}列表
                      <BookOpen className="h-4 w-4" suppressHydrationWarning />
                    </Link>
                  </Button>
                  {post.category ? (
                    <Button variant="outline" className="justify-between" asChild>
                      <Link href={getCategoryBrowseHref(post.category)}>
                        {post.category.name}
                        <ArrowRight
                          className="h-4 w-4"
                          suppressHydrationWarning
                        />
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </InfoPanel>

              {relatedPosts.length > 0 ? (
                <InfoPanel title="相关内容">
                  <RelatedContentList posts={relatedPosts} />
                </InfoPanel>
              ) : (
                <InfoPanel title="继续阅读">
                  <p className="text-sm leading-6 text-muted-foreground">
                    暂无同类内容，可以返回{contentTypeLabel}列表浏览更多记录。
                  </p>
                  <Button className="mt-3 w-full" variant="outline" asChild>
                    <Link href={contentListHref}>查看全部{contentTypeLabel}</Link>
                  </Button>
                </InfoPanel>
              )}
            </aside>
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
    <section className="mt-12 rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
            Next
          </p>
          <h2 className="mt-1 text-base font-medium">读完之后</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            可以继续查看同主题{contentTypeLabel}，或在评论区补充你的想法。
          </p>
          {tags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.slice(0, 4).map((tag) => (
                <Link
                  key={tag.id}
                  href={`/tag/${tag.slug}`}
                  className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <Badge variant="outline" className="rounded-md font-normal">
                    <Tag className="h-3.5 w-3.5" suppressHydrationWarning />
                    {tag.name}
                  </Badge>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
        <div className="grid shrink-0 gap-2 sm:grid-cols-2 md:w-64 md:grid-cols-1">
          <Button asChild>
            <a href="#comments">
              评论区
              <MessageSquare className="h-4 w-4" suppressHydrationWarning />
              <span className="text-xs opacity-80">{commentCount}</span>
            </a>
          </Button>
          <Button variant="outline" asChild>
            <Link href={category ? getCategoryBrowseHref(category) : getContentListHref(contentType)}>
              {category ? "同类内容" : `更多${contentTypeLabel}`}
              <ArrowRight className="h-4 w-4" suppressHydrationWarning />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function TableOfContents({ headings }: { headings: TocItem[] }) {
  if (headings.length === 0) return null;

  return (
    <InfoPanel title="目录">
      <nav aria-label="文章目录" className="grid gap-1">
        {headings.map((heading) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            className={cn(
              "line-clamp-2 rounded-md px-2 py-1.5 text-sm leading-5 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              heading.level === 3 && "pl-5 text-xs"
            )}
          >
            {heading.text}
          </a>
        ))}
      </nav>
    </InfoPanel>
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
      className="mt-6 grid gap-3 md:grid-cols-2"
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
      <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-4">
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
      className="group rounded-lg border bg-card p-4 transition-colors hover:border-primary/35 hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <div className="flex items-start justify-between gap-3">
        {direction === "previous" ? (
          <ChevronLeft
            className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
            suppressHydrationWarning
          />
        ) : null}
        <div className={direction === "next" ? "min-w-0 text-right" : "min-w-0"}>
          <p className="text-xs text-muted-foreground">{label}</p>
          <h3 className="mt-2 line-clamp-2 text-sm font-medium leading-6 transition-colors group-hover:text-primary">
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
            className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
            suppressHydrationWarning
          />
        ) : null}
      </div>
    </Link>
  );
}

function ArticleMetaPanel({
  views,
  comments,
  updatedAt,
  contentTypeLabel,
}: {
  views: number;
  comments: number;
  updatedAt: string;
  contentTypeLabel: string;
}) {
  return (
    <div className="grid gap-2 rounded-lg border bg-card p-3 sm:grid-cols-2 lg:grid-cols-1">
      <MetaItem
        icon={contentTypeLabel === "见闻" ? NotebookText : FileText}
        label="类型"
        value={contentTypeLabel}
      />
      <MetaItem
        icon={Eye}
        label="阅读"
        value={numberFormatter.format(views)}
      />
      <MetaItem
        icon={MessageSquare}
        label="评论"
        value={`${comments} 条`}
      />
      <MetaItem
        icon={CalendarDays}
        label="更新"
        value={formatDate(updatedAt)}
      />
    </div>
  );
}

function RelatedContentList({ posts }: { posts: RelatedPost[] }) {
  return (
    <div className="divide-y divide-border/60">
      {posts.map((post) => {
        const contentType = getContentType(post.category);
        return (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="group block py-3 first:pt-0 last:pb-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-md border bg-background px-1.5 py-0.5 text-foreground">
                {getContentTypeLabel(contentType)}
              </span>
              {post.relationLabel ? (
                <span className="min-w-0 truncate">{post.relationLabel}</span>
              ) : post.category ? (
                <span className="min-w-0 truncate">{post.category.name}</span>
              ) : null}
            </div>
            <h3 className="mt-2 line-clamp-2 text-sm font-medium leading-6 transition-colors group-hover:text-primary">
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
                    variant="outline"
                    className="h-5 rounded-md px-1.5 py-0 text-[10px] font-normal text-muted-foreground"
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

function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md bg-muted/30 px-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground" suppressHydrationWarning />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function InfoPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-card">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-medium">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/50 py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
