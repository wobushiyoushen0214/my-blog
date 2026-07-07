"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchBar } from "@/components/search-bar";
import { cn } from "@/lib/utils";

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-9 items-center border px-2 font-mono text-xs font-medium transition-[background-color,color,border-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-transparent text-muted-foreground hover:border-border hover:bg-accent hover:text-foreground"
      )}
    >
      {label}
    </Link>
  );
}

export function HeaderClient() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isPosts = pathname === "/posts";
  const isMoments = pathname === "/moments";
  const isTags = pathname.startsWith("/tag");
  const isArchive = pathname === "/archive";
  const isLinks = pathname === "/links";
  const isSearch = pathname === "/search";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 shadow-[0_3px_0_var(--terminal-shadow)] backdrop-blur-none">
      <div className="mx-auto grid h-16 w-full max-w-[980px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-5 md:px-6">
        <div className="flex items-center">
          <Link
            href="/"
            className="inline-flex h-10 items-center gap-2 border border-primary bg-background px-2 text-sm font-semibold shadow-[2px_2px_0_var(--terminal-shadow)] transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <span className="pixel-label text-primary">LEE</span>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              /NOTES
            </span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center justify-center">
          <div className="flex items-center gap-1">
            <NavLink href="/" label="首页" active={isHome} />
            <NavLink href="/posts" label="文章" active={isPosts} />
            <NavLink href="/moments" label="见闻" active={isMoments} />
            <NavLink href="/tag" label="标签" active={isTags} />
            <NavLink href="/archive" label="归档" active={isArchive} />
            <NavLink href="/links" label="友链" active={isLinks} />
          </div>
        </nav>

        <div className="flex items-center justify-end gap-0.5">
          {isSearch ? null : <SearchBar />}
          <ThemeToggle />
        </div>
      </div>
      <nav className="border-t border-border bg-background/95 md:hidden" aria-label="移动端导航">
        <div className="mx-auto flex w-full max-w-[980px] gap-1 overflow-x-auto px-5 py-2">
          <NavLink href="/" label="首页" active={isHome} />
          <NavLink href="/posts" label="文章" active={isPosts} />
          <NavLink href="/moments" label="见闻" active={isMoments} />
          <NavLink href="/tag" label="标签" active={isTags} />
          <NavLink href="/archive" label="归档" active={isArchive} />
          <NavLink href="/links" label="友链" active={isLinks} />
        </div>
      </nav>
    </header>
  );
}
