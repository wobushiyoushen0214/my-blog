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
        "relative inline-flex size-10 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-[background-color,color,border-color] hover:border-primary/50 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
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
