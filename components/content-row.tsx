import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
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
  /** card = cover tile; index = magazine list row; stream = denser moment line */
  variant?: "card" | "index" | "stream";
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
  variant = "index",
  className,
}: ContentRowProps) {
  const cleanExcerpt = stripHtml(post.excerpt || "");
  const displayType = typeLabel || getTypeLabel(post);
  const displayDate = dateLabel || formatDate(post.created_at);
  const displayMeta = meta || [
    displayType,
    ...(post.category?.name ? [post.category.name] : []),
  ];
  const visibleTags = showTags ? post.tags?.slice(0, 3) || [] : [];
  const readMinutes = estimateReadingMinutes(post);
  const coverImage = post.cover_image?.trim();
  const footMeta =
    rightMeta && rightMeta.length > 0
      ? rightMeta
      : [`${readMinutes}m`, `${formatViews(post.view_count)} 阅读`];

  if (variant === "card") {
    return (
      <CardVariant
        post={post}
        cleanExcerpt={cleanExcerpt}
        displayType={displayType}
        displayDate={displayDate}
        dateTime={dateTime}
        visibleTags={visibleTags}
        displayMeta={displayMeta}
        footMeta={footMeta}
        coverImage={coverImage}
        className={className}
      />
    );
  }

  if (variant === "stream") {
    return (
      <StreamVariant
        post={post}
        cleanExcerpt={cleanExcerpt}
        displayDate={displayDate}
        dateTime={dateTime}
        displayMeta={displayMeta}
        visibleTags={visibleTags}
        footMeta={footMeta}
        className={className}
      />
    );
  }

  return (
    <IndexVariant
      post={post}
      cleanExcerpt={cleanExcerpt}
      displayType={displayType}
      displayDate={displayDate}
      dateTime={dateTime}
      displayMeta={displayMeta}
      visibleTags={visibleTags}
      footMeta={footMeta}
      coverImage={coverImage}
      className={className}
    />
  );
}

function IndexVariant({
  post,
  cleanExcerpt,
  displayType,
  displayDate,
  dateTime,
  displayMeta,
  visibleTags,
  footMeta,
  coverImage,
  className,
}: {
  post: ContentRowPost;
  cleanExcerpt: string;
  displayType: string;
  displayDate: string;
  dateTime?: string;
  displayMeta: string[];
  visibleTags: Pick<Tag, "id" | "name" | "slug">[];
  footMeta: string[];
  coverImage?: string;
  className?: string;
}) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group grid min-w-0 gap-4 border-b border-border py-7 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:grid-cols-[5.5rem_minmax(0,1fr)_auto] sm:gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both",
        className
      )}
    >
      <span className="sm:block">
        <time
          dateTime={dateTime || post.created_at}
          className="block font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80"
        >
          {displayDate}
        </time>
      </span>

      <span className="min-w-0">
        <span className="block font-serif text-[1.55rem] font-light italic leading-snug tracking-tight text-foreground transition-opacity duration-300 group-hover:opacity-70 sm:text-[1.75rem]">
          {post.title}
        </span>
        {cleanExcerpt ? (
          <span className="mt-2.5 line-clamp-2 block max-w-2xl text-[0.925rem] leading-7 text-muted-foreground">
            {cleanExcerpt}
          </span>
        ) : null}
        <span className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[10px] tracking-[0.12em] text-muted-foreground/65">
          <span>{displayType}</span>
          {post.category?.name ? (
            <>
              <span className="text-border">·</span>
              <span>{post.category.name}</span>
            </>
          ) : null}
          {visibleTags.slice(0, 2).map((tag) => (
            <span key={tag.id} className="contents">
              <span className="text-border">·</span>
              <span>{tag.name}</span>
            </span>
          ))}
          {footMeta.map((item) => (
            <span key={item} className="contents">
              <span className="text-border">·</span>
              <span>{item}</span>
            </span>
          ))}
        </span>
      </span>

      <span className="flex items-center gap-4 sm:items-start sm:pt-1">
        {coverImage ? (
          <span
            className="hidden h-16 w-24 shrink-0 bg-muted/50 bg-cover bg-center md:block"
            style={{
              backgroundImage: `url("${coverImage.replace(/"/g, '\\"')}")`,
            }}
            aria-hidden
          />
        ) : null}
        <ArrowUpRight
          className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
          suppressHydrationWarning
        />
      </span>
    </Link>
  );
}

function StreamVariant({
  post,
  cleanExcerpt,
  displayDate,
  dateTime,
  displayMeta,
  visibleTags,
  footMeta,
  className,
}: {
  post: ContentRowPost;
  cleanExcerpt: string;
  displayDate: string;
  dateTime?: string;
  displayMeta: string[];
  visibleTags: Pick<Tag, "id" | "name" | "slug">[];
  footMeta: string[];
  className?: string;
}) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group relative block border-b border-border/80 py-6 pl-6 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both",
        className
      )}
    >
      <span
        aria-hidden
        className="absolute left-0 top-7 h-2 w-2 rounded-full border border-border bg-background transition-colors group-hover:border-foreground group-hover:bg-foreground"
      />
      <span
        aria-hidden
        className="absolute left-[3px] top-10 bottom-[-1px] w-px bg-border/70"
      />

      <time
        dateTime={dateTime || post.created_at}
        className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80"
      >
        {displayDate}
      </time>

      <span className="mt-2 block font-serif text-xl font-light italic leading-snug text-foreground transition-opacity group-hover:opacity-70 sm:text-2xl">
        {post.title}
      </span>

      {cleanExcerpt ? (
        <span className="mt-2 line-clamp-3 block max-w-2xl text-[0.925rem] leading-7 text-muted-foreground">
          {cleanExcerpt}
        </span>
      ) : null}

      <span className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[10px] tracking-[0.12em] text-muted-foreground/65">
        {displayMeta.slice(0, 2).map((item, index) => (
          <span key={item} className="contents">
            {index > 0 ? <span className="text-border">·</span> : null}
            <span>{item}</span>
          </span>
        ))}
        {visibleTags.slice(0, 2).map((tag) => (
          <span key={tag.id} className="contents">
            <span className="text-border">·</span>
            <span>{tag.name}</span>
          </span>
        ))}
        {footMeta.map((item) => (
          <span key={item} className="contents">
            <span className="text-border">·</span>
            <span>{item}</span>
          </span>
        ))}
        <ArrowUpRight
          className="ml-auto h-3.5 w-3.5 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
          suppressHydrationWarning
        />
      </span>
    </Link>
  );
}

function CardVariant({
  post,
  cleanExcerpt,
  displayType,
  displayDate,
  dateTime,
  visibleTags,
  displayMeta,
  footMeta,
  coverImage,
  className,
}: {
  post: ContentRowPost;
  cleanExcerpt: string;
  displayType: string;
  displayDate: string;
  dateTime?: string;
  visibleTags: Pick<Tag, "id" | "name" | "slug">[];
  displayMeta: string[];
  footMeta: string[];
  coverImage?: string;
  className?: string;
}) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group relative flex min-w-0 flex-col overflow-hidden border border-border bg-card/50 p-5 transition-colors duration-300 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both",
        className
      )}
    >
      <span
        className="relative mb-4 block aspect-[16/10] overflow-hidden bg-muted/40 bg-cover bg-center"
        style={
          coverImage
            ? {
                backgroundImage: `url("${coverImage.replace(/"/g, '\\"')}")`,
              }
            : undefined
        }
        aria-label={coverImage ? post.title : undefined}
      >
        {coverImage ? (
          <span className="absolute inset-0 bg-foreground/5 transition-colors duration-500 group-hover:bg-transparent" />
        ) : (
          <span className="absolute inset-0 flex flex-col justify-between p-4">
            <span className="font-mono text-[8px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
              leempty
            </span>
            <span className="max-w-[8rem] font-serif text-xl italic leading-tight text-muted-foreground">
              {displayType}
            </span>
          </span>
        )}
        <span className="absolute right-3 top-3 border border-border bg-background/90 px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest text-muted-foreground backdrop-blur-sm">
          {displayType}
        </span>
      </span>

      <span className="mb-2.5 flex items-center justify-between gap-3">
        <span className="flex min-w-0 flex-wrap gap-1.5">
          {visibleTags.length > 0
            ? visibleTags.slice(0, 2).map((tag) => (
                <span
                  key={tag.id}
                  className="max-w-24 truncate font-mono text-[9px] text-muted-foreground"
                >
                  {tag.name}
                </span>
              ))
            : displayMeta.slice(0, 2).map((item, index) => (
                <span
                  key={`${item}-${index}`}
                  className="max-w-24 truncate font-mono text-[9px] text-muted-foreground"
                >
                  {item}
                </span>
              ))}
        </span>
        <time
          dateTime={dateTime || post.created_at}
          className="shrink-0 font-mono text-[9px] text-muted-foreground"
        >
          {displayDate}
        </time>
      </span>

      <span className="min-w-0 flex-1">
        <span className="mb-2 block font-serif text-lg font-light italic leading-tight text-foreground transition-opacity duration-300 group-hover:opacity-75">
          {post.title}
        </span>
        {cleanExcerpt ? (
          <span className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {cleanExcerpt}
          </span>
        ) : null}
      </span>

      <span className="my-3.5 block border-t border-border/80" />

      <span className="flex items-center justify-between">
        <span className="flex items-center gap-3 font-mono text-[9px] text-muted-foreground">
          {footMeta.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </span>
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors group-hover:border-foreground group-hover:bg-foreground group-hover:text-background">
          <ArrowUpRight className="h-3.5 w-3.5" suppressHydrationWarning />
        </span>
      </span>
    </Link>
  );
}
