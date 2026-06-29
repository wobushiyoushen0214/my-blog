"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import {
  Archive,
  ArrowRight,
  FileText,
  FolderOpen,
  Hash,
  Link2,
  NotebookText,
  Rss,
  Search,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { LucideIcon } from "lucide-react";

type QuickLink = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

const quickLinks: QuickLink[] = [
  {
    href: "/posts",
    label: "文章",
    description: "长期笔记与项目复盘",
    icon: FileText,
  },
  {
    href: "/moments",
    label: "见闻",
    description: "短记录、观察和摘录",
    icon: NotebookText,
  },
  {
    href: "/archive",
    label: "归档",
    description: "按年份和月份回看",
    icon: Archive,
  },
  {
    href: "/tag",
    label: "标签",
    description: "按关键词继续探索",
    icon: Hash,
  },
  {
    href: "/category",
    label: "分类",
    description: "按主题浏览内容",
    icon: FolderOpen,
  },
  {
    href: "/links",
    label: "友链",
    description: "站点和朋友链接",
    icon: Link2,
  },
  {
    href: "/rss.xml",
    label: "RSS",
    description: "订阅站点更新",
    icon: Rss,
  },
];

export function SearchBar() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        setOpen(true);
        return;
      }

      if (event.key === "Escape" && open) {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = query.trim();
    router.push(value ? `/search?q=${encodeURIComponent(value)}` : "/search");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 sm:w-28 sm:justify-start sm:border sm:border-border/70 sm:bg-card"
          aria-keyshortcuts="/"
        >
          <Search className="h-4 w-4" suppressHydrationWarning />
          <span className="sr-only sm:not-sr-only">搜索</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        className="gap-0 overflow-hidden p-0 sm:max-w-xl"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>搜索站内内容</DialogTitle>
          <DialogDescription>
            搜索文章、见闻、分类和标签，或打开常用浏览入口。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSearch} className="border-b border-border/60 p-3 sm:p-4">
          <label htmlFor="header-search" className="sr-only">
            搜索关键词
          </label>
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                suppressHydrationWarning
              />
              <Input
                ref={inputRef}
                id="header-search"
                type="search"
                placeholder="搜索标题、正文、分类或标签..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-10 border-border/60 bg-background pl-10 shadow-none"
              />
            </div>
            <Button type="submit" className="h-10">
              搜索
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-10"
              aria-label="关闭搜索"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" suppressHydrationWarning />
            </Button>
          </div>
        </form>

        <div className="p-3 sm:p-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Explore
            </p>
          </div>

          <div className="divide-y divide-border/60 border-y border-border/70">
            {quickLinks.map((item, index) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="group grid min-w-0 gap-3 px-2 py-3 transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:grid-cols-[2rem_minmax(0,1fr)_auto] sm:items-center"
                >
                  <span className="flex items-center gap-2 text-xs tabular-nums text-muted-foreground">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <Icon className="h-4 w-4" suppressHydrationWarning />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium transition-colors group-hover:text-foreground">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  </span>
                  <ArrowRight
                    className="hidden h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary sm:block"
                    suppressHydrationWarning
                  />
                </Link>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
