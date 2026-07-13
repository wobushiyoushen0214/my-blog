"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Sliders,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ReaderFont = "sans" | "serif" | "mono";
type ReaderSize = "sm" | "base" | "lg" | "xl";
type ReaderWidth = "narrow" | "normal" | "wide";

type ReaderToolbarProps = {
  backHref: string;
};

export function ReaderToolbar({ backHref }: ReaderToolbarProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [saved, setSaved] = useState(false);
  const [font, setFont] = useState<ReaderFont>("sans");
  const [size, setSize] = useState<ReaderSize>("base");
  const [width, setWidth] = useState<ReaderWidth>("normal");

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.readerFont = font;
    root.dataset.readerSize = size;
    root.dataset.readerWidth = width;

    return () => {
      delete root.dataset.readerFont;
      delete root.dataset.readerSize;
      delete root.dataset.readerWidth;
    };
  }, [font, size, width]);

  return (
    <>
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link
          href={backHref}
          className="group inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/70 px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
        >
          <ArrowLeft
            className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1"
            suppressHydrationWarning
          />
          <span>返回列表</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSettings((value) => !value)}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] transition-colors",
              showSettings
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border/80 bg-card/70 text-muted-foreground hover:border-primary/30 hover:text-foreground"
            )}
          >
            <Sliders className="h-3 w-3" suppressHydrationWarning />
            <span>排版</span>
          </button>
          <button
            type="button"
            onClick={() => setSaved((value) => !value)}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] transition-colors",
              saved
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border/80 bg-card/70 text-muted-foreground hover:border-primary/30 hover:text-foreground"
            )}
          >
            {saved ? (
              <BookmarkCheck className="h-3 w-3" suppressHydrationWarning />
            ) : (
              <Bookmark className="h-3 w-3" suppressHydrationWarning />
            )}
            <span>{saved ? "已存" : "收藏"}</span>
          </button>
        </div>
      </div>

      {showSettings ? (
        <div className="signal-panel mb-8 p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <ReaderSegment
              label="字体"
              value={font}
              options={["sans", "serif", "mono"]}
              onChange={setFont}
            />
            <ReaderSegment
              label="字号"
              value={size}
              options={["sm", "base", "lg", "xl"]}
              onChange={setSize}
            />
            <ReaderSegment
              label="栏宽"
              value={width}
              options={["narrow", "normal", "wide"]}
              onChange={setWidth}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

function ReaderSegment<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: T[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="space-y-2">
      <span className="signal-meta block">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              "rounded-full px-3 py-1.5 text-[13px] transition-colors",
              value === option
                ? "bg-primary/10 font-medium text-primary"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
