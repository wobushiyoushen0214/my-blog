"use client";

import { useEffect, useState } from "react";

export function ReaderProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;

      setProgress(scrollable > 0 ? Math.min((scrollTop / scrollable) * 100, 100) : 0);
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  return (
    <div className="fixed left-0 right-0 top-16 z-50 h-px bg-border/60 sm:top-20">
      <div
        className="h-full bg-foreground transition-[width] duration-75"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
