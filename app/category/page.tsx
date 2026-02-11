import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import Link from "next/link";
import { FolderOpen, ArrowRight } from "lucide-react";
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
      <main className="flex-1 container mx-auto px-4 md:px-6 py-10">
        <div className="mb-10 max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">所有分类</h1>
          <p className="text-muted-foreground">
            按分类浏览文章，找到你感兴趣的主题
          </p>
        </div>
        {categoriesWithCount.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categoriesWithCount.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="group block rounded-xl border bg-card p-6 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="rounded-lg bg-primary/10 p-2.5 mb-4">
                    <FolderOpen className="h-5 w-5 text-primary" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h2 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
                  {category.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {category.postCount} 篇文章
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <div className="rounded-full bg-muted p-6 inline-block mb-6">
              <FolderOpen className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-xl font-semibold mb-2">暂无分类</p>
            <p className="text-muted-foreground">去后台创建第一个分类吧</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
