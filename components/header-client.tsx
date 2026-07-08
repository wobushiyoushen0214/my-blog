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
        "site-nav-link",
        active && "site-nav-link-active"
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
    <header className="site-sidebar">
      <div className="site-sidebar-inner">
        <Link
          href="/"
          className="site-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <span className="site-brand-mark">NARRATIVE.</span>
          <span className="site-brand-copy">
            <span>Lee Notes</span>
            <span>Digital Garden</span>
          </span>
        </Link>

        <nav className="site-nav" aria-label="主导航">
          <NavLink href="/" label="Garden" active={isHome} />
          <NavLink href="/posts" label="Essays" active={isPosts} />
          <NavLink href="/moments" label="Logs" active={isMoments} />
          <NavLink href="/tag" label="Index" active={isTags} />
          <NavLink href="/archive" label="Timeline" active={isArchive} />
          <NavLink href="/links" label="Links" active={isLinks} />
        </nav>

        <div className="site-sidebar-tools">
          {isSearch ? null : <SearchBar className="site-search-trigger" />}
          <ThemeToggle className="site-theme-trigger" />
        </div>
      </div>
    </header>
  );
}
