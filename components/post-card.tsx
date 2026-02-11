import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Post, Tag } from "@/lib/types";
import { Calendar, Eye } from "lucide-react";

interface PostCardProps {
  post: Post & { category?: { name: string; slug: string } | null; tags?: Tag[] };
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block rounded-xl border bg-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
    >
      {post.cover_image ? (
        <div className="relative h-48 overflow-hidden">
          <img
            src={post.cover_image}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          {post.category && (
            <Badge className="absolute top-3 left-3 text-xs font-normal bg-white/90 text-black hover:bg-white/90 border-0">
              {post.category.name}
            </Badge>
          )}
        </div>
      ) : (
        <div className="relative h-32 bg-gradient-to-br from-primary/5 via-accent/5 to-muted flex items-center justify-center">
          {post.category && (
            <Badge variant="secondary" className="absolute top-3 left-3 text-xs font-normal">
              {post.category.name}
            </Badge>
          )}
        </div>
      )}
      <div className="p-5 space-y-3">
        <h2 className="text-lg font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {post.excerpt}
          </p>
        )}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(post.created_at).toLocaleDateString("zh-CN")}
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {post.view_count}
            </span>
          </div>
          {post.tags && post.tags.length > 0 && (
            <div className="flex gap-1">
              {post.tags.slice(0, 2).map((tag) => (
                <Badge key={tag.id} variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal">
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
