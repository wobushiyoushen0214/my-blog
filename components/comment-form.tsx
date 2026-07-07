"use client";

import { useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Send } from "lucide-react";

interface CommentFormProps {
  postId: string;
  parentId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  autoFocus?: boolean;
  compact?: boolean;
}

type CommentFormState = {
  author_name: string;
  author_email: string;
  content: string;
};

type CommentFormErrors = Partial<Record<keyof CommentFormState | "form", string>>;

const NAME_MAX_LENGTH = 32;
const EMAIL_MAX_LENGTH = 120;
const CONTENT_MIN_LENGTH = 2;
const CONTENT_MAX_LENGTH = 1000;

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function CommentForm({
  postId,
  parentId,
  onSuccess,
  onCancel,
  autoFocus,
  compact,
}: CommentFormProps) {
  const formId = useId();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<CommentFormErrors>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [form, setForm] = useState<CommentFormState>({
    author_name: "",
    author_email: "",
    content: "",
  });
  const contentLength = form.content.trim().length;
  const isReply = Boolean(parentId);

  const ids = {
    name: `${formId}-name`,
    email: `${formId}-email`,
    content: `${formId}-content`,
    nameError: `${formId}-name-error`,
    emailError: `${formId}-email-error`,
    contentError: `${formId}-content-error`,
    formStatus: `${formId}-status`,
  };

  const updateField = (field: keyof CommentFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setSuccessMessage("");
    setErrors((current) => {
      if (!current[field] && !current.form) return current;
      const next = { ...current };
      delete next[field];
      delete next.form;
      return next;
    });
  };

  const validateForm = () => {
    const nextErrors: CommentFormErrors = {};
    const name = form.author_name.trim();
    const email = form.author_email.trim();
    const content = form.content.trim();

    if (!name) {
      nextErrors.author_name = "请填写昵称。";
    } else if (name.length > NAME_MAX_LENGTH) {
      nextErrors.author_name = `昵称最多 ${NAME_MAX_LENGTH} 个字符。`;
    }

    if (email && !isValidEmail(email)) {
      nextErrors.author_email = "请填写有效邮箱，或留空。";
    } else if (email.length > EMAIL_MAX_LENGTH) {
      nextErrors.author_email = `邮箱最多 ${EMAIL_MAX_LENGTH} 个字符。`;
    }

    if (!content) {
      nextErrors.content = "请填写评论内容。";
    } else if (content.length < CONTENT_MIN_LENGTH) {
      nextErrors.content = `评论至少 ${CONTENT_MIN_LENGTH} 个字符。`;
    } else if (content.length > CONTENT_MAX_LENGTH) {
      nextErrors.content = `评论最多 ${CONTENT_MAX_LENGTH} 个字符。`;
    }

    return nextErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");

    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error("请检查评论表单");
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
      setErrors({ form: "评论提交失败，请稍后再试。" });
      toast.error("评论提交失败");
      return;
    }

    toast.success("评论已提交，等待审核");
    setForm({ author_name: "", author_email: "", content: "" });
    setErrors({});
    setSuccessMessage("评论已提交，审核通过后会展示在页面中。");
    onSuccess?.();
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={cn(
        "py-1",
        compact && "bg-transparent py-0"
      )}
    >
      {!isReply ? (
        <div className="py-3">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">
              发表评论
            </h3>
            <p className="text-sm text-muted-foreground">
              评论提交后会进入审核队列，通过后展示在页面中。
            </p>
          </div>
        </div>
      ) : (
        <div className="pb-3">
          <p className="text-sm text-muted-foreground">
            回复会进入审核队列，通过后展示在对应评论下。
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2 py-3">
          <Label
            htmlFor={ids.name}
            className="text-sm font-medium text-foreground"
          >
            昵称 *
          </Label>
          <Input
            id={ids.name}
            value={form.author_name}
            onChange={(e) => updateField("author_name", e.target.value)}
            placeholder="你的昵称"
            className="h-10 border-border/80 bg-background transition-colors hover:bg-muted/30 focus-visible:bg-background"
            autoFocus={autoFocus}
            disabled={loading}
            maxLength={NAME_MAX_LENGTH}
            aria-invalid={Boolean(errors.author_name)}
            aria-describedby={errors.author_name ? ids.nameError : undefined}
            required
          />
          {errors.author_name ? (
            <p id={ids.nameError} className="text-xs text-destructive">
              {errors.author_name}
            </p>
          ) : null}
        </div>
        <div className="space-y-2 py-3">
          <Label
            htmlFor={ids.email}
            className="text-sm font-medium text-foreground"
          >
            邮箱（选填）
          </Label>
          <Input
            id={ids.email}
            type="email"
            value={form.author_email}
            onChange={(e) => updateField("author_email", e.target.value)}
            placeholder="you@example.com"
            className="h-10 border-border/80 bg-background transition-colors hover:bg-muted/30 focus-visible:bg-background"
            disabled={loading}
            maxLength={EMAIL_MAX_LENGTH}
            aria-invalid={Boolean(errors.author_email)}
            aria-describedby={errors.author_email ? ids.emailError : undefined}
          />
          {errors.author_email ? (
            <p id={ids.emailError} className="text-xs text-destructive">
              {errors.author_email}
            </p>
          ) : null}
        </div>
      </div>
      <div className="space-y-2 py-3">
        <Label
          htmlFor={ids.content}
          className="text-sm font-medium text-foreground"
        >
          评论内容 *
        </Label>
        <Textarea
          id={ids.content}
          value={form.content}
          onChange={(e) => updateField("content", e.target.value)}
          placeholder="写下你的想法..."
          rows={isReply ? 3 : 4}
          className="resize-none border-border/80 bg-background transition-colors hover:bg-muted/30 focus-visible:bg-background"
          disabled={loading}
          maxLength={CONTENT_MAX_LENGTH}
          aria-invalid={Boolean(errors.content)}
          aria-describedby={errors.content ? ids.contentError : ids.formStatus}
          required
        />
        {errors.content ? (
          <p id={ids.contentError} className="text-xs text-destructive">
            {errors.content}
          </p>
        ) : null}
        <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>请保持具体、友善，支持换行；提交后需要审核。</span>
          <span
            className={
              contentLength > CONTENT_MAX_LENGTH * 0.9
                ? "text-destructive"
                : undefined
            }
          >
            {contentLength} / {CONTENT_MAX_LENGTH}
          </span>
        </div>
      </div>

      <div className="grid gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div id={ids.formStatus} aria-live="polite" className="min-h-5">
          {errors.form ? (
            <p className="text-sm text-destructive">{errors.form}</p>
          ) : successMessage ? (
            <p className="text-sm text-foreground">{successMessage}</p>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {onCancel && (
            <button
              type="button"
              disabled={loading}
              className="inline-flex h-9 items-center justify-center border border-border bg-background px-3 font-mono text-sm text-muted-foreground shadow-[2px_2px_0_var(--terminal-shadow)] transition-colors hover:border-primary hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
            >
              取消
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-9 items-center justify-center gap-2 border border-primary bg-primary px-3 font-mono text-sm font-medium text-primary-foreground shadow-[2px_2px_0_var(--terminal-shadow)] transition-colors hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
          >
            <Send className="h-4 w-4" suppressHydrationWarning />
            {loading ? "提交中..." : isReply ? "提交回复" : "提交评论"}
          </button>
        </div>
      </div>
    </form>
  );
}
