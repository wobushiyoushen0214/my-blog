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
      aria-current={active ? "page" : undefined}
      className={`inline-flex h-9 items-center border-b border-transparent px-1.5 text-sm transition-colors ${
        active
          ? "border-foreground text-foreground"
          : "text-muted-foreground hover:border-border hover:text-foreground"
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
        aria-current={active ? "page" : undefined}
        className={`inline-flex h-9 items-center border-b border-transparent px-1.5 text-sm transition-colors ${
          active
            ? "border-foreground text-foreground"
            : "text-muted-foreground hover:border-border hover:text-foreground"
        }`}
      >
        {label}
      </Link>

      <div className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
        <div className="h-2" />
        <div className="w-72 overflow-hidden rounded-lg border border-border/70 bg-popover/95 p-2 shadow-none backdrop-blur-xl">
          <div className="px-2 pb-2 pt-1">
            <p className="text-xs text-muted-foreground">
              {label}目录
            </p>
          </div>
          <div className="grid gap-0.5">
            {items.map((item) =>
              item.disabled ? (
                <div
                  key={item.label}
                  className="px-2 py-1.5 text-xs text-muted-foreground/50"
                >
                  <span>{item.label}</span>
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-md px-2 py-1.5 text-sm text-muted-foreground outline-none transition-colors hover:bg-muted/50 hover:text-foreground focus:bg-muted/50 focus:text-foreground"
                >
                  <span className="min-w-0 truncate">{item.label}</span>
                </Link>
              )
            )}
          </div>
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
  const isMoments = pathname === "/moments";
  const isTags = pathname.startsWith("/tag");
  const isArchive = pathname === "/archive";
  const isLinks = pathname === "/links";

  const postCategories = categories.filter((c) => !c.type || c.type === "post");
  const momentCategories = categories.filter((c) => c.type === "moment");

  const postItems = [
    { href: "/posts", label: "全部文章" },
    { href: "/category", label: "所有分类" },
    ...(postCategories.length > 0
      ? postCategories.slice(0, 12).map((c) => ({
          href: `/posts?category=${encodeURIComponent(c.slug)}`,
          label: c.name,
        }))
      : [{ href: "#", label: "暂无分类", disabled: true }]),
  ];

  const momentItems = [
    { href: "/moments", label: "全部见闻" },
    ...(momentCategories.length > 0
      ? momentCategories.slice(0, 12).map((c) => ({
          href: `/moments?category=${encodeURIComponent(c.slug)}`,
          label: c.name,
        }))
      : [{ href: "#", label: "暂无分类", disabled: true }]),
  ];

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
            <HoverNav href="/posts" label="文章" active={isPosts} items={postItems} />
            <HoverNav href="/moments" label="见闻" active={isMoments} items={momentItems} />
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
