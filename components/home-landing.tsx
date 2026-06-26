"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronDown } from "lucide-react";
import { BlurText } from "@/components/blur-text";

export function HomeLanding({ children }: { children: React.ReactNode }) {
  const secondRef = useRef<HTMLDivElement | null>(null);
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

  const enterSecond = useCallback((behavior: ScrollBehavior) => {
    secondRef.current?.scrollIntoView({ behavior, block: "start" });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex((i) => (i + 1) % quotes.length);
    }, 4800);
    return () => clearInterval(timer);
  }, [quotes.length]);

  return (
    <div>
      <section className="relative min-h-[100svh] overflow-hidden">
        <div className="absolute inset-0 rb-aurora" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/50 to-background" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:64px_64px] opacity-[0.16]" />

        <div className="relative mx-auto flex min-h-[100svh] w-full max-w-[1440px] flex-col justify-center px-4 py-24 md:px-6">
          <div className="max-w-3xl rb-rise">
            <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-border/60 bg-background/60 px-2.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
              <span className="size-1.5 rounded-full bg-primary" />
              技术、产品与生活记录
            </div>

            <h1 className="text-4xl font-semibold tracking-tight leading-[1.08] sm:text-5xl md:text-6xl">
              <BlurText
                text="Lee 的个人博客"
                delay={150}
                animateBy="words"
                direction="top"
                className="inline-block"
              />
            </h1>
            <div className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
              <BlurText
                text="记录技术学习与生活思考，整理知识，也沉淀观点。"
                delay={50}
                animateBy="words"
                direction="bottom"
                className="inline-block"
              />
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/posts">
                  阅读文章
                  <ArrowRight className="h-4 w-4" suppressHydrationWarning />
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full bg-background/60 sm:w-auto"
                onClick={() => enterSecond("smooth")}
              >
                最近更新
                <ChevronDown className="h-4 w-4" suppressHydrationWarning />
              </Button>
            </div>

            <div className="mt-10 min-h-12 border-l border-primary/50 pl-4">
              <p key={quoteIndex} className="rb-fade-in text-lg font-medium leading-8 md:text-xl">
                {quotes[quoteIndex]}
              </p>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-6 hidden justify-center sm:flex">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 gap-2 rounded-md border border-border/40 bg-background/50 px-3 text-muted-foreground backdrop-blur-md hover:bg-background/80 hover:text-foreground"
            onClick={() => enterSecond("smooth")}
          >
            <span>下滑进入</span>
            <ChevronDown
              className="h-4 w-4 motion-safe:animate-bounce"
              suppressHydrationWarning
            />
          </Button>
        </div>
      </section>

      <div ref={secondRef}>{children}</div>
    </div>
  );
}
