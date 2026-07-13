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
        "relative flex h-8 w-8 items-center justify-center rounded-full border border-border bg-transparent text-muted-foreground outline-none transition-colors hover:border-foreground/40 hover:bg-foreground hover:text-background focus-visible:ring-2 focus-visible:ring-ring/50",
        className
      )}
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      aria-label="切换主题"
    >
      <Sun
        className="h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
        suppressHydrationWarning
      />
      <Moon
        className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
        suppressHydrationWarning
      />
      <span className="sr-only">切换主题</span>
    </button>
  );
}
