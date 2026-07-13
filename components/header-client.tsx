"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchBar } from "@/components/search-bar";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "首页", match: (p: string) => p === "/" },
  {
    href: "/posts",
    label: "文章",
    match: (p: string) => p === "/posts" || p.startsWith("/blog/"),
  },
  {
    href: "/moments",
    label: "见闻",
    match: (p: string) => p === "/moments",
  },
  {
    href: "/tag",
    label: "标签",
    match: (p: string) => p.startsWith("/tag"),
  },
] as const;

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
        "relative inline-flex h-full items-center font-mono text-[10px] font-medium uppercase tracking-[0.2em] transition-colors duration-200",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-0 bottom-0 h-px origin-left bg-foreground transition-transform duration-200",
          active ? "scale-x-100" : "scale-x-0"
        )}
      />
    </Link>
  );
}

export function HeaderClient() {
  const pathname = usePathname();
  const isSearch = pathname === "/search";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65">
      <div className="mx-auto flex h-14 max-w-7xl items-stretch justify-between gap-6 px-5 sm:px-8 lg:px-10">
        <div className="flex min-w-0 items-stretch gap-8">
          <Link
            href="/"
            className="flex shrink-0 items-center font-serif text-[1.35rem] font-light italic leading-none tracking-tight text-foreground transition-opacity hover:opacity-70"
          >
            leempty
          </Link>

          <nav
            className="hidden items-stretch gap-7 md:flex"
            aria-label="主导航"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                active={item.match(pathname)}
              />
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-3" id="header-controls">
          {isSearch ? null : <SearchBar />}

          <nav
            className="flex h-full items-stretch gap-4 md:hidden"
            aria-label="移动端导航"
          >
            {navItems
              .filter((item) => item.href !== "/")
              .slice(0, 2)
              .map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  active={item.match(pathname)}
                />
              ))}
          </nav>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
