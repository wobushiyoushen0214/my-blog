import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CommentForm } from "@/components/comment-form";
import { CommentList } from "@/components/comment-list";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { ArrowLeft, Calendar, Eye, MessageSquare } from "lucide-react";
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
        {/* Article Header */}
        <div className="border-b">
          <div className="container mx-auto px-4 md:px-6 py-10 md:py-16">
            <div className="mx-auto max-w-3xl space-y-6">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                返回首页
              </Link>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.15] tracking-tight">
                {post.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {new Date(post.created_at).toLocaleDateString("zh-CN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                {post.category && (
                  <Link
                    href={`/category/${post.category.slug}`}
                    className="hover:text-foreground transition-colors"
                  >
                    <Badge variant="secondary" className="font-normal">
                      {post.category.name}
                    </Badge>
                  </Link>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Eye className="h-4 w-4" />
                  {post.view_count + 1} 阅读
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4" />
                  {comments?.length || 0} 评论
                </span>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Link key={tag.id} href={`/tag/${tag.slug}`}>
                      <Badge variant="outline" className="font-normal">
                        {tag.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cover Image */}
        {post.cover_image && (
          <div className="container mx-auto px-4 md:px-6 -mt-1">
            <div className="mx-auto max-w-4xl">
              <img
                src={post.cover_image}
                alt={post.title}
                className="w-full rounded-xl object-cover max-h-[480px] shadow-lg"
              />
            </div>
          </div>
        )}

        {/* Article Content */}
        <div className="container mx-auto px-4 md:px-6 py-10">
          <article className="mx-auto max-w-3xl">
            <div
              className="prose prose-neutral dark:prose-invert prose-lg max-w-none
                prose-headings:tracking-tight prose-headings:font-bold
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-img:rounded-xl prose-img:shadow-md
                prose-blockquote:border-l-primary/50 prose-blockquote:not-italic
                prose-code:before:content-none prose-code:after:content-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            <Separator className="my-12" />

            {/* Comments */}
            <section className="space-y-8">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                评论 ({comments?.length || 0})
              </h2>
              <CommentList comments={comments || []} />
              <CommentForm postId={post.id} />
            </section>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
