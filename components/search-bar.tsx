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
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:w-24 sm:justify-start"
          aria-keyshortcuts="/"
        >
          <Search className="h-4 w-4" suppressHydrationWarning />
          <span className="sr-only sm:not-sr-only">搜索</span>
        </button>
      </DialogTrigger>
      <DialogContent
        className="gap-0 overflow-hidden border border-border/70 bg-background p-0 shadow-none sm:max-w-lg"
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
                className="h-10 rounded-md border-border/60 bg-background pl-10 shadow-none transition-colors hover:bg-muted/30 focus-visible:bg-background"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-md border border-border/60 px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              搜索
            </button>
            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
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
