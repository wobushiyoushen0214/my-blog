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
      <div className="rounded-lg border border-dashed border-border/70 bg-muted/25 px-5 py-8 text-center">
        <div className="mx-auto mb-3 flex size-9 items-center justify-center rounded-md border bg-background text-muted-foreground">
          <MessageSquare className="h-4 w-4" suppressHydrationWarning />
        </div>
        <p className="text-sm font-medium">暂无评论</p>
        <p className="mt-1 text-sm text-muted-foreground">
          成为第一个留下想法的人。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {rootComments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </div>
  );
}

function CommentItem({ comment }: { comment: CommentNode }) {
  const [replying, setReplying] = useState(false);
  const initial = comment.author_name.trim().slice(0, 1).toUpperCase() || "?";

  return (
    <article className="group rounded-lg border border-transparent p-2 transition-colors hover:border-border/60 hover:bg-muted/20">
      <div className="flex gap-3">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border bg-background text-xs font-medium text-muted-foreground">
          {initial}
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <span className="truncate text-sm font-semibold">
                {comment.author_name}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(comment.created_at).toLocaleDateString("zh-CN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
              onClick={() => setReplying(!replying)}
              aria-expanded={replying}
            >
              <Reply className="h-3.5 w-3.5" suppressHydrationWarning />
              回复
            </Button>
          </div>
          <div className="whitespace-pre-wrap text-sm leading-7 text-foreground/90">
            {comment.content}
          </div>

          {replying && (
            <div className="mt-4 border-l-2 border-border/50 pl-4">
              <CommentForm
                postId={comment.post_id}
                parentId={comment.id}
                onSuccess={() => setReplying(false)}
                onCancel={() => setReplying(false)}
                autoFocus
              />
            </div>
          )}
        </div>
      </div>

      {comment.children.length > 0 && (
        <div className="mt-4 space-y-4 border-l border-border/40 pl-5 md:ml-4 md:pl-6">
          {comment.children.map((child) => (
            <CommentItem key={child.id} comment={child} />
          ))}
        </div>
      )}
    </article>
  );
}
