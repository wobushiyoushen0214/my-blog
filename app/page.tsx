import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PostCard } from "@/components/post-card";
import { Pagination } from "@/components/pagination";

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

  // Fetch tags for each post
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">最新文章</h1>
          <p className="mt-2 text-muted-foreground">
            分享技术、生活与思考
          </p>
        </div>
        {postsWithTags.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {postsWithTags.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">暂无文章</p>
            <p className="text-sm mt-2">去后台发布第一篇文章吧</p>
          </div>
        )}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          basePath="/"
        />
      </main>
      <Footer />
    </div>
  );
}
