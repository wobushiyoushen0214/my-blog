import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, FolderOpen, Tags, MessageSquare, Eye } from "lucide-react";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    { count: postCount },
    { count: publishedCount },
    { count: categoryCount },
    { count: tagCount },
    { count: commentCount },
    { count: pendingCommentCount },
  ] = await Promise.all([
    supabase.from("posts").select("*", { count: "exact", head: true }),
    supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("published", true),
    supabase.from("categories").select("*", { count: "exact", head: true }),
    supabase.from("tags").select("*", { count: "exact", head: true }),
    supabase.from("comments").select("*", { count: "exact", head: true }),
    supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("approved", false),
  ]);

  // Total views
  const { data: viewsData } = await supabase
    .from("posts")
    .select("view_count");
  const totalViews = (viewsData || []).reduce(
    (sum, p) => sum + (p.view_count || 0),
    0
  );

  const stats = [
    {
      title: "总文章数",
      value: postCount || 0,
      sub: `${publishedCount || 0} 已发布`,
      icon: FileText,
    },
    { title: "总分类", value: categoryCount || 0, icon: FolderOpen },
    { title: "总标签", value: tagCount || 0, icon: Tags },
    {
      title: "总评论",
      value: commentCount || 0,
      sub: `${pendingCommentCount || 0} 待审核`,
      icon: MessageSquare,
    },
    { title: "总阅读量", value: totalViews, icon: Eye },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.sub && (
                <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
