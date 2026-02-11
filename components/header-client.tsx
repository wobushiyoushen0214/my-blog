"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchBar } from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

type NavItem = { id: string; name: string; slug: string };

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
      className={`px-2 py-1 text-sm font-medium transition-colors ${
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}

export function HeaderClient({
  categories,
  tags,
}: {
  categories: NavItem[];
  tags: NavItem[];
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isPosts =
    pathname === "/posts" || pathname.startsWith("/blog") || pathname.startsWith("/category");
  const isMoments = pathname === "/moments" || pathname.startsWith("/tag");
  const isLinks = pathname === "/links";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto grid h-14 w-full max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 md:px-6">
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-base font-semibold tracking-tight">Lee</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center justify-center gap-2">
          <NavLink href="/" label="首页" active={isHome} />

          <div className="flex items-center gap-1">
            <NavLink href="/posts" label="文章" active={isPosts} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${
                    isPosts ? "text-foreground" : "text-muted-foreground"
                  }`}
                  aria-label="文章分类"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-56">
                <DropdownMenuLabel>分类</DropdownMenuLabel>
                {categories.length > 0 ? (
                  categories.slice(0, 12).map((c) => (
                    <DropdownMenuItem key={c.id} asChild>
                      <Link href={`/posts?category=${encodeURIComponent(c.slug)}`}>
                        {c.name}
                      </Link>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled>暂无分类</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-1">
            <NavLink href="/moments" label="见闻" active={isMoments} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${
                    isMoments ? "text-foreground" : "text-muted-foreground"
                  }`}
                  aria-label="见闻分类"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-56">
                <DropdownMenuLabel>分类</DropdownMenuLabel>
                {tags.length > 0 ? (
                  tags.slice(0, 12).map((t) => (
                    <DropdownMenuItem key={t.id} asChild>
                      <Link href={`/moments?tag=${encodeURIComponent(t.slug)}`}>
                        {t.name}
                      </Link>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled>暂无分类</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <NavLink href="/links" label="友链" active={isLinks} />
        </nav>

        <div className="flex items-center justify-end gap-0.5">
          <SearchBar />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
