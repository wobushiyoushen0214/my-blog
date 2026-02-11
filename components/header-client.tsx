"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchBar } from "@/components/search-bar";

type NavItem = { id: string; name: string; slug: string; type?: "post" | "moment" };

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
      className={`inline-flex h-8 items-center rounded-full px-3 text-sm font-medium transition-colors ${
        active
          ? "bg-accent text-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}

function HoverNav({
  href,
  label,
  active,
  items,
}: {
  href: string;
  label: string;
  active: boolean;
  items: { href: string; label: string; disabled?: boolean }[];
}) {
  return (
    <div className="relative group">
      <Link
        href={href}
        className={`inline-flex h-8 items-center rounded-full px-3 text-sm font-medium transition-colors ${
          active
            ? "bg-accent text-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        }`}
      >
        {label}
      </Link>

      <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity absolute left-1/2 top-full z-50 -translate-x-1/2">
        <div className="h-2" />
        <div className="w-60 rounded-md border bg-popover p-1 shadow-md">
          {items.map((item) =>
            item.disabled ? (
              <div
                key={item.label}
                className="px-2 py-1.5 text-sm text-muted-foreground/70 select-none"
              >
                {item.label}
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
              >
                {item.label}
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export function HeaderClient({
  categories,
}: {
  categories: NavItem[];
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isPosts =
    pathname === "/posts" || pathname.startsWith("/blog") || pathname.startsWith("/category");
  const isMoments = pathname === "/moments" || pathname.startsWith("/tag");
  const isLinks = pathname === "/links";

  const postCategories = categories.filter((c) => !c.type || c.type === "post");
  const momentCategories = categories.filter((c) => c.type === "moment");

  const postItems = [
    ...(postCategories.length > 0
      ? postCategories.slice(0, 12).map((c) => ({
          href: `/posts?category=${encodeURIComponent(c.slug)}`,
          label: c.name,
        }))
      : [{ href: "#", label: "暂无分类", disabled: true }]),
  ];

  const momentItems = [
    ...(momentCategories.length > 0
      ? momentCategories.slice(0, 12).map((c) => ({
          href: `/moments?category=${encodeURIComponent(c.slug)}`,
          label: c.name,
        }))
      : [{ href: "#", label: "暂无分类", disabled: true }]),
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto grid h-14 w-full max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 md:px-6">
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-base font-semibold tracking-tight">Lee</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center justify-center">
          <div className="flex items-center gap-1 rounded-full border border-border/50 bg-background/40 px-2 py-1 backdrop-blur">
            <NavLink href="/" label="首页" active={isHome} />
            <HoverNav href="/posts" label="文章" active={isPosts} items={postItems} />
            <HoverNav href="/moments" label="见闻" active={isMoments} items={momentItems} />
            <NavLink href="/links" label="友链" active={isLinks} />
          </div>
        </nav>

        <div className="flex items-center justify-end gap-0.5">
          <SearchBar />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
