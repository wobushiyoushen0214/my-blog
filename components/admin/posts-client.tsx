"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Post } from "@/lib/types";

type PostRow = Post & { category?: { name: string } | null };

export function AdminPostsClient({ initialPosts }: { initialPosts: PostRow[] }) {
  const [posts, setPosts] = useState<PostRow[]>(initialPosts);

  const fetchPosts = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("posts")
      .select("*, category:categories(name)")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("加载失败: " + error.message);
      return;
    }

    setPosts((data || []) as PostRow[]);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这篇文章吗？")) return;

    const supabase = createClient();
    await supabase.from("post_tags").delete().eq("post_id", id);
    const { error } = await supabase.from("posts").delete().eq("id", id);

    if (error) {
      toast.error("删除失败: " + error.message);
      return;
    }

    toast.success("文章已删除");
    await fetchPosts();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">文章管理</h1>
        <Button asChild>
          <Link href="/admin/posts/new">
            <Plus className="h-4 w-4 mr-2" />
            新建文章
          </Link>
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>标题</TableHead>
            <TableHead>分类</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>阅读量</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post) => (
            <TableRow key={post.id}>
              <TableCell className="font-medium max-w-xs truncate">
                {post.title}
              </TableCell>
              <TableCell>{post.category?.name || "-"}</TableCell>
              <TableCell>
                <Badge variant={post.published ? "default" : "secondary"}>
                  {post.published ? "已发布" : "草稿"}
                </Badge>
              </TableCell>
              <TableCell>{post.view_count}</TableCell>
              <TableCell>
                {new Date(post.created_at).toLocaleDateString("zh-CN")}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/admin/posts/${post.id}/edit`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(post.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {posts.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground py-8"
              >
                暂无文章，点击“新建文章”开始创作
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
