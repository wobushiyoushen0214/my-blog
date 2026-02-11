import { createClient } from "@/lib/supabase/server";
import { AdminPostsClient } from "@/components/admin/posts-client";
import type { Post } from "@/lib/types";

type PostRow = Post & { category?: { name: string } | null };

export default async function AdminPostsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("*, category:categories(name)")
    .order("created_at", { ascending: false });

  return <AdminPostsClient initialPosts={(data || []) as PostRow[]} />;
}
