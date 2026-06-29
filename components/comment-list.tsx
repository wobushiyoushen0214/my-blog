"use client";

import { useState } from "react";
import type { Comment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { MessageSquare, Reply } from "lucide-react";
import { CommentForm } from "./comment-form";

interface CommentListProps {
  comments: Comment[];
}

interface CommentNode extends Comment {
  children: CommentNode[];
}

export function CommentList({ comments }: CommentListProps) {
  const commentMap = new Map<string, CommentNode>();

  comments.forEach((comment) => {
    commentMap.set(comment.id, { ...comment, children: [] });
  });

  const rootComments: CommentNode[] = [];

  comments.forEach((comment) => {
    if (comment.parent_id && commentMap.has(comment.parent_id)) {
      const parent = commentMap.get(comment.parent_id)!;
      const child = commentMap.get(comment.id)!;
      parent.children.push(child);
    } else {
      rootComments.push(commentMap.get(comment.id)!);
    }
  });

  if (comments.length === 0) {
    return (
      <div className="border border-dashed border-border/70 bg-muted/25 px-5 py-8 text-center">
        <div className="mx-auto mb-3 flex size-9 items-center justify-center border bg-background text-muted-foreground">
          <MessageSquare className="h-4 w-4" suppressHydrationWarning />
        </div>
        <p className="text-sm font-medium">暂无评论</p>
        <p className="mt-1 text-sm text-muted-foreground">
          成为第一个留下想法的人；提交后会先进入审核队列。
        </p>
      </div>
    );
  }

  return (
    <section className="overflow-hidden border bg-card">
      <div className="flex flex-col gap-1 border-b border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          公开讨论
        </p>
        <p className="text-xs text-muted-foreground">
          {rootComments.length} 条线索 · {comments.length} 条评论
        </p>
      </div>
      <div className="divide-y divide-border/60" role="list">
        {rootComments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>
    </section>
  );
}

function CommentItem({ comment }: { comment: CommentNode }) {
  const [replying, setReplying] = useState(false);
  const initial = comment.author_name.trim().slice(0, 1).toUpperCase() || "?";
  const createdAt = new Date(comment.created_at);
  const formattedDate = createdAt.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const replyCount = comment.children.length;

  return (
    <article
      className="group px-4 py-4 transition-colors hover:bg-muted/20"
      role="listitem"
    >
      <div className="flex gap-3">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center border bg-background text-xs font-medium text-muted-foreground">
          {initial}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <span className="max-w-48 truncate text-sm font-semibold sm:max-w-none">
                {comment.author_name}
              </span>
              <time
                dateTime={comment.created_at}
                title={createdAt.toLocaleString("zh-CN")}
                className="text-xs text-muted-foreground"
              >
                {formattedDate}
              </time>
              {replyCount > 0 ? (
                <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                  {replyCount} 条回复
                </span>
              ) : null}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
              onClick={() => setReplying(!replying)}
              aria-expanded={replying}
              aria-label={`回复 ${comment.author_name}`}
            >
              <Reply className="h-3.5 w-3.5" suppressHydrationWarning />
              回复
            </Button>
          </div>
          <div className="whitespace-pre-wrap break-words text-sm leading-7 text-foreground/90">
            {comment.content}
          </div>

          {replying && (
            <div className="mt-4 border border-border/60 bg-muted/20 p-3">
              <p className="mb-3 text-xs text-muted-foreground">
                回复 {comment.author_name}
              </p>
              <CommentForm
                postId={comment.post_id}
                parentId={comment.id}
                onSuccess={() => setReplying(false)}
                onCancel={() => setReplying(false)}
                autoFocus
                compact
              />
            </div>
          )}
        </div>
      </div>

      {comment.children.length > 0 && (
        <div
          className="mt-4 border-l border-border/50 pl-4 md:ml-4 md:pl-5"
          role="list"
          aria-label={`${comment.author_name} 的回复`}
        >
          {comment.children.map((child) => (
            <CommentItem key={child.id} comment={child} />
          ))}
        </div>
      )}
    </article>
  );
}
