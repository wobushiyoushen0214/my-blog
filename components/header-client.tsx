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
        "transition-colors duration-200",
        active
          ? "text-slate-950 dark:text-white"
          : "text-neutral-400 hover:text-slate-950 dark:text-neutral-500 dark:hover:text-white",
        className
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
  const isSearch = pathname === "/search";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-100 bg-white/95 backdrop-blur-md transition-colors duration-300 dark:border-neutral-900 dark:bg-[#0a0a0a]/95">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-10">
        <div className="flex min-w-0 items-center space-x-6">
          <Link
            href="/"
            className="shrink-0 font-serif text-2xl font-bold italic tracking-tighter text-slate-900 transition-colors dark:text-white"
          >
            LeeNotes.
          </Link>

          <div className="hidden h-4 w-px bg-neutral-200 dark:bg-neutral-800 md:block" />

          <nav
            className="hidden items-center space-x-6 text-[10px] font-bold uppercase tracking-[0.25em] md:flex"
            aria-label="主导航"
          >
            <NavLink href="/" label="Garden" active={isHome} />
            <NavLink href="/posts" label="Essays" active={isPosts} />
            <NavLink href="/moments" label="Logs" active={isMoments} />
            <NavLink href="/tag" label="Index" active={isTags} />
          </nav>
        </div>

        <div className="flex shrink-0 items-center space-x-6" id="header-controls">
          {isSearch ? null : <SearchBar />}

          <div className="hidden items-center gap-2 text-[9px] font-medium uppercase tracking-[0.25em] text-neutral-400 dark:text-neutral-600 lg:flex">
            <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
            </span>
            <span>SYSTEM ONLINE</span>
          </div>

          <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800" />

          <nav
            className="flex items-center space-x-3 text-[10px] font-bold uppercase tracking-wider md:hidden"
            aria-label="移动端导航"
          >
            <NavLink href="/" label="Garden" active={isHome} className="tracking-wider" />
            <NavLink href="/posts" label="Essays" active={isPosts} className="tracking-wider" />
            <NavLink href="/moments" label="Logs" active={isMoments} className="tracking-wider" />
          </nav>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
