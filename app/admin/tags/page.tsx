import { createClient } from "@/lib/supabase/server";
import { AdminTagsClient } from "@/components/admin/tags-client";

export default async function AdminTagsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("tags").select("*").order("name");
  return <AdminTagsClient initialTags={data || []} />;
}
