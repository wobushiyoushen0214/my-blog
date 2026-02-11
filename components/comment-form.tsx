"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

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
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold">发表评论</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="author_name">昵称 *</Label>
          <Input
            id="author_name"
            value={form.author_name}
            onChange={(e) => setForm({ ...form, author_name: e.target.value })}
            placeholder="你的昵称"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="author_email">邮箱</Label>
          <Input
            id="author_email"
            type="email"
            value={form.author_email}
            onChange={(e) => setForm({ ...form, author_email: e.target.value })}
            placeholder="你的邮箱（不会公开）"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="content">评论 *</Label>
        <Textarea
          id="content"
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          placeholder="写下你的评论..."
          rows={4}
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "提交中..." : "提交评论"}
      </Button>
    </form>
  );
}
