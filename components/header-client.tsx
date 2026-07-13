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
  className,
}: {
  href: string;
  label: string;
  active: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative transition-colors duration-200",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {label}
      {active ? (
        <span
          aria-hidden
          className="absolute -bottom-1 left-0 h-px w-full bg-foreground"
        />
      ) : null}
    </Link>
  );
}

export function HeaderClient() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isPosts = pathname === "/posts" || pathname.startsWith("/blog/");
  const isMoments = pathname === "/moments";
  const isTags = pathname.startsWith("/tag");
  const isSearch = pathname === "/search";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/85 backdrop-blur-md transition-colors duration-300">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <div className="flex min-w-0 items-center gap-6">
          <Link
            href="/"
            className="shrink-0 font-serif text-2xl font-light italic tracking-tight text-foreground transition-opacity hover:opacity-70"
          >
            leempty
          </Link>

          <div className="hidden h-3.5 w-px bg-border md:block" />

          <nav
            className="hidden items-center gap-6 font-mono text-[10px] font-bold uppercase tracking-[0.22em] md:flex"
            aria-label="主导航"
          >
            <NavLink href="/" label="首页" active={isHome} />
            <NavLink href="/posts" label="文章" active={isPosts} />
            <NavLink href="/moments" label="见闻" active={isMoments} />
            <NavLink href="/tag" label="标签" active={isTags} />
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-4" id="header-controls">
          {isSearch ? null : <SearchBar />}

          <div className="hidden h-3.5 w-px bg-border sm:block" />

          <nav
            className="flex items-center gap-3 font-mono text-[10px] font-bold uppercase tracking-wider md:hidden"
            aria-label="移动端导航"
          >
            <NavLink href="/posts" label="文章" active={isPosts} />
            <NavLink href="/moments" label="见闻" active={isMoments} />
          </nav>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
