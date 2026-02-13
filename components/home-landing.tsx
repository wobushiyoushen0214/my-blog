"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { BlurText } from "@/components/blur-text";

export function HomeLanding({ children }: { children: React.ReactNode }) {
  const secondRef = useRef<HTMLDivElement | null>(null);
  const [entered, setEntered] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);

  const quotes = useMemo(
    () => [
      "保持好奇，持续构建。",
      "少即是多，清晰即力量。",
      "写下所学，记录所见。",
      "把复杂留给系统，把简单留给用户。",
    ],
    []
  );

  const getSecondTop = () => secondRef.current?.offsetTop ?? 0;

  const enterSecond = useCallback((behavior: ScrollBehavior) => {
    setEntered((prev) => {
      if (prev) return prev;
      const top = getSecondTop();
      window.scrollTo({ top, behavior });
      return true;
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex((i) => (i + 1) % quotes.length);
    }, 4800);
    return () => clearInterval(timer);
  }, [quotes.length]);

  useEffect(() => {
    const onScroll = () => {
      const top = getSecondTop();
      if (!entered) {
        if (top > 0 && window.scrollY >= top - 40) {
          enterSecond("auto");
        }
        return;
      }
      if (window.scrollY < top) {
        window.scrollTo({ top, behavior: "auto" });
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (!entered) {
        if (e.deltaY > 0) {
          e.preventDefault();
          enterSecond("smooth");
        }
        return;
      }

      const top = getSecondTop();
      if (e.deltaY < 0 && window.scrollY <= top + 2) {
        e.preventDefault();
        window.scrollTo({ top, behavior: "auto" });
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!entered) return;
      const top = getSecondTop();
      if (window.scrollY <= top + 2) {
        e.preventDefault();
        window.scrollTo({ top, behavior: "auto" });
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [entered, enterSecond]);

  return (
    <div>
      <section className="relative h-[100svh] overflow-hidden">
        <div className="absolute inset-0 rb-aurora" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/60 to-background" />

        <div className="relative mx-auto flex h-full w-full max-w-[1440px] flex-col justify-center px-4 md:px-6">
          <div className="max-w-3xl">
            <h1 className="mt-6 text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
              <BlurText
                text="Lee 的个人博客"
                delay={150}
                animateBy="words"
                direction="top"
                className="inline-block"
              />
            </h1>
            <div className="mt-5 text-base md:text-lg text-muted-foreground leading-relaxed">
              <BlurText
                text="记录技术学习与生活思考，整理知识，也沉淀观点。"
                delay={50}
                animateBy="words"
                direction="bottom"
                className="inline-block"
              />
            </div>

            <div className="mt-10 rounded-2xl border border-border/50 bg-background/60 p-6 shadow-sm backdrop-blur">
              <div className="mt-3 min-h-[2.5rem]">
                <p key={quoteIndex} className="rb-fade-in text-lg md:text-xl font-semibold">
                  {quotes[quoteIndex]}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-6 flex justify-center">
          <Button
            type="button"
            variant="ghost"
            className="h-11 rounded-full px-5 gap-3 border border-border/40 bg-background/30 text-muted-foreground shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-background/70 hover:text-foreground hover:shadow-md"
            onClick={() => enterSecond("smooth")}
          >
            <span className="text-sm font-medium">下滑进入</span>
            <span className="h-4 w-px bg-border/60" />
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border/60 bg-background/80 text-foreground/80">
              <ChevronDown
                className="h-4 w-4 motion-safe:animate-bounce"
                suppressHydrationWarning
              />
            </span>
          </Button>
        </div>
      </section>

      <div ref={secondRef}>{children}</div>
    </div>
  );
}
