import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Comment } from "@/lib/types";

interface CommentListProps {
  comments: Comment[];
}

export function CommentList({ comments }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">暂无评论，来抢沙发吧！</p>
    );
  }

  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="text-xs">
              {comment.author_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{comment.author_name}</span>
              <time className="text-xs text-muted-foreground">
                {new Date(comment.created_at).toLocaleDateString("zh-CN")}
              </time>
            </div>
            <p className="text-sm text-muted-foreground">{comment.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
