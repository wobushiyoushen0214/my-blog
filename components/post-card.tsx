import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Post, Tag } from "@/lib/types";

interface PostCardProps {
  post: Post & { category?: { name: string; slug: string } | null; tags?: Tag[] };
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-shadow">
      {post.cover_image && (
        <div className="overflow-hidden rounded-t-lg">
          <img
            src={post.cover_image}
            alt={post.title}
            className="h-48 w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
      )}
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <time dateTime={post.created_at}>
            {new Date(post.created_at).toLocaleDateString("zh-CN")}
          </time>
          {post.category && (
            <>
              <span>&middot;</span>
              <Link
                href={`/category/${post.category.slug}`}
                className="hover:text-foreground transition-colors"
              >
                {post.category.name}
              </Link>
            </>
          )}
          <span>&middot;</span>
          <span>{post.view_count} 阅读</span>
        </div>
        <Link href={`/blog/${post.slug}`}>
          <h2 className="text-xl font-semibold leading-tight hover:text-primary transition-colors">
            {post.title}
          </h2>
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-muted-foreground line-clamp-2">{post.excerpt}</p>
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.tags.map((tag) => (
              <Link key={tag.id} href={`/tag/${tag.slug}`}>
                <Badge variant="secondary" className="text-xs">
                  {tag.name}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
