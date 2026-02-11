import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PostCard } from "@/components/post-card";
import { Pagination } from "@/components/pagination";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, BookOpen } from "lucide-react";
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

      {/* Hero */}
      {page === 1 && (
        <section className="relative overflow-hidden border-b">
          <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-accent/10" />
          <div className="container mx-auto px-4 md:px-6 py-16 md:py-24 relative">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-muted-foreground">
                <BookOpen className="h-3.5 w-3.5" />
                <span>个人博客</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
                探索技术，
                <br />
                <span className="text-muted-foreground">分享生活与思考</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                在这里记录学习的点滴、技术的感悟以及对生活的思考，希望能给你带来启发。
              </p>
            </div>
          </div>
        </section>
      )}

      <main className="flex-1 container mx-auto px-4 md:px-6 py-10">
        {/* Featured Post */}
        {featuredPost && (
          <section className="mb-12">
            <Link
              href={`/blog/${featuredPost.slug}`}
              className="group block overflow-hidden rounded-2xl border bg-card transition-all hover:shadow-xl"
            >
              <div className="grid md:grid-cols-2 gap-0">
                {featuredPost.cover_image ? (
                  <div className="relative h-64 md:h-full overflow-hidden">
                    <img
                      src={featuredPost.cover_image}
                      alt={featuredPost.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
                  </div>
                ) : (
                  <div className="relative h-64 md:h-full bg-linear-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                )}
                <div className="p-8 md:p-10 flex flex-col justify-center space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs font-normal">
                      精选文章
                    </Badge>
                    {featuredPost.category && (
                      <Badge variant="outline" className="text-xs font-normal">
                        {featuredPost.category.name}
                      </Badge>
                    )}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold leading-tight group-hover:text-primary transition-colors">
                    {featuredPost.title}
                  </h2>
                  <p className="text-muted-foreground line-clamp-3 leading-relaxed">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <time dateTime={featuredPost.created_at}>
                        {new Date(featuredPost.created_at).toLocaleDateString(
                          "zh-CN",
                          { year: "numeric", month: "long", day: "numeric" }
                        )}
                      </time>
                      <span>&middot;</span>
                      <span>{featuredPost.view_count} 阅读</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                      阅读全文 <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* Post Grid */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">
              {page === 1 ? "最新文章" : `第 ${page} 页`}
            </h2>
            {count !== null && (
              <span className="text-sm text-muted-foreground">
                共 {count} 篇文章
              </span>
            )}
          </div>

          {remainingPosts.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {remainingPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : postsWithTags.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="rounded-full bg-muted p-6 mb-6">
                <BookOpen className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">暂无文章</h3>
              <p className="text-muted-foreground mb-6">
                去后台发布第一篇文章吧
              </p>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                前往管理后台 <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : null}

          <Pagination currentPage={page} totalPages={totalPages} basePath="/" />
        </section>
      </main>

      <Footer />
    </div>
  );
}
