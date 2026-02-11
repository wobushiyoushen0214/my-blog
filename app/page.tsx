import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PostCard } from "@/components/post-card";
import { Pagination } from "@/components/pagination";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const PAGE_SIZE = 9;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr || "1"));
  const supabase = await createClient();

  const { count } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("published", true);

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  const { data: posts } = await supabase
    .from("posts")
    .select("*, category:categories(*)")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const postsWithTags = await Promise.all(
    (posts || []).map(async (post) => {
      const { data: postTags } = await supabase
        .from("post_tags")
        .select("tag_id")
        .eq("post_id", post.id);

      if (postTags && postTags.length > 0) {
        const tagIds = postTags.map((pt) => pt.tag_id);
        const { data: tags } = await supabase
          .from("tags")
          .select("*")
          .in("id", tagIds);
        return { ...post, tags: tags || [] };
      }
      return { ...post, tags: [] };
    })
  );

  const featuredPost = page === 1 ? postsWithTags[0] : null;
  const remainingPosts = page === 1 ? postsWithTags.slice(1) : postsWithTags;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero + Featured */}
        {page === 1 && (
          <div className="container mx-auto px-4 md:px-6 pt-16 pb-12 md:pt-24 md:pb-16">
            <div className="max-w-2xl mb-16">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.15] mb-4">
                个人博客
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                记录技术学习与生活思考
              </p>
            </div>

            {featuredPost && (
              <Link
                href={`/blog/${featuredPost.slug}`}
                className="group grid md:grid-cols-2 gap-8 items-center"
              >
                <div className="relative aspect-video overflow-hidden rounded-xl">
                  {featuredPost.cover_image ? (
                    <img
                      src={featuredPost.cover_image}
                      alt={featuredPost.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="h-full w-full bg-muted" />
                  )}
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <time dateTime={featuredPost.created_at}>
                      {new Date(featuredPost.created_at).toLocaleDateString(
                        "zh-CN",
                        { year: "numeric", month: "long", day: "numeric" }
                      )}
                    </time>
                    {featuredPost.category && (
                      <>
                        <span className="text-border">&middot;</span>
                        <span>{featuredPost.category.name}</span>
                      </>
                    )}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold leading-tight group-hover:text-primary transition-colors">
                    {featuredPost.title}
                  </h2>
                  {featuredPost.excerpt && (
                    <p className="text-muted-foreground leading-relaxed line-clamp-3">
                      {featuredPost.excerpt}
                    </p>
                  )}
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary group-hover:gap-2.5 transition-all">
                    阅读全文 <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            )}
          </div>
        )}

        {/* Divider */}
        {page === 1 && <div className="border-t border-border/40" />}

        {/* Post Grid */}
        <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
          <div className="flex items-baseline justify-between mb-10">
            <h2 className="text-lg font-semibold">
              {page === 1 ? "所有文章" : `第 ${page} 页`}
            </h2>
            {count !== null && (
              <span className="text-sm text-muted-foreground">
                {count} 篇
              </span>
            )}
          </div>

          {remainingPosts.length > 0 ? (
            <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {remainingPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : postsWithTags.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-muted-foreground mb-4">暂无文章</p>
              <Link
                href="/admin"
                className="text-sm text-primary hover:underline"
              >
                前往管理后台
              </Link>
            </div>
          ) : null}

          <Pagination currentPage={page} totalPages={totalPages} basePath="/" />
        </div>
      </main>

      <Footer />
    </div>
  );
}
