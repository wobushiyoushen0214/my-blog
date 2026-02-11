import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Hash } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "所有标签",
};

export default async function TagsPage() {
  const supabase = await createClient();

  const { data: tags } = await supabase
    .from("tags")
    .select("*")
    .order("name");

  const tagsWithCount = await Promise.all(
    (tags || []).map(async (tag) => {
      const { count } = await supabase
        .from("post_tags")
        .select("*", { count: "exact", head: true })
        .eq("tag_id", tag.id);
      return { ...tag, postCount: count || 0 };
    })
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-10">
        <div className="mb-10 max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">所有标签</h1>
          <p className="text-muted-foreground">
            通过标签快速找到相关文章
          </p>
        </div>
        {tagsWithCount.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {tagsWithCount.map((tag) => (
              <Link key={tag.id} href={`/tag/${tag.slug}`}>
                <Badge
                  variant="secondary"
                  className="text-sm px-4 py-2.5 gap-1.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:shadow-md"
                >
                  <Hash className="h-3.5 w-3.5" />
                  {tag.name}
                  <span className="ml-1 text-xs opacity-70">
                    {tag.postCount}
                  </span>
                </Badge>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <div className="rounded-full bg-muted p-6 inline-block mb-6">
              <Hash className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-xl font-semibold mb-2">暂无标签</p>
            <p className="text-muted-foreground">去后台创建标签吧</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
