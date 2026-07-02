import Link from "next/link";
import { Rss } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto flex w-full max-w-[980px] flex-col gap-4 px-5 py-7 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6">
        <p>
          &copy; {new Date().getFullYear()} Lee / Notes
        </p>
        <nav
          className="flex flex-wrap items-center gap-x-4 gap-y-2"
          aria-label="站点辅助链接"
        >
          <Link
            href="/rss.xml"
            className="inline-flex h-9 items-center gap-1.5 rounded-md transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            title="RSS Feed"
          >
            <Rss className="h-3.5 w-3.5" suppressHydrationWarning />
            RSS
          </Link>
          <Link
            href="/admin"
            className="inline-flex h-9 items-center rounded-md text-xs text-muted-foreground/60 transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            管理
          </Link>
        </nav>
      </div>
    </footer>
  );
}
