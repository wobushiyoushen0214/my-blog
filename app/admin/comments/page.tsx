"use client";

import { useEffect, useState } from "react";
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
import { Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Comment } from "@/lib/types";

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<(Comment & { post?: { title: string } })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("comments")
      .select("*, post:posts(title)")
      .order("created_at", { ascending: false });
    setComments(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const handleApprove = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("comments")
      .update({ approved: true })
      .eq("id", id);

    if (error) {
      toast.error("操作失败");
      return;
    }

    toast.success("评论已审核通过");
    fetchComments();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这条评论吗？")) return;

    const supabase = createClient();
    const { error } = await supabase.from("comments").delete().eq("id", id);

    if (error) {
      toast.error("删除失败");
      return;
    }

    toast.success("评论已删除");
    fetchComments();
  };

  if (loading) {
    return <div className="text-muted-foreground">加载中...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">评论管理</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>评论者</TableHead>
            <TableHead>内容</TableHead>
            <TableHead>文章</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>时间</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {comments.map((comment: any) => (
            <TableRow key={comment.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{comment.author_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {comment.author_email}
                  </div>
                </div>
              </TableCell>
              <TableCell className="max-w-xs truncate">
                {comment.content}
              </TableCell>
              <TableCell className="max-w-[150px] truncate">
                {comment.post?.title || "-"}
              </TableCell>
              <TableCell>
                <Badge variant={comment.approved ? "default" : "secondary"}>
                  {comment.approved ? "已审核" : "待审核"}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(comment.created_at).toLocaleDateString("zh-CN")}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  {!comment.approved && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleApprove(comment.id)}
                    >
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(comment.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {comments.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground py-8"
              >
                暂无评论
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
