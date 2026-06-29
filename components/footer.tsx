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
    <footer className="border-t border-border bg-card">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-6">
        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="font-serif text-2xl uppercase tracking-[0.18em]">
              Lee Archive
            </p>
            <p className="mt-2 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
              &copy; {new Date().getFullYear()} / Notes, Projects, Field Records
            </p>
            <Link
              href="/rss.xml"
              className="mt-4 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              title="RSS Feed"
            >
              <Rss className="h-3.5 w-3.5" suppressHydrationWarning />
              RSS
            </Link>
          </div>
          <nav
            className="flex flex-wrap items-center gap-x-5 gap-y-2 md:justify-end"
            aria-label="页脚导航"
          >
            {footerLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/admin"
              className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground/60 transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              管理
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
