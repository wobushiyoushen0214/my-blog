"use client";

import { useState } from "react";
import type { Comment } from "@/lib/types";
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
      <div className="border-y border-border/70 py-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MessageSquare className="h-4 w-4" suppressHydrationWarning />
          <p className="text-base font-semibold text-foreground">暂无评论</p>
        </div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          成为第一个留下想法的人；提交后会先进入审核队列。
        </p>
      </div>
    );
  }

  return (
    <section>
      <div className="mb-4 flex flex-col gap-1 border-b border-border/70 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12px] text-muted-foreground">公开讨论</p>
        <p className="text-[13px] text-muted-foreground">
          {rootComments.length} 条线索 · {comments.length} 条评论
        </p>
      </div>
      <div className="divide-y divide-border/70" role="list">
        {rootComments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>
    </section>
  );
}

function CommentItem({ comment }: { comment: CommentNode }) {
  const [replying, setReplying] = useState(false);
  const initial = comment.author_name.trim().slice(0, 1).toUpperCase();
  const createdAt = new Date(comment.created_at);
  const formattedDate = createdAt.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const replyCount = comment.children.length;

  return (
    <article className="group py-5" role="listitem">
      <div className="grid gap-3 sm:grid-cols-[2rem_minmax(0,1fr)]">
        <div className="flex size-8 items-center justify-center text-xs font-medium text-muted-foreground">
          {initial}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="max-w-48 truncate text-sm font-medium text-foreground sm:max-w-none">
                {comment.author_name}
              </span>
              <time
                dateTime={comment.created_at}
                title={createdAt.toLocaleString("zh-CN")}
                className="text-[12px] text-muted-foreground"
              >
                {formattedDate}
              </time>
              {replyCount > 0 ? (
                <span className="text-[12px] text-muted-foreground/70">
                  · {replyCount} 条回复
                </span>
              ) : null}
            </div>
            <button
              type="button"
              className="inline-flex h-8 items-center justify-center gap-1.5 text-[13px] text-muted-foreground opacity-100 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
              onClick={() => setReplying(!replying)}
              aria-expanded={replying}
              aria-label={`回复 ${comment.author_name}`}
            >
              <Reply className="h-3.5 w-3.5" suppressHydrationWarning />
              回复
            </button>
          </div>
          <div className="whitespace-pre-wrap break-words text-sm leading-7 text-foreground/85">
            {comment.content}
          </div>

          {replying && (
            <div className="mt-4 border-t border-border/70 pt-4">
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
          className="mt-4 space-y-3 border-l-2 border-primary/20 pl-4 md:ml-4 md:pl-5"
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
