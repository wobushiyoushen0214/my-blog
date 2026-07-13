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
        "relative inline-flex h-9 items-center rounded-full px-3 text-[13px] font-medium tracking-[-0.01em] transition-colors duration-200",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
      )}
    >
      {label}
    </Link>
  );
}

export function HeaderClient() {
  const pathname = usePathname();
  const isSearch = pathname === "/search";

  return (
    <header className="sticky top-0 z-40 w-full px-3 pt-3 sm:px-5">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 rounded-2xl border border-border/80 bg-card/80 px-3 shadow-[var(--signal-shadow)] backdrop-blur-xl supports-[backdrop-filter]:bg-card/70 sm:px-4">
        <div className="flex min-w-0 items-center gap-3 sm:gap-5">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5 rounded-xl px-1.5 py-1 text-foreground transition-opacity hover:opacity-80"
          >
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-[12px] font-bold tracking-tight text-primary-foreground">
              le
            </span>
            <span className="text-[1.05rem] font-semibold leading-none tracking-tight">
              leempty
            </span>
          </Link>

          <nav
            className="hidden items-center gap-1 md:flex"
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

        <div className="flex shrink-0 items-center gap-2" id="header-controls">
          {isSearch ? null : <SearchBar />}

          <nav
            className="flex items-center gap-1 md:hidden"
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

          <ThemeToggle className="rounded-full hover:bg-muted/70" />
        </div>
      </div>
    </header>
  );
}
