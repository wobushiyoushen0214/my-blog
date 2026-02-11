"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Send } from "lucide-react";

interface CommentFormProps {
  postId: string;
}

export function CommentForm({ postId }: CommentFormProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    author_name: "",
    author_email: "",
    content: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.author_name || !form.content) {
      toast.error("请填写昵称和评论内容");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      author_name: form.author_name,
      author_email: form.author_email,
      content: form.content,
    });

    setLoading(false);

    if (error) {
      toast.error("评论提交失败");
      return;
    }

    toast.success("评论已提交，等待审核");
    setForm({ author_name: "", author_email: "", content: "" });
  };

  return (
    <Card className="border-dashed">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="text-lg font-semibold">发表评论</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="author_name" className="text-sm">
                昵称 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="author_name"
                value={form.author_name}
                onChange={(e) => setForm({ ...form, author_name: e.target.value })}
                placeholder="你的昵称"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author_email" className="text-sm">
                邮箱 <span className="text-muted-foreground text-xs">(选填)</span>
              </Label>
              <Input
                id="author_email"
                type="email"
                value={form.author_email}
                onChange={(e) => setForm({ ...form, author_email: e.target.value })}
                placeholder="不会公开显示"
                className="h-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="content" className="text-sm">
              评论 <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="content"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="写下你的想法..."
              rows={4}
              className="resize-none"
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={loading} className="gap-2">
              <Send className="h-4 w-4" />
              {loading ? "提交中..." : "提交评论"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
