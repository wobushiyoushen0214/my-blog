"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchBar } from "@/components/search-bar";

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
      className={`inline-flex h-9 items-center border-b border-transparent px-1.5 text-sm transition-colors ${
        active
          ? "border-foreground text-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}

export function HeaderClient() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isPosts =
    pathname === "/posts" || pathname.startsWith("/blog") || pathname.startsWith("/category");
  const isMoments = pathname === "/moments";
  const isTags = pathname.startsWith("/tag");
  const isArchive = pathname === "/archive";
  const isLinks = pathname === "/links";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto grid h-14 w-full max-w-[960px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-5 md:px-6">
        <div className="flex items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md text-base font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            Lee
            <span className="text-muted-foreground">Notes</span>
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
          <SearchBar />
          <ThemeToggle />
        </div>
      </div>
      <nav className="border-t border-border/60 bg-background/95 md:hidden" aria-label="移动端导航">
        <div className="mx-auto flex w-full max-w-[960px] gap-1 overflow-x-auto px-5 py-2">
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
