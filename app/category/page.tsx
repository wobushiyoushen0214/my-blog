import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "所有分类",
};

export default async function CategoriesPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  const categoriesWithCount = await Promise.all(
    (categories || []).map(async (category) => {
      const { count } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("published", true)
        .eq("category_id", category.id);
      return { ...category, postCount: count || 0 };
    })
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">所有分类</h1>
        {categoriesWithCount.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categoriesWithCount.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="block rounded-lg border p-6 hover:shadow-md transition-shadow"
              >
                <h2 className="text-xl font-semibold">{category.name}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {category.postCount} 篇文章
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center py-20 text-muted-foreground">暂无分类</p>
        )}
      </main>
      <Footer />
    </div>
  );
}
