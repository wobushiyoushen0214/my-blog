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
        <button
          type="button"
          className="inline-flex h-9 items-center justify-center gap-2 px-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground/60 transition-all duration-500 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:w-28 sm:justify-start"
          aria-keyshortcuts="/"
        >
          <Search className="h-4 w-4" suppressHydrationWarning />
          <span className="sr-only sm:not-sr-only">搜索</span>
        </button>
      </DialogTrigger>
      <DialogContent
        className="gap-0 overflow-hidden border-[0.5px] border-border/20 bg-background p-0 shadow-[0_20px_50px_rgba(0,0,0,0.08)] backdrop-blur-xl sm:max-w-xl"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>搜索站内内容</DialogTitle>
          <DialogDescription>
            搜索文章、见闻、分类和标签，或打开常用浏览入口。
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSearch}
          className="px-3 py-3 sm:px-4 sm:py-4"
        >
          <label htmlFor="header-search" className="sr-only">
            搜索关键词
          </label>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_84px_2.5rem]">
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
                className="h-11 border-transparent bg-muted/30 pl-10 shadow-none transition-all duration-300 hover:bg-muted/40 focus-visible:bg-background rounded-none"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center bg-foreground px-4 text-xs font-medium uppercase tracking-[0.14em] text-background transition-all duration-500 hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              搜索
            </button>
            <button
              type="button"
              className="inline-flex size-11 items-center justify-center bg-muted/30 text-muted-foreground transition-all duration-300 hover:bg-muted/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              aria-label="关闭搜索"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" suppressHydrationWarning />
            </button>
          </div>
        </form>

        <div className="px-3 py-3 sm:px-4 sm:py-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              <span className="text-primary/60" aria-hidden="true">❖</span>{" "}
              探索
            </p>
          </div>

          <div className="grid gap-1">
            {quickLinks.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="group grid min-w-0 gap-3 px-2.5 py-2.5 transition-all duration-300 hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:grid-cols-[1.25rem_minmax(0,1fr)_auto] sm:items-center"
                >
                  <span className="flex items-center text-muted-foreground">
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
                    className="hidden h-4 w-4 text-muted-foreground transition-all duration-300 group-hover:translate-x-1 group-hover:text-foreground sm:block"
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