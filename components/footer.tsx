import Link from "next/link";
import { Rss } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/40">
      <div className="mx-auto w-full max-w-[1440px] px-4 md:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Lee
            </p>
            <Link
              href="/rss.xml"
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="RSS Feed"
            >
              <Rss className="h-3.5 w-3.5" />
            </Link>
          </div>
          <Link
            href="/admin"
            className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          >
            管理
          </Link>
        </div>
      </div>
    </footer>
  );
}
