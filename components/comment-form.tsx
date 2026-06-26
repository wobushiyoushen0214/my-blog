"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Send } from "lucide-react";

interface CommentFormProps {
  postId: string;
  parentId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}

export function CommentForm({
  postId,
  parentId,
  onSuccess,
  onCancel,
  autoFocus,
}: CommentFormProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    author_name: "",
    author_email: "",
    content: "",
  });
  const contentLength = form.content.trim().length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.author_name.trim() || !form.content.trim()) {
      toast.error("请填写昵称和评论内容");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      parent_id: parentId || null,
      author_name: form.author_name.trim(),
      author_email: form.author_email.trim(),
      content: form.content.trim(),
    });

    setLoading(false);

    if (error) {
      toast.error("评论提交失败");
      return;
    }

    toast.success("评论已提交，等待审核");
    setForm({ author_name: "", author_email: "", content: "" });
    onSuccess?.();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-border/60 bg-card p-4"
    >
      {!parentId ? (
        <div className="space-y-1">
          <h3 className="text-base font-medium">发表评论</h3>
          <p className="text-sm text-muted-foreground">
            评论提交后会进入审核队列，通过后展示在页面中。
          </p>
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={parentId ? `reply-name-${parentId}` : "comment-name"}>
            昵称 *
          </Label>
          <Input
            id={parentId ? `reply-name-${parentId}` : "comment-name"}
            value={form.author_name}
            onChange={(e) => setForm({ ...form, author_name: e.target.value })}
            placeholder="你的昵称"
            className="h-10 border-border/60 bg-muted/30"
            autoFocus={autoFocus}
            disabled={loading}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={parentId ? `reply-email-${parentId}` : "comment-email"}>
            邮箱（选填）
          </Label>
          <Input
            id={parentId ? `reply-email-${parentId}` : "comment-email"}
            type="email"
            value={form.author_email}
            onChange={(e) => setForm({ ...form, author_email: e.target.value })}
            placeholder="you@example.com"
            className="h-10 border-border/60 bg-muted/30"
            disabled={loading}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={parentId ? `reply-content-${parentId}` : "comment-content"}>
          评论内容 *
        </Label>
        <Textarea
          id={parentId ? `reply-content-${parentId}` : "comment-content"}
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          placeholder="写下你的想法..."
          rows={parentId ? 3 : 4}
          className="resize-none border-border/60 bg-muted/30"
          disabled={loading}
          required
        />
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>请保持具体、友善，支持换行。</span>
          <span>{contentLength} 字</span>
        </div>
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={loading}
            size="sm"
          >
            取消
          </Button>
        )}
        <Button type="submit" disabled={loading} size="sm">
          <Send className="h-4 w-4" suppressHydrationWarning />
          {loading ? "提交中..." : parentId ? "提交回复" : "提交评论"}
        </Button>
      </div>
    </form>
  );
}
