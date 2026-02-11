import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchBar } from "@/components/search-bar";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold">
          My Blog
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            首页
          </Link>
          <Link
            href="/category"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            分类
          </Link>
          <Link
            href="/tag"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            标签
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <SearchBar />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
