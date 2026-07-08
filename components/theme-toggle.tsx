"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps = {}) {
  const { setTheme, theme } = useTheme();

  return (
    <button
      type="button"
      className={cn(
        "relative flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 bg-transparent text-neutral-600 outline-none transition-colors hover:bg-neutral-900 hover:text-white focus-visible:ring-2 focus-visible:ring-ring/50 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-white dark:hover:text-black",
        className
      )}
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      aria-label="切换主题"
    >
      <Sun
        className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
        suppressHydrationWarning
      />
      <Moon
        className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
        suppressHydrationWarning
      />
      <span className="sr-only">切换主题</span>
    </button>
  );
}
