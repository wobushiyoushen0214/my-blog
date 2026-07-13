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

function MetaLine({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <span className="mt-2.5 block text-[12px] leading-5 text-muted-foreground">
      {items.join(" · ")}
    </span>
  );
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
      : [`${readMinutes} 分钟`, `${formatViews(post.view_count)} 阅读`];

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
  const bits = [
    displayType,
    ...(post.category?.name ? [post.category.name] : []),
    ...visibleTags.slice(0, 2).map((tag) => tag.name),
    ...footMeta,
  ];

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group content-row-link grid min-w-0 gap-3 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:grid-cols-[6rem_minmax(0,1fr)_auto] sm:gap-8",
        className
      )}
    >
      <time
        dateTime={dateTime || post.created_at}
        className="signal-meta tabular-nums"
      >
        {displayDate}
      </time>

      <span className="min-w-0">
        <span className="block text-[1.2rem] font-semibold leading-snug tracking-tight text-foreground transition-opacity group-hover:opacity-65 sm:text-[1.3rem]">
          {post.title}
        </span>
        {cleanExcerpt ? (
          <span className="mt-2 line-clamp-2 block max-w-2xl text-[0.92rem] leading-7 text-muted-foreground">
            {cleanExcerpt}
          </span>
        ) : null}
        <MetaLine items={bits} />
      </span>

      {coverImage ? (
        <span
          className="mt-1 hidden h-14 w-20 shrink-0 overflow-hidden bg-muted/40 bg-cover bg-center sm:mt-0 md:block"
          style={{
            backgroundImage: `url("${coverImage.replace(/"/g, '\\"')}")`,
          }}
          aria-hidden
        />
      ) : (
        <span className="hidden text-muted-foreground/40 sm:block">
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" suppressHydrationWarning />
        </span>
      )}
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
  const bits = [
    ...displayMeta.slice(0, 2),
    ...visibleTags.slice(0, 2).map((tag) => tag.name),
    ...footMeta,
  ];

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group content-row-link relative block pl-5 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        className
      )}
    >
      <span
        aria-hidden
        className="absolute left-0 top-[1.55rem] h-1.5 w-1.5 rounded-full bg-foreground/30"
      />

      <time
        dateTime={dateTime || post.created_at}
        className="signal-meta tabular-nums"
      >
        {displayDate}
      </time>

      <span className="mt-2 block text-[1.15rem] font-semibold leading-snug tracking-tight text-foreground transition-opacity group-hover:opacity-65 sm:text-[1.25rem]">
        {post.title}
      </span>

      {cleanExcerpt ? (
        <span className="mt-2 line-clamp-3 block max-w-2xl text-[0.92rem] leading-7 text-muted-foreground">
          {cleanExcerpt}
        </span>
      ) : null}

      <MetaLine items={bits} />
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
  const tags = visibleTags.slice(0, 2).map((tag) => tag.name);
  const metaBits =
    tags.length > 0 ? tags : displayMeta.slice(0, 2);

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group flex min-w-0 flex-col border-b border-border/70 pb-7 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 hover:opacity-80",
        className
      )}
    >
      <span
        className="relative mb-4 block aspect-[16/10] overflow-hidden bg-muted/30 bg-cover bg-center"
        style={
          coverImage
            ? {
                backgroundImage: `url("${coverImage.replace(/"/g, '\\"')}")`,
              }
            : undefined
        }
        aria-label={coverImage ? post.title : undefined}
      >
        {!coverImage ? (
          <span className="absolute inset-0 flex flex-col justify-between p-4">
            <span className="signal-meta">leempty</span>
            <span className="text-sm text-muted-foreground">{displayType}</span>
          </span>
        ) : null}
      </span>

      <span className="mb-2 flex items-baseline justify-between gap-3">
        <MetaLine items={metaBits} />
        <time
          dateTime={dateTime || post.created_at}
          className="signal-meta shrink-0 tabular-nums"
        >
          {displayDate}
        </time>
      </span>

      <span className="block text-[1.1rem] font-semibold leading-snug tracking-tight text-foreground">
        {post.title}
      </span>
      {cleanExcerpt ? (
        <span className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
          {cleanExcerpt}
        </span>
      ) : null}

      <span className="mt-4 text-[12px] text-muted-foreground">
        {footMeta.join(" · ")}
      </span>
    </Link>
  );
}
