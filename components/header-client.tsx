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
  const isSearch = pathname === "/search";

  return (
    <header className="site-sidebar">
      <div className="site-sidebar-inner">
        <div className="site-header-left">
          <Link
            href="/"
            className="site-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <span className="site-brand-mark">Lee Notes.</span>
            <span className="site-brand-copy">
              <span>Lee Notes</span>
              <span>Digital Garden</span>
            </span>
          </Link>

          <div className="site-brand-divider" aria-hidden="true" />

          <nav className="site-nav site-nav-desktop" aria-label="主导航">
            <NavLink href="/" label="Garden" active={isHome} />
            <NavLink href="/posts" label="Essays" active={isPosts} />
            <NavLink href="/moments" label="Logs" active={isMoments} />
            <NavLink href="/tag" label="Index" active={isTags} />
          </nav>
        </div>

        <div className="site-sidebar-tools">
          {isSearch ? null : <SearchBar className="site-search-trigger" />}

          <div className="site-status" aria-label="站点在线">
            <span className="site-status-dot" aria-hidden="true">
              <span />
            </span>
            <span>SYSTEM ONLINE</span>
          </div>

          <div className="site-control-divider" aria-hidden="true" />

          <nav className="site-mobile-nav" aria-label="移动端导航">
            <NavLink href="/" label="Garden" active={isHome} />
            <NavLink href="/posts" label="Essays" active={isPosts} />
            <NavLink href="/moments" label="Logs" active={isMoments} />
          </nav>

          <ThemeToggle className="site-theme-trigger" />
        </div>
      </div>
    </header>
  );
}
