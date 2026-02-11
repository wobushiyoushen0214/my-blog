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
    <div className="relative">
      <div className="absolute left-4 top-0 h-full w-px bg-border/60" />
      <div className="space-y-8">
        {posts.map((post) => (
          <div key={post.id} className="relative pl-12">
            <div className="absolute left-4 top-2 size-2 -translate-x-1/2 rounded-full bg-primary ring-4 ring-background" />

            <div className="flex items-start gap-4">
              {post.cover_image ? (
                <div className="relative hidden sm:block h-16 w-24 overflow-hidden rounded-lg border bg-muted">
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
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
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
                      className="hover:text-foreground transition-colors"
                    >
                      {post.category.name}
                    </Link>
                  ) : null}
                  {post.tags && post.tags.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {post.tags.slice(0, 3).map((tag) => (
                        <Link key={tag.id} href={`/tag/${tag.slug}`}>
                          <Badge variant="secondary" className="font-normal text-xs rounded-md">
                            {tag.name}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>

                <Link href={`/blog/${post.slug}`} className="group block mt-2">
                  <h3 className="text-base md:text-lg font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  {post.excerpt ? (
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed line-clamp-2">
                      {post.excerpt}
                    </p>
                  ) : null}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

