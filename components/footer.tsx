import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t">
      <div className="container mx-auto flex flex-col items-center gap-4 py-10 md:flex-row md:justify-between px-4">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} My Blog. All rights reserved.
        </p>
        <div className="flex gap-4">
          <Link
            href="/rss.xml"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            RSS
          </Link>
          <Link
            href="/admin"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            管理
          </Link>
        </div>
      </div>
    </footer>
  );
}
