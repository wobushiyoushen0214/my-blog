import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">所有标签</h1>
        {tagsWithCount.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {tagsWithCount.map((tag) => (
              <Link key={tag.id} href={`/tag/${tag.slug}`}>
                <Badge
                  variant="secondary"
                  className="text-base px-4 py-2 hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {tag.name} ({tag.postCount})
                </Badge>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center py-20 text-muted-foreground">暂无标签</p>
        )}
      </main>
      <Footer />
    </div>
  );
}
