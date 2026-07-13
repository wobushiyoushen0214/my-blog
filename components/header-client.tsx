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
        "relative inline-flex h-9 items-center px-2 text-[13px] tracking-[-0.01em] transition-colors duration-150",
        active
          ? "font-medium text-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
      {active ? (
        <span
          aria-hidden
          className="absolute inset-x-2 -bottom-px h-px bg-foreground/80"
        />
      ) : null}
    </Link>
  );
}

export function HeaderClient() {
  const pathname = usePathname();
  const isSearch = pathname === "/search";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-13 max-w-5xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-10" style={{ height: "3.25rem" }}>
        <div className="flex min-w-0 items-center gap-6 sm:gap-8">
          <Link
            href="/"
            className="shrink-0 text-[0.98rem] font-semibold tracking-tight text-foreground transition-opacity hover:opacity-65"
          >
            leempty
          </Link>

          <nav
            className="hidden items-center gap-0.5 md:flex"
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

        <div className="flex shrink-0 items-center gap-1" id="header-controls">
          {isSearch ? null : <SearchBar />}

          <nav
            className="flex items-center gap-0.5 md:hidden"
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

          <ThemeToggle className="hover:bg-transparent hover:opacity-70" />
        </div>
      </div>
    </header>
  );
}
