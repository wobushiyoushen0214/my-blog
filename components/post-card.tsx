import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowRight, CalendarDays, Eye } from "lucide-react";
import type { Post, Tag } from "@/lib/types";

interface PostCardProps {
  post: Post & { category?: { name: string; slug: string } | null; tags?: Tag[] };
  variant?: "grid" | "featured" | "compact";
  ctaLabel?: string;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatViews(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value || 0);
}

export function PostCard({
  post,
  variant = "grid",
  ctaLabel = "阅读精选文章",
}: PostCardProps) {
  const isFeatured = variant === "featured";
  const isCompact = variant === "compact";
  const showMedia = !isCompact;

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group flex min-w-0 overflow-hidden rounded-lg border border-border/60 bg-card text-card-foreground transition-colors hover:border-primary/35 hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        isFeatured
          ? "flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)]"
          : "flex-col",
        isCompact ? "p-4" : "hover-lift"
      )}
    >
      {showMedia ? (
        <div
          className={cn(
            "relative w-full overflow-hidden bg-muted",
            isFeatured ? "min-h-[260px] lg:min-h-full" : "aspect-[16/10]"
          )}
        >
          {post.cover_image ? (
            <Image
              src={post.cover_image}
              alt={post.title}
              fill
              sizes={
                isFeatured
                  ? "(max-width: 1024px) 100vw, 58vw"
                  : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              }
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full min-h-[220px] items-center justify-center p-6 text-center">
              <div className="max-w-xs space-y-2">
                <span className="inline-flex rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground">
                  {post.category?.name || "Article"}
                </span>
                <p className="line-clamp-3 text-sm font-medium leading-6 text-foreground/80">
                  {post.title}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : null}

      <div
        className={cn(
          "flex flex-1 flex-col",
          isFeatured ? "p-5 md:p-6 lg:p-7" : isCompact ? "p-0" : "p-5"
        )}
      >
        <div className="flex-1 space-y-3">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" suppressHydrationWarning />
              <time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" suppressHydrationWarning />
              {formatViews(post.view_count)} 阅读
            </span>
            {post.category ? (
              <span className="min-w-0 truncate rounded-md border bg-background px-1.5 py-0.5 font-medium text-foreground">
                {post.category.name}
              </span>
            ) : null}
          </div>
          <h2
            className={cn(
              "line-clamp-2 font-semibold tracking-tight transition-colors group-hover:text-primary",
              isFeatured
                ? "text-2xl leading-tight md:text-3xl"
                : "text-lg leading-tight"
            )}
          >
            {post.title}
          </h2>
          {post.excerpt && (
            <p
              className={cn(
                "text-sm leading-7 text-muted-foreground",
                isFeatured ? "line-clamp-4" : "line-clamp-3"
              )}
            >
              {post.excerpt}
            </p>
          )}
        </div>

        {post.tags && post.tags.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {post.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                className="h-5 rounded-md px-1.5 py-0 text-[10px] font-normal"
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        ) : null}

        {isFeatured ? (
          <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
            {ctaLabel}
            <ArrowRight className="h-4 w-4" suppressHydrationWarning />
          </span>
        ) : null}
      </div>
    </Link>
  );
}
