"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import {
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
import { cn } from "@/lib/utils";

type SearchBarProps = {
  className?: string;
};

export function SearchBar({ className }: SearchBarProps = {}) {
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
          className={cn(
            "hidden w-[180px] items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50/50 py-1.5 pl-3 pr-4 font-sans text-[10px] uppercase tracking-wider text-neutral-800 outline-none transition-all hover:border-neutral-300 hover:bg-white focus-visible:ring-2 focus-visible:ring-ring/50 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-100 dark:hover:border-neutral-700 dark:hover:bg-[#0a0a0a] sm:inline-flex",
            className
          )}
          aria-keyshortcuts="/"
        >
          <Search className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500" suppressHydrationWarning />
          <span className="truncate text-neutral-400 dark:text-neutral-500">
            Search indices...
          </span>
        </button>
      </DialogTrigger>
      <DialogContent
        className="gap-0 overflow-hidden border border-border bg-background p-0 shadow-xl sm:max-w-lg"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>搜索站内内容</DialogTitle>
          <DialogDescription>搜索文章、见闻、分类和标签。</DialogDescription>
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
                className="h-10 border-border/80 bg-background pl-10 transition-colors hover:bg-muted/30 focus-visible:bg-background"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-md border border-primary bg-primary px-4 text-sm font-medium text-primary-foreground transition-[background-color,color] hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              搜索
            </button>
            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              aria-label="关闭搜索"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" suppressHydrationWarning />
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
