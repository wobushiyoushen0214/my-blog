"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchBar } from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  const isPosts = pathname === "/posts";
  const isMoments = pathname === "/moments";
  const isLinks = pathname === "/links";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between gap-3 px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-base font-semibold tracking-tight">Lee</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <NavLink href="/" label="首页" active={isHome} />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-2 ${
                    isPosts ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  文章 <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-56">
                <DropdownMenuItem asChild>
                  <Link href="/posts">全部文章</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {categories.slice(0, 10).map((c) => (
                  <DropdownMenuItem key={c.id} asChild>
                    <Link href={`/posts?category=${encodeURIComponent(c.slug)}`}>
                      {c.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/category">所有分类</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-2 ${
                    isMoments ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  见闻 <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-56">
                <DropdownMenuItem asChild>
                  <Link href="/moments">全部见闻</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {tags.slice(0, 10).map((t) => (
                  <DropdownMenuItem key={t.id} asChild>
                    <Link href={`/moments?tag=${encodeURIComponent(t.slug)}`}>
                      {t.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/tag">所有标签</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <NavLink href="/links" label="友链" active={isLinks} />
          </nav>
        </div>

        <div className="flex items-center gap-0.5">
          <SearchBar />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
