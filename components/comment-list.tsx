"use client";

import { useState } from "react";
import type { Comment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { CommentForm } from "./comment-form";

interface CommentListProps {
  comments: Comment[];
}

interface CommentNode extends Comment {
  children: CommentNode[];
}

export function CommentList({ comments }: CommentListProps) {
  // Build comment tree
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
      <p className="text-sm text-muted-foreground py-6">
        暂无评论
      </p>
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

  return (
    <div className="group">
      <div className="flex gap-3">
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{comment.author_name}</span>
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
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setReplying(!replying)}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="sr-only">回复</span>
            </Button>
          </div>
          <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
            {comment.content}
          </div>
          
          {replying && (
            <div className="mt-4 pl-4 border-l-2 border-border/50">
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

      {/* Render children recursively */}
      {comment.children.length > 0 && (
        <div className="mt-4 pl-4 md:pl-6 border-l border-border/40 space-y-6">
          {comment.children.map((child) => (
            <CommentItem key={child.id} comment={child} />
          ))}
        </div>
      )}
    </div>
  );
}
