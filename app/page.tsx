import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Code2,
  Gamepad2,
  Link as LinkIcon,
  Mail,
  MapPin,
  PenLine,
  Rss,
  Sparkles,
  Terminal,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const roles = [
  "Frontend Developer",
  "Product Builder",
  "Technical Writer",
  "Digital Tinkerer",
];

const focusAreas = [
  {
    id: "code",
    number: "01",
    eyebrow: "Code",
    title: "把复杂界面拆成可维护的产品系统",
    description:
      "关注 React、Next.js、工程化、交互细节，以及从真实需求里长出来的前端架构。",
    icon: Code2,
  },
  {
    id: "writing",
    number: "02",
    eyebrow: "Writing",
    title: "把项目里的判断、踩坑和方法沉淀下来",
    description:
      "博客保留原有功能，作为文章、见闻、标签和归档的内容系统继续运行。",
    icon: Terminal,
  },
  {
    id: "life",
    number: "03",
    eyebrow: "Life",
    title: "记录工具、游戏、音乐和日常灵感",
    description:
      "个人页负责快速介绍我是谁，博客负责承载更完整的内容和上下文。",
    icon: Gamepad2,
  },
];

const blogEntrances = [
  {
    href: "/posts",
    number: "01",
    title: "文章",
    description: "长期技术笔记、项目复盘和工程实践。",
    icon: PenLine,
  },
  {
    href: "/moments",
    number: "02",
    title: "见闻",
    description: "轻量观察、摘录和阶段性记录。",
    icon: Sparkles,
  },
  {
    href: "/archive",
    number: "03",
    title: "归档",
    description: "按时间回看所有已经发布的内容。",
    icon: BookOpen,
  },
  {
    href: "/links",
    number: "04",
    title: "友链",
    description: "长期阅读和互相连接的站点。",
    icon: LinkIcon,
  },
];

const ruleCls = "border-t border-neutral-200 dark:border-[#1f1f26]";

export default function PersonalHomePage() {
  return (
    <div className="relative min-h-screen">
      <div aria-hidden className="home-glow" />
      <div aria-hidden className="home-grain" />
      <div aria-hidden className="home-vignette" />
      <div className="relative z-10">
        <Hero />
        <FocusSection />
        <EntranceSection />
        <ClosingSection />
        <StandaloneFooter />
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col justify-center px-5 py-24 sm:px-8">
      {/* corner controls — no bar */}
      <div className="absolute right-5 top-6 flex items-center gap-4 sm:right-8 sm:top-8">
        <Link
          href="/rss.xml"
          className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400 transition-colors hover:text-foreground dark:text-neutral-500"
        >
          RSS
        </Link>
        <ThemeToggle />
      </div>

      <div className="grid items-end gap-10 md:grid-cols-[minmax(0,1fr)_20rem] md:gap-16">
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">
            01 — Hello / 你好
          </p>
          <h1 className="mt-6 font-serif text-7xl font-light italic leading-[0.88] tracking-tight text-slate-950 dark:text-white sm:text-8xl">
            leempty.
          </h1>
          <div className={cn(ruleCls, "mt-8 w-24")} />
          <p className="mt-8 max-w-xl font-serif text-lg font-light italic leading-relaxed text-neutral-500 dark:text-neutral-400 sm:text-xl">
            I build web products, write down engineering notes, and keep a small
            public notebook about code, tools and daily observations.
          </p>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 fill-mode-both delay-150 md:pb-2">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">
            — Roles
          </p>
          <ul className="mt-5 space-y-2.5">
            {roles.map((role) => (
              <li
                key={role}
                className="flex items-baseline gap-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400"
              >
                <span className="text-neutral-300 dark:text-neutral-700">/</span>
                <span>{role}</span>
              </li>
            ))}
          </ul>
          <div className={cn(ruleCls, "mt-6")} />
          <p className="mt-5 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400 dark:text-neutral-500">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Available for work
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/posts"
              className="inline-flex h-10 items-center gap-1.5 rounded-md border border-foreground bg-foreground px-5 font-mono text-[10px] font-bold uppercase tracking-wider text-background transition-colors hover:bg-foreground/85"
            >
              Read posts
              <ArrowUpRight className="h-3.5 w-3.5" suppressHydrationWarning />
            </Link>
            <Link
              href="/archive"
              className="inline-flex h-10 items-center gap-1.5 rounded-md border border-border bg-transparent px-5 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
            >
              Archive
              <ArrowUpRight className="h-3.5 w-3.5" suppressHydrationWarning />
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute bottom-7 left-5 font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-600 sm:left-8">
        <span className="hidden sm:inline">Scroll</span>
        <span className="ml-2 inline-block animate-bounce">↓</span>
      </div>
    </section>
  );
}

function SectionHeader({
  number,
  label,
  title,
  description,
  id,
}: {
  number: string;
  label: string;
  title: string;
  description?: string;
  id?: string;
}) {
  return (
    <header className="grid gap-6 border-t border-neutral-200 pt-8 dark:border-[#1f1f26] md:grid-cols-[minmax(0,1fr)_22rem] md:gap-12">
      <div>
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">
          {number} — {label}
        </p>
        <h2
          id={id}
          className="mt-5 font-serif text-4xl font-light italic leading-[1.05] tracking-tight text-slate-950 dark:text-white sm:text-5xl"
        >
          {title}
        </h2>
      </div>
      {description ? (
        <p className="max-w-sm text-sm leading-7 text-neutral-500 dark:text-neutral-400 md:pb-1">
          {description}
        </p>
      ) : null}
    </header>
  );
}

function FocusSection() {
  return (
    <section
      aria-labelledby="focus-heading"
      className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-24"
    >
      <SectionHeader
        number="02"
        label="Focus"
        title="What I spend time on"
        id="focus-heading"
        description="三个方向并行：写代码、写文字、记日常。彼此互相喂养。"
      />
      <div className="mt-12 grid gap-px overflow-hidden rounded-md border border-neutral-200 bg-neutral-200 dark:border-[#1f1f26] dark:bg-[#1f1f26] sm:grid-cols-3">
        {focusAreas.map((item, index) => (
          <section
            key={item.id}
            id={item.id}
            className={cn(
              "surface-card-hover group flex flex-col gap-5 bg-white p-7 transition-colors duration-200 hover:bg-neutral-50 dark:bg-[#0d0d0d] dark:hover:bg-[#16161a] animate-in fade-in slide-in-from-bottom-4 duration-600 fill-mode-both",
              index === 1 && "delay-100",
              index === 2 && "delay-200"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">
                {item.number} / {item.eyebrow}
              </span>
              <item.icon
                className="h-4 w-4 text-neutral-300 transition-colors group-hover:text-slate-950 dark:text-neutral-600 dark:group-hover:text-white"
                suppressHydrationWarning
              />
            </div>
            <h3 className="font-serif text-2xl font-light italic leading-snug text-slate-950 dark:text-white">
              {item.title}
            </h3>
            <p className="text-sm leading-7 text-neutral-500 dark:text-neutral-400">
              {item.description}
            </p>
          </section>
        ))}
      </div>
    </section>
  );
}

function EntranceSection() {
  return (
    <section
      aria-labelledby="entrance-heading"
      className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-24"
    >
      <SectionHeader
        number="03"
        label="Journal"
        title="博客功能保留在这里"
        id="entrance-heading"
        description="根路由用于个人介绍；文章、见闻、归档、友链和 RSS 继续作为独立内容入口。"
      />
      <ul className="mt-12 divide-y divide-neutral-200 border-t border-b border-neutral-200 dark:divide-[#1f1f26] dark:border-[#1f1f26]">
        {blogEntrances.map((item, index) => (
          <li
            key={item.href}
            className={cn(
              "animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both",
              index === 1 && "delay-75",
              index === 2 && "delay-150",
              index === 3 && "delay-200"
            )}
          >
            <Link
              href={item.href}
              className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-6 py-7 transition-colors"
            >
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-300 dark:text-neutral-700">
                {item.number}
              </span>
              <div className="flex min-w-0 items-center gap-4">
                <item.icon
                  className="h-5 w-5 shrink-0 text-neutral-300 transition-colors group-hover:text-slate-950 dark:text-neutral-600 dark:group-hover:text-white"
                  suppressHydrationWarning
                />
                <div className="min-w-0">
                  <h3 className="font-serif text-3xl font-light italic leading-tight text-slate-950 transition-colors group-hover:text-slate-700 dark:text-white dark:group-hover:text-neutral-200">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                    {item.description}
                  </p>
                </div>
              </div>
              <ArrowUpRight className="h-5 w-5 shrink-0 text-neutral-300 transition-all duration-200 group-hover:translate-x-1 group-hover:text-slate-950 dark:text-neutral-600 dark:group-hover:text-white" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ClosingSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
      <SectionHeader number="04" label="Colophon" title="关于这个站点" />
      <div className="mt-12 grid gap-12 md:grid-cols-[minmax(0,1fr)_20rem] md:gap-16">
        <p className="max-w-2xl font-serif text-2xl font-light italic leading-relaxed text-neutral-600 dark:text-neutral-300">
          这个个人页只负责第一印象和方向导航。更细的内容继续沉淀在博客系统里，避免把首页变成重复的信息列表。
        </p>
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">
            — Contact
          </p>
          <ul className="mt-5 space-y-3">
            <ContactLink
              href="mailto:hello@leempty.site"
              icon={Mail}
              label="hello@leempty.site"
            />
            <ContactLink href="/rss.xml" icon={Rss} label="RSS Feed" />
            <ContactLink href="/links" icon={LinkIcon} label="Links" />
            <ContactLink href="/archive" icon={MapPin} label="Suzhou, China" />
          </ul>
        </div>
      </div>
    </section>
  );
}

function StandaloneFooter() {
  return (
    <footer className="mx-auto w-full max-w-6xl border-t border-neutral-200 px-5 py-10 dark:border-[#1f1f26] sm:px-8">
      <div className="flex flex-col gap-3 font-mono text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-600 sm:flex-row sm:items-center sm:justify-between">
        <span>© {new Date().getFullYear()} leempty</span>
        <span>Set in Lora &amp; JetBrains Mono</span>
      </div>
    </footer>
  );
}

function ContactLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Mail;
  label: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="group flex items-center gap-3 text-sm text-neutral-500 transition-colors hover:text-slate-950 dark:text-neutral-400 dark:hover:text-white"
      >
        <Icon
          className="h-4 w-4 text-neutral-300 transition-colors group-hover:text-slate-950 dark:text-neutral-600 dark:group-hover:text-white"
          suppressHydrationWarning
        />
        <span className="truncate">{label}</span>
      </Link>
    </li>
  );
}
