import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CommentForm } from "@/components/comment-form";
import { CommentList } from "@/components/comment-list";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import type { Metadata } from "next";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
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
  const { slug } = await params;
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
      <main className="flex-1 container mx-auto px-4 py-8">
        <article className="mx-auto max-w-3xl">
          <header className="mb-8 space-y-4">
            <h1 className="text-4xl font-bold leading-tight">{post.title}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <time dateTime={post.created_at}>
                {new Date(post.created_at).toLocaleDateString("zh-CN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              {post.category && (
                <>
                  <span>&middot;</span>
                  <Link
                    href={`/category/${post.category.slug}`}
                    className="hover:text-foreground transition-colors"
                  >
                    {post.category.name}
                  </Link>
                </>
              )}
              <span>&middot;</span>
              <span>{post.view_count + 1} 阅读</span>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Link key={tag.id} href={`/tag/${tag.slug}`}>
                    <Badge variant="secondary">{tag.name}</Badge>
                  </Link>
                ))}
              </div>
            )}
            {post.cover_image && (
              <img
                src={post.cover_image}
                alt={post.title}
                className="w-full rounded-lg object-cover max-h-96"
              />
            )}
          </header>

          <div
            className="prose prose-neutral dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <Separator className="my-10" />

          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">
              评论 ({comments?.length || 0})
            </h2>
            <CommentList comments={comments || []} />
            <Separator className="my-6" />
            <CommentForm postId={post.id} />
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
}
