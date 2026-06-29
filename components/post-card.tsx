import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
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

function cleanExcerpt(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-zA-Z0-9#]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function PostCard({
  post,
  variant = "grid",
  ctaLabel = "Open Record",
}: PostCardProps) {
  const isFeatured = variant === "featured";
  const isCompact = variant === "compact";
  const showMedia = !isCompact;
  const contentTypeLabel = post.category?.type === "moment" ? "Moment" : "Article";
  const readingMinutes = estimateReadingMinutes(post);
  const excerpt = cleanExcerpt(post.excerpt || post.content || "");

  if (isCompact) {
    return (
      <Link
        href={`/blog/${post.slug}`}
        className="group grid min-w-0 gap-3 border-b border-border px-0 py-5 transition-colors last:border-b-0 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 md:grid-cols-[76px_minmax(0,1fr)_128px]"
      >
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
          {formatDate(post.created_at).slice(5).replace("/", ".")}
        </span>
        <span className="min-w-0">
          <span className="block font-serif text-2xl leading-tight transition-opacity group-hover:opacity-70">
            {post.title}
          </span>
          {excerpt ? (
            <span className="mt-2 line-clamp-2 block text-sm leading-6 text-muted-foreground">
              {excerpt}
            </span>
          ) : null}
        </span>
        <span className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground md:text-right">
          {post.category?.name || contentTypeLabel}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group grid min-w-0 overflow-hidden border border-border bg-card text-card-foreground transition-colors hover:bg-muted/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        isFeatured
          ? "lg:grid-cols-[minmax(0,0.92fr)_minmax(320px,1.08fr)]"
          : "grid-rows-[auto_1fr]"
      )}
    >
      {showMedia ? (
        <figure className="flex min-h-full flex-col border-b border-border bg-muted lg:border-b-0 lg:border-r">
          <div
            className={cn(
              "relative min-h-[260px] flex-1 overflow-hidden",
              isFeatured ? "lg:min-h-[420px]" : "aspect-[16/10]"
            )}
          >
            {post.cover_image ? (
              <Image
                src={post.cover_image}
                alt={post.title}
                fill
                sizes={
                  isFeatured
                    ? "(max-width: 1024px) 100vw, 46vw"
                    : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                }
                className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              />
            ) : (
              <div className="flex h-full min-h-[260px] items-center justify-center p-6 text-center">
                <div>
                  <p className="font-serif text-4xl leading-none">{contentTypeLabel}</p>
                  <p className="mt-3 font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    No plate attached
                  </p>
                </div>
              </div>
            )}
          </div>
          <figcaption className="grid grid-cols-[1fr_auto] border-t border-border px-4 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            <span className="min-w-0 truncate">
              {post.category?.name || contentTypeLabel}
            </span>
            <span>{formatViews(post.view_count)} reads</span>
          </figcaption>
        </figure>
      ) : null}

      <div className={cn("flex flex-col", isFeatured ? "p-6 md:p-8" : "p-5")}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
          <time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
          <span>{readingMinutes} min</span>
          <span>{contentTypeLabel}</span>
        </div>

        <h2
          className={cn(
            "mt-5 font-serif leading-none transition-opacity group-hover:opacity-70",
            isFeatured ? "text-4xl md:text-6xl" : "text-3xl"
          )}
        >
          {post.title}
        </h2>

        {excerpt ? (
          <p
            className={cn(
              "mt-5 text-sm leading-7 text-muted-foreground",
              isFeatured ? "line-clamp-5 max-w-xl" : "line-clamp-3"
            )}
          >
            {excerpt}
          </p>
        ) : null}

        {post.tags && post.tags.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-x-3 gap-y-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            {post.tags.slice(0, 4).map((tag) => (
              <span key={tag.id}>#{tag.name}</span>
            ))}
          </div>
        ) : null}

        {isFeatured ? (
          <span className="mt-auto pt-8 font-mono text-xs uppercase tracking-[0.16em]">
            {ctaLabel}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
