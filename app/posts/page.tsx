import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PostCard } from "@/components/post-card";
import { Pagination } from "@/components/pagination";
import Link from "next/link";

const PAGE_SIZE = 12;

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string }>;
}) {
  const { page: pageStr, category: categorySlug } = await searchParams;
  const page = Math.max(1, parseInt(pageStr || "1"));
  const supabase = await createClient();

  let categoryId: string | null = null;
  let categoryName: string | null = null;

  if (categorySlug) {
    const { data: category } = await supabase
      .from("categories")
      .select("id,name")
      .eq("slug", categorySlug)
      .eq("type", "post") // Ensure type=post
      .single();
    if (category) {
      categoryId = category.id;
      categoryName = category.name;
    }
  }

  // Base query: published posts with category.type = 'post' (or no category type filter if we rely on category_id)
  // To exclude moments from posts list:
  // If no category selected: filter by categories.type = 'post' or categories.type IS NULL (if that's allowed)
  // Assuming all posts have a category.

  let countQuery;

  if (categoryId) {
    countQuery = supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("published", true)
      .eq("category_id", categoryId);
  } else {
     // Relaxed filter: Allow posts with no category or category.type != 'moment'
     // Since 'or' with join is tricky, we'll fetch all published posts and we accept that for now.
     // Ideally we should filter out moments, but if uncategorized posts are missing due to !inner, we prioritize showing them.
    countQuery = supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("published", true);
  }

  const { count } = await countQuery;
  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  let postsQuery = supabase
    .from("posts")
    .select("*, category:categories(*)") // Changed to left join to include uncategorized posts
    .eq("published", true)
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (categoryId) {
    postsQuery = supabase
      .from("posts")
      .select("*, category:categories!inner(*)")
      .eq("published", true)
      .eq("category_id", categoryId)
      .order("created_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  }

  const { data: posts } = await postsQuery;

  const postsWithTags = await Promise.all(
    (posts || []).map(async (post) => {
      const { data: postTags } = await supabase
        .from("post_tags")
        .select("tag_id")
        .eq("post_id", post.id);

      if (postTags && postTags.length > 0) {
        const tagIds = postTags.map((pt) => pt.tag_id);
        const { data: tags } = await supabase.from("tags").select("*").in("id", tagIds);
        return { ...post, tags: tags || [] };
      }
      return { ...post, tags: [] };
    })
  );

  const basePath = categorySlug ? `/posts?category=${encodeURIComponent(categorySlug)}` : "/posts";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-[1440px] px-4 md:px-6 py-12 md:py-16">
        <div className="flex items-baseline justify-between mb-10">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold">
              {categoryName ? `文章 · ${categoryName}` : "文章"}
            </h1>
            {categoryName && (
              <Link href="/posts" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                查看全部文章
              </Link>
            )}
          </div>
          {count !== null && (
            <span className="text-sm text-muted-foreground">{count} 篇</span>
          )}
        </div>

        {postsWithTags.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
            {postsWithTags.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <p className="text-muted-foreground mb-4">暂无文章</p>
            {/* <Link href="/admin" className="text-sm text-primary hover:underline">
              前往管理后台
            </Link> */}
          </div>
        )}

        <Pagination currentPage={page} totalPages={totalPages} basePath={basePath} />
      </main>
      <Footer />
    </div>
  );
}
