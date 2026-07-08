import Link from "next/link";
import { Calendar, Clock, Eye, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category, Post, Tag } from "@/lib/types";

type ContentRowPost = Pick<
  Post,
  | "title"
  | "slug"
  | "excerpt"
  | "created_at"
  | "updated_at"
  | "view_count"
> & {
  cover_image?: Post["cover_image"];
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
  const readMinutes = estimateReadingMinutes(post);
  const coverImage = post.cover_image?.trim();

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "content-row-link narrative-article-card group relative flex min-w-0 flex-col overflow-hidden rounded-md border border-neutral-200 bg-white p-5 transition-all duration-300 hover:border-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:border-[#262626] dark:bg-neutral-900/10 dark:hover:border-neutral-700",
        className
      )}
    >
      <span
        className="narrative-media-slot relative mb-4 block aspect-[16/10] overflow-hidden rounded-sm bg-neutral-100 dark:bg-neutral-900"
        style={
          coverImage
            ? { backgroundImage: `url("${coverImage.replace(/"/g, '\\"')}")` }
            : undefined
        }
        aria-label={coverImage ? post.title : undefined}
      >
        {coverImage ? (
          <span className="absolute inset-0 bg-neutral-950/10 transition-colors duration-500 group-hover:bg-transparent" />
        ) : (
          <span className="absolute inset-0 flex flex-col justify-between p-4">
            <span className="font-mono text-[8px] font-bold uppercase tracking-[0.25em] text-neutral-400">
              leempty
            </span>
            <span className="max-w-[8rem] font-serif text-xl italic leading-tight text-neutral-500 dark:text-neutral-400">
              {displayType}
            </span>
          </span>
        )}
        <span className="absolute right-3 top-3 border border-neutral-200 bg-neutral-100 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
          {displayType}
        </span>
      </span>

      <span className="mb-2.5 flex items-center justify-between gap-3">
        <span className="flex min-w-0 flex-wrap gap-1.5">
          {visibleTags.length > 0
            ? visibleTags.slice(0, 2).map((tag) => (
                <span
                  key={tag.id}
                  className="max-w-24 truncate font-mono text-[9px] text-neutral-400 dark:text-neutral-500"
                >
                  #{tag.name.toLowerCase()}
                </span>
              ))
            : displayMeta.slice(0, 2).map((item, index) => (
                <span
                  key={`${item}-${index}`}
                  className="max-w-24 truncate font-mono text-[9px] text-neutral-400 dark:text-neutral-500"
                >
                  #{item.toLowerCase()}
                </span>
              ))}
        </span>
        <time
          dateTime={dateTime || post.created_at}
          className="flex shrink-0 items-center gap-1 font-mono text-[9px] text-neutral-400 dark:text-neutral-500"
        >
          <Calendar className="h-3 w-3" suppressHydrationWarning />
          {displayDate}
        </time>
      </span>

      <span className="min-w-0 flex-1">
        <span className="mb-2 block font-serif text-lg font-light italic leading-tight text-slate-950 transition-colors duration-300 group-hover:text-slate-800 dark:text-white dark:group-hover:text-neutral-200">
          {post.title}
        </span>

        {cleanExcerpt ? (
          <span className="line-clamp-2 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
            {cleanExcerpt}
          </span>
        ) : null}
      </span>

      <span className="my-3.5 block border-t border-neutral-100 dark:border-[#262626]" />

      <span className="flex items-center justify-between">
        <span className="flex items-center gap-3 font-mono text-[9px] text-neutral-400 dark:text-neutral-500">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" suppressHydrationWarning />
            <span>{readMinutes}m read</span>
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" suppressHydrationWarning />
            <span>{formatViews(post.view_count)}</span>
          </span>
          <span className="flex items-center gap-1">
            <Heart
              className="h-3.5 w-3.5 text-neutral-400 transition-colors group-hover:text-rose-500"
              suppressHydrationWarning
            />
            <span>{displayRightMeta[0]?.replace(/\D/g, "") || 0}</span>
          </span>
        </span>
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 text-neutral-400 transition-colors group-hover:bg-neutral-950 group-hover:text-white dark:border-neutral-800 dark:text-neutral-500 dark:group-hover:bg-white dark:group-hover:text-black">
          <span className="h-3 w-3 bg-current [clip-path:polygon(20%_0,80%_0,80%_100%,50%_78%,20%_100%)]" />
        </span>
      </span>
    </Link>
  );
}
