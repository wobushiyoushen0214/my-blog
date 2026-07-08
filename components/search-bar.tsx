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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = query.trim();
    router.push(value ? `/search?q=${encodeURIComponent(value)}` : "/search");
  };

  return (
    <form
      onSubmit={handleSearch}
      className={cn("hidden max-w-[180px] sm:block", className)}
      role="search"
    >
      <label htmlFor="header-search" className="sr-only">
        搜索站内内容
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search
            className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500"
            suppressHydrationWarning
          />
        </div>
        <input
          ref={inputRef}
          id="header-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search indices..."
          aria-keyshortcuts="/"
          className="w-full rounded-full border border-neutral-200 bg-neutral-50/50 py-1.5 pl-8 pr-4 font-sans text-[10px] uppercase tracking-wider text-neutral-800 outline-none transition-all placeholder:text-neutral-400 focus:border-neutral-400 focus:bg-white dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-neutral-700 dark:focus:bg-[#0a0a0a]"
        />
      </div>
    </form>
  );
}
