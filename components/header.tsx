/*
 * @Author: LiZhiWei
 * @Date: 2026-02-11 14:08:59
 * @LastEditors: LiZhiWei
 * @LastEditTime: 2026-02-11 15:48:56
 * @Description: 
 */
import { createClient } from "@/lib/supabase/server";
import { HeaderClient } from "@/components/header-client";

export async function Header() {
  const supabase = await createClient();
  // Fetch categories with type
  const { data: categories } = await supabase
    .from("categories")
    .select("id,name,slug,type")
    .order("name");

  return <HeaderClient categories={categories || []} />;
}
