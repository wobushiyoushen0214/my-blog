"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import { Archive, ArrowRight, BookOpenText, Map, Tags } from "lucide-react";
import { cn } from "@/lib/utils";

type PixelStartMenuProps = {
  articleCount: number;
  momentCount: number;
  totalCount: number;
  totalViews: number;
};

type ModeKey = "posts" | "moments" | "tags" | "archive";

type Mode = {
  key: ModeKey;
  label: string;
  code: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  stat: (props: PixelStartMenuProps) => string;
  progress: (props: PixelStartMenuProps) => number;
  color: string;
  icon: LucideIcon;
};

const modes: Mode[] = [
  {
    key: "posts",
    label: "阅读",
    code: "QUEST",
    title: "主线任务",
    description: "进入技术笔记、项目复盘和长期主题。",
    href: "/posts",
    cta: "进入文章",
    stat: ({ articleCount }) => `${articleCount} 篇文章`,
    progress: ({ articleCount, totalCount }) =>
      totalCount > 0 ? Math.round((articleCount / totalCount) * 100) : 0,
    color: "var(--pixel-blue)",
    icon: BookOpenText,
  },
  {
    key: "moments",
    label: "见闻",
    code: "MAP",
    title: "地图事件",
    description: "浏览短记录、日常观察和路上的碎片。",
    href: "/moments",
    cta: "进入见闻",
    stat: ({ momentCount }) => `${momentCount} 条见闻`,
    progress: ({ momentCount, totalCount }) =>
      totalCount > 0 ? Math.round((momentCount / totalCount) * 100) : 0,
    color: "var(--pixel-green)",
    icon: Map,
  },
  {
    key: "tags",
    label: "标签",
    code: "BAG",
    title: "道具背包",
    description: "按关键词把相关内容串起来。",
    href: "/tag",
    cta: "打开标签",
    stat: ({ totalViews }) => `${totalViews.toLocaleString("zh-CN")} 次阅读`,
    progress: ({ totalViews }) => Math.min(100, Math.max(12, totalViews * 4)),
    color: "var(--pixel-yellow)",
    icon: Tags,
  },
  {
    key: "archive",
    label: "归档",
    code: "SAVE",
    title: "存档槽位",
    description: "按时间回看所有已经发布的记录。",
    href: "/archive",
    cta: "读取归档",
    stat: ({ totalCount }) => `${totalCount} 份存档`,
    progress: ({ totalCount }) => Math.min(100, Math.max(14, totalCount * 16)),
    color: "var(--pixel-red)",
    icon: Archive,
  },
];

export function PixelStartMenu(props: PixelStartMenuProps) {
  const [activeKey, setActiveKey] = useState<ModeKey>("posts");
  const activeMode = modes.find((mode) => mode.key === activeKey) || modes[0];
  const Icon = activeMode.icon;
  const progress = activeMode.progress(props);

  return (
    <section
      aria-labelledby="pixel-start-title"
      className="pixel-frame pixel-start-screen p-4 md:p-5"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="pixel-label text-primary">Press Start</p>
          <h1
            id="pixel-start-title"
            className="mt-2 text-2xl font-semibold leading-tight md:text-3xl"
          >
            选择状态
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            像进入游戏菜单一样，选择文章、见闻、标签或归档继续浏览。
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 font-mono text-xs text-muted-foreground sm:w-64">
          <span className="border border-border/70 bg-muted/50 px-2 py-1.5">
            BLOG OS
          </span>
          <span className="border border-border/70 bg-muted/50 px-2 py-1.5">
            {props.totalCount} LOGS
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-stretch">
        <div className="grid min-h-52 grid-rows-4 gap-2 sm:grid-cols-2 sm:grid-rows-2">
          {modes.map((mode) => {
            const ModeIcon = mode.icon;
            const active = mode.key === activeKey;

            return (
              <button
                key={mode.key}
                type="button"
                aria-pressed={active}
                data-active={active}
                onClick={() => setActiveKey(mode.key)}
                className="pixel-game-option h-full min-h-24 overflow-hidden p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                style={{ "--mode-color": mode.color } as CSSProperties}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="min-w-0">
                    <span className="pixel-label block text-muted-foreground">
                      {mode.code}
                    </span>
                    <span className="mt-1.5 block text-base font-semibold">
                      {mode.label}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center border border-border/70 bg-background text-muted-foreground",
                      active && "border-primary bg-primary text-primary-foreground"
                    )}
                  >
                    <ModeIcon className="h-4 w-4" suppressHydrationWarning />
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div
          className="pixel-cartridge-panel flex min-h-52 flex-col border border-border bg-card p-4"
          style={{ "--mode-color": activeMode.color } as CSSProperties}
        >
          <div className="flex min-h-14 items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="pixel-label text-muted-foreground">
                {activeMode.code}
              </p>
              <h2 className="mt-2 line-clamp-2 text-lg font-semibold leading-tight">
                {activeMode.title}
              </h2>
            </div>
            <span className="grid size-9 shrink-0 place-items-center border border-border/70 bg-muted text-primary">
              <Icon className="h-4 w-4" suppressHydrationWarning />
            </span>
          </div>
          <p className="mt-3 min-h-12 line-clamp-2 text-sm leading-6 text-muted-foreground">
            {activeMode.description}
          </p>
          <div className="mt-auto pt-4">
            <div className="flex items-center justify-between gap-3 font-mono text-xs text-muted-foreground">
              <span className="min-w-0 truncate">{activeMode.stat(props)}</span>
              <span className="shrink-0">{progress}%</span>
            </div>
            <div
              className="pixel-health-bar mt-2 h-2 border border-border/70"
              style={{ "--progress": `${progress}%` } as CSSProperties}
            />
          </div>
          <Link
            href={activeMode.href}
            className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 border border-primary bg-primary px-3 font-mono text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {activeMode.cta}
            <ArrowRight className="h-4 w-4" suppressHydrationWarning />
          </Link>
        </div>
      </div>
    </section>
  );
}
