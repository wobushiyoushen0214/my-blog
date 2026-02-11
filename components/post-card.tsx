import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import type { Post, Tag } from "@/lib/types";

interface PostCardProps {
  post: Post & { category?: { name: string; slug: string } | null; tags?: Tag[] };
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card text-card-foreground transition-all hover:shadow-lg hover:-translate-y-1"
    >
      {post.cover_image && (
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          <Image
            src={post.cover_image}
            alt={post.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="space-y-2.5 flex-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
            <time dateTime={post.created_at}>
              {new Date(post.created_at).toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </time>
            {post.category && (
              <>
                <span className="text-border">&middot;</span>
                <span className="font-medium text-foreground/80">{post.category.name}</span>
              </>
            )}
          </div>
          <h2 className="text-lg font-semibold leading-tight tracking-tight group-hover:text-primary transition-colors">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
              {post.excerpt}
            </p>
          )}
        </div>
        
        {post.tags && post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5 pt-2 border-t border-border/40">
            {post.tags.slice(0, 3).map((tag) => (
              <Badge key={tag.id} variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-normal rounded-md bg-secondary/50 text-secondary-foreground/80 hover:bg-secondary">
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
