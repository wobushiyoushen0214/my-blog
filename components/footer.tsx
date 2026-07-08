import Link from "next/link";
import { Rss } from "lucide-react";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <p className="rounded-md border border-border bg-muted/50 px-2 py-1">
          &copy; {new Date().getFullYear()} Lee / Notes
        </p>
        <nav
          className="flex flex-wrap items-center gap-x-4 gap-y-2"
          aria-label="站点辅助链接"
        >
          <Link
            href="/rss.xml"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-background px-2 transition-colors hover:border-primary/50 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            title="RSS Feed"
          >
            <Rss className="h-3.5 w-3.5" suppressHydrationWarning />
            RSS
          </Link>
          <Link
            href="/admin"
            className="inline-flex h-9 items-center rounded-md border border-border bg-background px-2 text-xs text-muted-foreground/70 transition-colors hover:border-primary/50 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            管理
          </Link>
        </nav>
      </div>
    </footer>
  );
}
