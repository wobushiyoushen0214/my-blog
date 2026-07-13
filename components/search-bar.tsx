"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
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
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        setOpen(true);
        requestAnimationFrame(() => inputRef.current?.focus());
      }

      if (event.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = query.trim();
    router.push(value ? `/search?q=${encodeURIComponent(value)}` : "/search");
    setOpen(false);
  };

  return (
    <form
      onSubmit={handleSearch}
      className={cn("hidden items-center sm:flex", className)}
      role="search"
    >
      <label htmlFor="header-search" className="sr-only">
        搜索站内内容
      </label>
      <div
        className={cn(
          "flex h-9 items-center overflow-hidden border-b bg-transparent transition-[width,border-color] duration-200",
          open || query
            ? "w-48 border-foreground/25"
            : "w-9 border-transparent hover:border-border/80"
        )}
      >
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            requestAnimationFrame(() => inputRef.current?.focus());
          }}
          className="flex h-9 w-9 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          aria-label="打开搜索"
        >
          <Search className="h-3.5 w-3.5" suppressHydrationWarning />
        </button>
        <input
          ref={inputRef}
          id="header-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            if (!query) setOpen(false);
          }}
          placeholder="搜索 /"
          aria-keyshortcuts="/"
          className={cn(
            "h-9 w-full bg-transparent pr-3 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/70",
            open || query ? "opacity-100" : "pointer-events-none opacity-0"
          )}
        />
      </div>
    </form>
  );
}
