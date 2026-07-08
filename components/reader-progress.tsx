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
    <div className="fixed left-0 right-0 top-20 z-50 h-[2px] bg-neutral-100 dark:bg-neutral-900">
      <div
        className="h-full bg-slate-950 transition-[width] duration-75 dark:bg-white"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
