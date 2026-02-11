/*
 * @Author: LiZhiWei
 * @Date: 2026-02-11 14:08:59
 * @LastEditors: LiZhiWei
 * @LastEditTime: 2026-02-11 14:25:30
 * @Description: 
 */
"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchBar } from "@/components/search-bar";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-base font-semibold tracking-tight">
            Lee
          </span>
        </Link>

        <div className="flex items-center gap-0.5">
          <SearchBar />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
