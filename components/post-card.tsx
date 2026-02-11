import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Post, Tag } from "@/lib/types";

interface PostCardProps {
  post: Post & { category?: { name: string; slug: string } | null; tags?: Tag[] };
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block"
    >
      {post.cover_image && (
        <div className="relative aspect-video overflow-hidden rounded-lg mb-3">
          <img
            src={post.cover_image}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        </div>
      )}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <time dateTime={post.created_at}>
            {new Date(post.created_at).toLocaleDateString("zh-CN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
          {post.category && (
            <>
              <span className="text-border">&middot;</span>
              <span>{post.category.name}</span>
            </>
          )}
        </div>
        <h2 className="text-base font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {post.excerpt}
          </p>
        )}
        {post.tags && post.tags.length > 0 && (
          <div className="flex gap-1.5 pt-1">
            {post.tags.slice(0, 3).map((tag) => (
              <Badge key={tag.id} variant="secondary" className="text-[11px] px-2 py-0 h-5 font-normal rounded-md">
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
