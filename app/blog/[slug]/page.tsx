import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CommentForm } from "@/components/comment-form";
import { CommentList } from "@/components/comment-list";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
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

  const { data: post } = await supabase
    .from("posts")
    .select("*, category:categories(*)")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!post) notFound();

  // Increment view count
  await supabase
    .from("posts")
    .update({ view_count: post.view_count + 1 })
    .eq("id", post.id);

  // Fetch tags
  const { data: postTags } = await supabase
    .from("post_tags")
    .select("tag_id")
    .eq("post_id", post.id);

  let tags: { id: string; name: string; slug: string }[] = [];
  if (postTags && postTags.length > 0) {
    const tagIds = postTags.map((pt) => pt.tag_id);
    const { data } = await supabase.from("tags").select("*").in("id", tagIds);
    tags = data || [];
  }

  // Fetch approved comments
  const { data: comments } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", post.id)
    .eq("approved", true)
    .order("created_at", { ascending: true });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <article className="container mx-auto px-4 md:px-6">
          {/* Header */}
          <div className="mx-auto max-w-2xl pt-12 pb-8 md:pt-20 md:pb-12">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              返回
            </Link>

            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <time dateTime={post.created_at}>
                {new Date(post.created_at).toLocaleDateString("zh-CN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              {post.category && (
                <>
                  <span className="text-border">&middot;</span>
                  <Link
                    href={`/category/${post.category.slug}`}
                    className="hover:text-foreground transition-colors"
                  >
                    {post.category.name}
                  </Link>
                </>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold leading-[1.2] tracking-tight mb-4">
              {post.title}
            </h1>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <Link key={tag.id} href={`/tag/${tag.slug}`}>
                    <Badge variant="secondary" className="font-normal text-xs rounded-md">
                      {tag.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Cover Image */}
          {post.cover_image && (
            <div className="mx-auto max-w-3xl mb-10">
              <img
                src={post.cover_image}
                alt={post.title}
                className="w-full rounded-lg object-cover max-h-[480px]"
              />
            </div>
          )}

          {/* Content */}
          <div className="mx-auto max-w-2xl pb-16">
            <div
              className="prose prose-neutral dark:prose-invert max-w-none
                prose-headings:tracking-tight prose-headings:font-semibold
                prose-p:leading-[1.8] prose-p:text-foreground/90
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-img:rounded-lg
                prose-blockquote:border-l-border prose-blockquote:not-italic prose-blockquote:text-muted-foreground
                prose-code:before:content-none prose-code:after:content-none
                prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Comments */}
            <div className="border-t border-border/40 mt-16 pt-12 space-y-8">
              <h2 className="text-lg font-semibold">
                评论 ({comments?.length || 0})
              </h2>
              <CommentList comments={comments || []} />
              <CommentForm postId={post.id} />
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
