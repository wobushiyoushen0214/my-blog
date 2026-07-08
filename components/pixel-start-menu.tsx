"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Archive,
  ArrowRight,
  BookOpenText,
  Map,
  Search,
  Tags,
} from "lucide-react";
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
    code: "Library",
    title: "文章库",
    description: "系统化的技术笔记、项目复盘和长期主题。",
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
    code: "Field notes",
    title: "见闻流",
    description: "轻量记录、日常观察和阶段性摘录。",
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
    code: "Topics",
    title: "标签索引",
    description: "按关键词组织文章脉络，快速定位相关内容。",
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
    code: "Archive",
    title: "时间归档",
    description: "按发布时间回看所有已经沉淀的记录。",
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
      className="studio-hero"
    >
      <div className="studio-hero-copy">
        <p className="studio-eyebrow">Lee Studio</p>
        <div className="studio-hero-heading">
          <h1
            id="pixel-start-title"
            className="text-4xl font-semibold leading-[1.04] tracking-tight md:text-6xl"
          >
            把工程实践、项目复盘和日常观察整理成可检索的记录。
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            面向长期阅读的个人知识库。文章沉淀方法和系统，见闻保存阶段性想法，标签和归档帮助快速回到上下文。
          </p>
        </div>

        <div className="studio-hero-actions">
          <Link href="/posts" className="studio-primary-link">
            开始阅读
            <ArrowRight className="h-4 w-4" suppressHydrationWarning />
          </Link>
          <Link href="/search" className="studio-secondary-link">
            <Search className="h-4 w-4" suppressHydrationWarning />
            搜索内容
          </Link>
        </div>

        <div className="studio-stat-grid" aria-label="站点统计">
          <span>
            <strong>{props.articleCount}</strong>
            文章
          </span>
          <span>
            <strong>{props.momentCount}</strong>
            见闻
          </span>
          <span>
            <strong>{props.totalCount}</strong>
            总记录
          </span>
        </div>
      </div>

      <div className="studio-hero-panel">
        <div className="grid gap-2">
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
                className="studio-route-card"
                style={{ "--mode-color": mode.color } as CSSProperties}
              >
                <span
                  className={cn(
                    "studio-route-icon",
                    active && "studio-route-icon-active"
                  )}
                >
                  <ModeIcon className="h-4 w-4" suppressHydrationWarning />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    {mode.title}
                  </span>
                  <span className="mt-1 line-clamp-1 block text-xs text-muted-foreground">
                    {mode.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div
          className="studio-insight-panel"
          style={{ "--mode-color": activeMode.color } as CSSProperties}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="studio-eyebrow text-muted-foreground">
                {activeMode.code}
              </p>
              <h2 className="mt-3 text-2xl font-semibold leading-tight">
                {activeMode.title}
              </h2>
            </div>
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Icon className="h-4 w-4" suppressHydrationWarning />
            </span>
          </div>
          <p className="mt-4 min-h-12 text-sm leading-6 text-muted-foreground">
            {activeMode.description}
          </p>
          <div className="mt-auto pt-4">
            <div className="flex items-center justify-between gap-3 font-mono text-xs text-muted-foreground">
              <span className="min-w-0 truncate">{activeMode.stat(props)}</span>
              <span className="shrink-0">{progress}%</span>
            </div>
            <div
              className="studio-progress-line mt-2"
              style={{ "--progress": `${progress}%` } as CSSProperties}
            />
          </div>
          <Link
            href={activeMode.href}
            className="studio-panel-link"
          >
            {activeMode.cta}
            <ArrowRight className="h-4 w-4" suppressHydrationWarning />
          </Link>
        </div>
      </div>
    </section>
  );
}
