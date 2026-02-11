import { createClient } from "@/lib/supabase/server";
import { AdminCommentsClient } from "@/components/admin/comments-client";
import type { Comment } from "@/lib/types";

type CommentRow = Comment & { post?: { title: string } | null };

export default async function AdminCommentsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("comments")
    .select("*, post:posts(title)")
    .order("created_at", { ascending: false });

  return <AdminCommentsClient initialComments={(data || []) as CommentRow[]} />;
}
