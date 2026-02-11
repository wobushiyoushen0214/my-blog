import { createClient } from "@/lib/supabase/server";
import { AdminCategoriesClient } from "@/components/admin/categories-client";

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*").order("name");

  return <AdminCategoriesClient initialCategories={data || []} />;
}
