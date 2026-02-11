"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
      <h3 className="text-sm font-medium">发表评论</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          value={form.author_name}
          onChange={(e) => setForm({ ...form, author_name: e.target.value })}
          placeholder="昵称 *"
          className="h-10 bg-muted/50 border-border/50"
        />
        <Input
          type="email"
          value={form.author_email}
          onChange={(e) => setForm({ ...form, author_email: e.target.value })}
          placeholder="邮箱（选填）"
          className="h-10 bg-muted/50 border-border/50"
        />
      </div>
      <Textarea
        value={form.content}
        onChange={(e) => setForm({ ...form, content: e.target.value })}
        placeholder="写下你的想法..."
        rows={3}
        className="resize-none bg-muted/50 border-border/50"
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={loading} size="sm">
          {loading ? "提交中..." : "提交"}
        </Button>
      </div>
    </form>
  );
}
