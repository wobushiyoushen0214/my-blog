import Link from "next/link";
import { Rss } from "lucide-react";

const footerLinks = [
  { href: "/posts", label: "文章" },
  { href: "/moments", label: "见闻" },
  { href: "/archive", label: "归档" },
  { href: "/category", label: "分类" },
  { href: "/tag", label: "标签" },
  { href: "/links", label: "友链" },
  { href: "/search", label: "搜索" },
];

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto w-full max-w-[960px] px-5 py-8 md:px-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-tight text-foreground">
                Lee / Notes
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                &copy; {new Date().getFullYear()} · 想法、代码与日常见闻
              </p>
            </div>
            <Link
              href="/rss.xml"
              className="inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              title="RSS Feed"
            >
              <Rss className="h-3.5 w-3.5" suppressHydrationWarning />
              RSS
            </Link>
          </div>
          <nav
            className="flex flex-wrap items-center gap-x-4 gap-y-2"
            aria-label="页脚导航"
          >
            {footerLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/admin"
              className="rounded-md text-xs text-muted-foreground/50 transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              管理
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
