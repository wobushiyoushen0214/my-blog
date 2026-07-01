import Link from "next/link";
import Image from "next/image";
import { ContentRow } from "@/components/content-row";
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
  const cjkCount = text.match(/[一-鿿]/g)?.length || 0;
  const latinWordCount =
    text
      .replace(/[一-鿿]/g, " ")
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
  const showMedia = !isCompact && Boolean(post.cover_image);
  const contentTypeLabel = post.category?.type === "moment" ? "见闻" : "文章";
  const readingMinutes = estimateReadingMinutes(post);

  if (isCompact) {
    return <ContentRow post={post} />;
  }

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group flex min-w-0 overflow-hidden rounded-lg border border-border/60 bg-card transition-colors hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        isFeatured && showMedia
          ? "flex-col sm:grid sm:grid-cols-[minmax(0,1fr)_12rem]"
          : "flex-col"
      )}
    >
      {showMedia ? (
        <div
          className={cn(
            "relative w-full overflow-hidden bg-muted/30",
            isFeatured ? "order-last min-h-40 sm:order-none sm:min-h-full" : "aspect-[16/10]"
          )}
        >
          <Image
            src={post.cover_image as string}
            alt={post.title}
            fill
            sizes={
              isFeatured
                ? "(max-width: 640px) 100vw, 192px"
                : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            }
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        </div>
      ) : null}

      <div
        className={cn(
          "flex flex-1 flex-col",
          isFeatured ? "p-5 md:p-6" : "p-5"
        )}
      >
        <div className="flex-1 space-y-2.5">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
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
            <span className="text-xs text-foreground">
              {contentTypeLabel}
            </span>
            {post.category ? (
              <span className="min-w-0 truncate border-l border-border/60 pl-2 text-xs text-muted-foreground">
                {post.category.name}
              </span>
            ) : null}
          </div>
          <h2
            className={cn(
              "line-clamp-2 font-semibold leading-tight tracking-tight transition-colors group-hover:text-primary",
              isFeatured
                ? "text-xl md:text-2xl"
                : "text-lg md:text-xl"
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
          <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="max-w-36 truncate"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        ) : null}

        {isFeatured ? (
          <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
            {ctaLabel}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" suppressHydrationWarning />
          </span>
        ) : null}
      </div>
    </Link>
  );
}
