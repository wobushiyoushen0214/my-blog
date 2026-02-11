import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PostCard } from "@/components/post-card";
import { Pagination } from "@/components/pagination";
import Link from "next/link";

const PAGE_SIZE = 12;

export default async function MomentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tag?: string }>;
}) {
  const { page: pageStr, tag: tagSlug } = await searchParams;
  const page = Math.max(1, parseInt(pageStr || "1"));
  const supabase = await createClient();

  let tagId: string | null = null;
  let tagName: string | null = null;

  if (tagSlug) {
    const { data: tag } = await supabase
      .from("tags")
      .select("id,name")
      .eq("slug", tagSlug)
      .single();
    if (tag) {
      tagId = tag.id;
      tagName = tag.name;
    }
  }

  const { count } = tagId
    ? await supabase
        .from("posts")
        .select("id, post_tags!inner(tag_id)", { count: "exact", head: true })
        .eq("published", true)
        .eq("post_tags.tag_id", tagId)
    : await supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("published", true);
  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  let postsQuery = supabase
    .from("posts")
    .select("*, category:categories(*)")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (tagId) {
    postsQuery = supabase
      .from("posts")
      .select("*, category:categories(*), post_tags!inner(tag_id)")
      .eq("published", true)
      .eq("post_tags.tag_id", tagId)
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

  const basePath = tagSlug ? `/moments?tag=${encodeURIComponent(tagSlug)}` : "/moments";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="flex items-baseline justify-between mb-10">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold">
              {tagName ? `见闻 · ${tagName}` : "见闻"}
            </h1>
            {tagName && (
              <Link href="/moments" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                查看全部见闻
              </Link>
            )}
          </div>
          {count !== null && (
            <span className="text-sm text-muted-foreground">{count} 条</span>
          )}
        </div>

        {postsWithTags.length > 0 ? (
          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {postsWithTags.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <p className="text-muted-foreground mb-4">暂无内容</p>
            <Link href="/admin" className="text-sm text-primary hover:underline">
              前往管理后台
            </Link>
          </div>
        )}

        <Pagination currentPage={page} totalPages={totalPages} basePath={basePath} />
      </main>
      <Footer />
    </div>
  );
}
