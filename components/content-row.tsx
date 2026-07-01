import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Category, Post, Tag } from "@/lib/types";

type ContentRowPost = Pick<
  Post,
  "title" | "slug" | "excerpt" | "created_at" | "updated_at" | "view_count"
> & {
  content?: Post["content"] | null;
  category?: Pick<Category, "name" | "slug" | "type"> | null;
  tags?: Pick<Tag, "id" | "name" | "slug">[];
};

type ContentRowProps = {
  post: ContentRowPost;
  dateLabel?: string;
  dateTime?: string;
  typeLabel?: string;
  meta?: string[];
  rightMeta?: string[];
  showTags?: boolean;
  className?: string;
};

function stripHtml(value?: string | null) {
  return (value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-zA-Z0-9#]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

function estimateReadingMinutes(
  post: Pick<ContentRowPost, "title" | "content" | "excerpt">
) {
  const source = post.content || post.excerpt || post.title;
  const text = stripHtml(source);
  const cjkCount = text.match(/[一-鿿]/g)?.length || 0;
  const latinWordCount =
    text
      .replace(/[一-鿿]/g, " ")
      .match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g)?.length || 0;

  return Math.max(1, Math.ceil(cjkCount / 450 + latinWordCount / 220));
}

function getTypeLabel(post: ContentRowPost) {
  return post.category?.type === "moment" ? "见闻" : "文章";
}

export function ContentRow({
  post,
  dateLabel,
  dateTime,
  typeLabel,
  meta,
  rightMeta,
  showTags = true,
  className,
}: ContentRowProps) {
  const cleanExcerpt = stripHtml(post.excerpt || "");
  const displayType = typeLabel || getTypeLabel(post);
  const displayDate = dateLabel || formatDate(post.created_at);
  const displayMeta = meta || [
    displayType,
    ...(post.category?.name ? [post.category.name] : []),
  ];
  const displayRightMeta =
    rightMeta ||
    [
      `${formatViews(post.view_count)} 阅读`,
      `约 ${estimateReadingMinutes(post)} 分钟`,
    ];
  const visibleTags = showTags ? post.tags?.slice(0, 4) || [] : [];

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group grid min-w-0 gap-3 border-b border-border/60 py-4 transition-colors hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:grid-cols-[6rem_minmax(0,1fr)_7rem]",
        className
      )}
    >
      <time
        dateTime={dateTime || post.created_at}
        className="text-xs tabular-nums text-muted-foreground sm:pt-1"
      >
        {displayDate}
      </time>

      <span className="min-w-0">
        <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {displayMeta.map((item, index) => (
            <span key={`${item}-${index}`} className="min-w-0 truncate">
              {item}
            </span>
          ))}
        </span>

        <span className="mt-1.5 block line-clamp-2 text-base font-semibold leading-6 tracking-tight transition-colors group-hover:text-primary md:text-lg">
          {post.title}
        </span>

        {cleanExcerpt ? (
          <span className="mt-1.5 block line-clamp-2 text-sm leading-6 text-muted-foreground">
            {cleanExcerpt}
          </span>
        ) : null}

        {visibleTags.length > 0 ? (
          <span className="mt-3 flex min-w-0 flex-wrap gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
            {visibleTags.map((tag) => (
              <span key={tag.id} className="max-w-36 truncate underline-offset-4 group-hover:underline">
                #{tag.name}
              </span>
            ))}
          </span>
        ) : null}
      </span>

      <span className="flex flex-wrap items-start gap-x-3 gap-y-1 text-xs text-muted-foreground sm:block sm:text-right">
        {displayRightMeta.map((item, index) => (
          <span key={`${item}-${index}`} className="block sm:mt-1 first:sm:mt-0">
            {item}
          </span>
        ))}
      </span>
    </Link>
  );
}
