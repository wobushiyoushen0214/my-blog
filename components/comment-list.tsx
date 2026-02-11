import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Comment } from "@/lib/types";

interface CommentListProps {
  comments: Comment[];
}

const avatarColors = [
  "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export function CommentList({ comments }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground text-sm">暂无评论，来抢沙发吧！</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="flex gap-3 p-4 rounded-lg bg-muted/40 border border-transparent hover:border-border transition-colors"
        >
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className={`text-xs font-medium ${getAvatarColor(comment.author_name)}`}>
              {comment.author_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{comment.author_name}</span>
              <time className="text-xs text-muted-foreground">
                {new Date(comment.created_at).toLocaleDateString("zh-CN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </time>
            </div>
            <p className="text-sm leading-relaxed">{comment.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
