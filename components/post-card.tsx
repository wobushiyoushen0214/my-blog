import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowRight, CalendarDays, Clock3, Eye } from "lucide-react";
import type { Category, Post, Tag } from "@/lib/types";

interface PostCardProps {
  post: Post & {
    category?: Pick<Category, "name" | "slug" | "type"> | null;
    tags?: Tag[];
  };
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

function estimateReadingMinutes(post: Pick<Post, "title" | "content" | "excerpt">) {
  const source = post.content || post.excerpt || post.title;
  const text = source
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-zA-Z0-9#]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const cjkCount = text.match(/[\u4e00-\u9fff]/g)?.length || 0;
  const latinWordCount =
    text
      .replace(/[\u4e00-\u9fff]/g, " ")
      .match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g)?.length || 0;

  return Math.max(1, Math.ceil(cjkCount / 450 + latinWordCount / 220));
}

export function PostCard({
  post,
  variant = "grid",
  ctaLabel = "阅读精选文章",
}: PostCardProps) {
  const isFeatured = variant === "featured";
  const isCompact = variant === "compact";
  const showMedia = !isCompact;
  const contentTypeLabel = post.category?.type === "moment" ? "见闻" : "文章";
  const readingMinutes = estimateReadingMinutes(post);

  if (isCompact) {
    return (
      <Link
        href={`/blog/${post.slug}`}
        className="group grid min-w-0 gap-3 border border-border/70 bg-card px-4 py-3 text-card-foreground transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:grid-cols-[6.5rem_minmax(0,1fr)_7rem]"
      >
        <div className="text-xs tabular-nums text-muted-foreground">
          <time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
        </div>

        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="border border-border/70 bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {contentTypeLabel}
            </span>
            {post.category ? (
              <span className="max-w-36 truncate border border-border/70 bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {post.category.name}
              </span>
            ) : null}
          </div>
          <h2 className="mt-2 line-clamp-2 font-serif text-xl leading-tight tracking-normal transition-opacity group-hover:opacity-70">
            {post.title}
          </h2>
          {post.excerpt ? (
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
              {post.excerpt}
            </p>
          ) : null}
          {post.tags && post.tags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {post.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="h-5 rounded-sm px-1.5 py-0 text-[10px] font-normal text-muted-foreground"
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-start gap-x-3 gap-y-1 text-xs text-muted-foreground sm:block sm:text-right">
          <span className="block">{formatViews(post.view_count)} 阅读</span>
          <span className="block sm:mt-1">约 {readingMinutes} 分钟</span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group flex min-w-0 overflow-hidden border border-border/70 bg-card text-card-foreground transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        isFeatured
          ? "flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)]"
          : "flex-col",
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
            <div className="flex h-full min-h-[220px] items-end bg-muted/20 p-5">
              <div className="max-w-xs border-t border-border/70 pt-3">
                <span className="inline-flex border bg-background px-2 py-1 text-xs text-muted-foreground">
                  {post.category?.name || contentTypeLabel}
                </span>
                <p className="mt-3 line-clamp-3 font-serif text-lg leading-snug text-foreground/80">
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
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5" suppressHydrationWarning />
              约 {readingMinutes} 分钟
            </span>
            <span
              className={cn(
                "border px-1.5 py-0.5 font-medium",
                post.category?.type === "moment"
                  ? "border-border/70 bg-muted/50 text-foreground"
                  : "border-border/70 bg-background text-foreground"
              )}
            >
              {contentTypeLabel}
            </span>
            {post.category ? (
              <span className="min-w-0 truncate border bg-background px-1.5 py-0.5 font-medium text-foreground">
                {post.category.name}
              </span>
            ) : null}
          </div>
          <h2
            className={cn(
              "line-clamp-2 font-serif leading-tight tracking-normal transition-opacity group-hover:opacity-70",
              isFeatured
                ? "text-3xl md:text-4xl"
                : "text-xl"
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
                className="h-5 rounded-sm px-1.5 py-0 text-[10px] font-normal"
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        ) : null}

        {isFeatured ? (
          <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
            {ctaLabel}
            <ArrowRight className="h-4 w-4" suppressHydrationWarning />
          </span>
        ) : null}
      </div>
    </Link>
  );
}
