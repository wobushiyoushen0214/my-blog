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
      className={`relative inline-flex h-8 items-center px-1 text-xs font-medium uppercase tracking-[0.2em] transition-all duration-500 md:px-2 ${
        active
          ? "text-foreground"
          : "text-muted-foreground/60 hover:text-foreground"
      }`}
    >
      {label}
      {active ? (
        <span className="absolute -bottom-0.5 left-1 right-1 h-[0.5px] bg-primary md:left-2 md:right-2" />
      ) : null}
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
        className={`relative inline-flex h-8 items-center px-1 text-xs font-medium uppercase tracking-[0.2em] transition-all duration-500 md:px-2 ${
          active
            ? "text-foreground"
            : "text-muted-foreground/60 hover:text-foreground"
        }`}
      >
        {label}
        {active ? (
          <span className="absolute -bottom-0.5 left-1 right-1 h-[0.5px] bg-primary md:left-2 md:right-2" />
        ) : null}
      </Link>

      <div className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 opacity-0 transition-all duration-500 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
        <div className="h-2.5" />
        <div className="w-80 overflow-hidden border-[0.5px] border-border/20 bg-popover/95 p-2 shadow-[0_20px_50px_rgba(0,0,0,0.08)] backdrop-blur-xl">
          <div className="px-1.5 pb-2 pt-1">
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              <span className="text-primary/60" aria-hidden="true">
                ❖
              </span>
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
                  className="block px-2 py-1.5 text-xs text-muted-foreground outline-none transition-all duration-300 hover:bg-muted/30 hover:text-foreground focus:bg-muted/30 focus:text-foreground"
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
    <header className="sticky top-0 z-50 w-full border-b-[0.5px] border-border/20 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto grid h-16 w-full max-w-[1080px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-5 md:px-6">
        <div className="flex items-center">
          <Link
            href="/"
            className="group flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <span className="flex size-8 items-center justify-center border-[0.5px] border-foreground/30 font-serif text-sm font-semibold text-foreground transition-all duration-700 group-hover:border-primary group-hover:text-primary">
              L
            </span>
            <span className="font-serif text-xl leading-none italic transition-transform duration-700 group-hover:-translate-x-0.5">
              Lee
            </span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center justify-center">
          <div className="flex items-center gap-4">
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
      <nav className="border-t-[0.5px] border-border/20 bg-background/80 backdrop-blur md:hidden" aria-label="移动端导航">
        <div className="mx-auto flex w-full max-w-[1080px] gap-5 overflow-x-auto px-5 py-2">
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