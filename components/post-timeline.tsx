import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import type { Post, Tag } from "@/lib/types";

type TimelinePost = Post & {
  category?: { name: string; slug: string } | null;
  tags?: Tag[];
};

export function PostTimeline({ posts }: { posts: TimelinePost[] }) {
  return (
    <div className="relative" role="list">
      <div className="absolute left-3 top-1 h-[calc(100%-0.5rem)] w-px bg-border/70 sm:left-4" />
      <div className="space-y-4">
        {posts.map((post) => (
          <article
            key={post.id}
            className="group relative rounded-lg border border-transparent py-2 pl-9 transition-colors hover:border-border/70 hover:bg-muted/25 sm:pl-12"
            role="listitem"
          >
            <div className="absolute left-3 top-5 size-2.5 -translate-x-1/2 rounded-full border-2 border-background bg-primary sm:left-4" />

            <div className="flex min-w-0 items-start gap-4 pr-2 sm:pr-4">
              {post.cover_image ? (
                <div className="relative hidden h-16 w-24 shrink-0 overflow-hidden rounded-md border bg-muted sm:block">
                  <Image
                    src={post.cover_image}
                    alt={post.title}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </div>
              ) : null}

              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
                  <time dateTime={post.created_at}>
                    {new Date(post.created_at).toLocaleDateString("zh-CN", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </time>
                  {post.category ? (
                    <Link
                      href={`/category/${post.category.slug}`}
                      className="rounded-sm transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    >
                      {post.category.name}
                    </Link>
                  ) : null}
                  {post.tags && post.tags.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {post.tags.slice(0, 3).map((tag) => (
                        <Link key={tag.id} href={`/tag/${tag.slug}`}>
                          <Badge
                            variant="secondary"
                            className="rounded-md text-xs font-normal"
                          >
                            {tag.name}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>

                <Link
                  href={`/blog/${post.slug}`}
                  className="mt-2 block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <h3 className="line-clamp-2 text-base font-semibold leading-snug transition-colors group-hover:text-primary md:text-lg">
                    {post.title}
                  </h3>
                  {post.excerpt ? (
                    <p className="mt-1 line-clamp-2 text-sm leading-7 text-muted-foreground">
                      {post.excerpt}
                    </p>
                  ) : null}
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
