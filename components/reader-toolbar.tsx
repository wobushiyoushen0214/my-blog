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
      <div className="mb-8 flex items-center justify-between gap-4 border-b border-border/70 pb-4">
        <Link
          href={backHref}
          className="group inline-flex items-center gap-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft
            className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5"
            suppressHydrationWarning
          />
          <span>返回列表</span>
        </Link>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setShowSettings((value) => !value)}
            className={cn(
              "inline-flex items-center gap-1.5 text-[13px] transition-colors",
              showSettings
                ? "font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Sliders className="h-3 w-3" suppressHydrationWarning />
            <span>排版</span>
          </button>
          <button
            type="button"
            onClick={() => setSaved((value) => !value)}
            className={cn(
              "inline-flex items-center gap-1.5 text-[13px] transition-colors",
              saved
                ? "font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
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
        <div className="mb-8 border-b border-border/70 pb-6">
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
      <span className="mb-2 block text-[12px] text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              "py-1 text-[13px] transition-colors",
              value === option
                ? "font-medium text-foreground underline decoration-foreground/40 underline-offset-6"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
