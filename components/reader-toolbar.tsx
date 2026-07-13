"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Sliders,
} from "lucide-react";

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
      <div className="mb-10 flex items-center justify-between gap-4">
        <Link
          href={backHref}
          className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft
            className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1"
            suppressHydrationWarning
          />
          <span>Back to Garden</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSettings((value) => !value)}
            className={
              showSettings
                ? "flex h-8 items-center gap-1.5 rounded-full border border-foreground bg-foreground px-4 text-[10px] font-bold uppercase tracking-wider text-background transition-colors"
                : "flex h-8 items-center gap-1.5 rounded-full border border-border px-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-muted/40"
            }
          >
            <Sliders className="h-3 w-3" suppressHydrationWarning />
            <span>Typography</span>
          </button>
          <button
            type="button"
            onClick={() => setSaved((value) => !value)}
            className={
              saved
                ? "flex h-8 items-center gap-1.5 rounded-full border border-foreground bg-foreground px-4 text-[10px] font-bold uppercase tracking-wider text-background transition-colors"
                : "flex h-8 items-center gap-1.5 rounded-full border border-border px-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-muted/40"
            }
          >
            {saved ? (
              <BookmarkCheck className="h-3 w-3" suppressHydrationWarning />
            ) : (
              <Bookmark className="h-3 w-3" suppressHydrationWarning />
            )}
            <span>{saved ? "Saved" : "Save"}</span>
          </button>
        </div>
      </div>

      {showSettings ? (
        <div className="mb-8 rounded-md border border-border bg-card/60 p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <ReaderSegment
              label="Font Family"
              value={font}
              options={["sans", "serif", "mono"]}
              onChange={setFont}
            />
            <ReaderSegment
              label="Font Size"
              value={size}
              options={["sm", "base", "lg", "xl"]}
              onChange={setSize}
            />
            <ReaderSegment
              label="Column Width"
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
      <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </span>
      <div className="flex rounded-sm border border-border bg-muted/30 p-1">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={
              value === option
                ? "flex-1 rounded-sm bg-foreground py-1.5 text-[10px] font-bold uppercase tracking-wider text-background shadow-sm transition-all"
                : "flex-1 rounded-sm py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-all hover:text-foreground"
            }
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
