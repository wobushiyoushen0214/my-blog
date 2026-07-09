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
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { DeviceShell } from "@/components/device-shell";
import {
  PublicPageShell,
  publicPrimaryButtonClassName,
  publicSecondaryButtonClassName,
} from "@/components/public-page";
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
    eyebrow: "Code",
    title: "把复杂界面拆成可维护的产品系统",
    description:
      "关注 React、Next.js、工程化、交互细节，以及从真实需求里长出来的前端架构。",
    icon: Code2,
  },
  {
    id: "writing",
    eyebrow: "Writing",
    title: "把项目里的判断、踩坑和方法沉淀下来",
    description:
      "博客保留原有功能，作为文章、见闻、标签和归档的内容系统继续运行。",
    icon: Terminal,
  },
  {
    id: "life",
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
    title: "文章",
    description: "长期技术笔记、项目复盘和工程实践。",
    icon: PenLine,
  },
  {
    href: "/moments",
    title: "见闻",
    description: "轻量观察、摘录和阶段性记录。",
    icon: Sparkles,
  },
  {
    href: "/archive",
    title: "归档",
    description: "按时间回看所有已经发布的内容。",
    icon: BookOpen,
  },
];

const monoLabel =
  "font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400 dark:text-neutral-500";

const enterBase =
  "animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both";

export default function PersonalHomePage() {
  return (
    <DeviceShell>
      <div className="public-device-layout">
        <Header />
        <PublicPageShell className="space-y-16 pb-20 pt-10 sm:space-y-20 sm:pt-14">
          <Hero />
          <FocusSection />
          <EntranceSection />
          <ClosingSection />
        </PublicPageShell>
        <Footer />
      </div>
    </DeviceShell>
  );
}

function Hero() {
  return (
    <section
      className={cn(
        enterBase,
        "border-b border-neutral-100 pb-12 dark:border-[#1a1a1f] sm:pb-16"
      )}
    >
      <p className={monoLabel}>Hello / 你好</p>
      <h1 className="mt-4 font-serif text-5xl font-light italic leading-none tracking-tight text-slate-950 dark:text-white sm:text-6xl">
        leempty
      </h1>

      <p className="mt-7 max-w-2xl font-serif text-lg font-light italic leading-relaxed text-neutral-500 dark:text-neutral-400 sm:text-xl">
        I build web products, write down engineering notes, and keep a small
        public notebook about code, tools and daily observations.
      </p>

      <div className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {roles.map((role, index) => (
          <span
            key={role}
            className="inline-flex items-center font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400 dark:text-neutral-500"
          >
            {role}
            {index < roles.length - 1 ? (
              <span className="ml-3 h-1 w-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
            ) : null}
          </span>
        ))}
      </div>

      <div className="mt-9 flex flex-wrap items-center gap-3">
        <Link
          href="/posts"
          className={cn(publicPrimaryButtonClassName, "gap-1.5")}
        >
          Read posts
          <ArrowUpRight className="h-3.5 w-3.5" suppressHydrationWarning />
        </Link>
        <Link
          href="/archive"
          className={cn(publicSecondaryButtonClassName, "gap-1.5")}
        >
          View archive
          <ArrowUpRight className="h-3.5 w-3.5" suppressHydrationWarning />
        </Link>
        <Link href="/rss.xml" className={publicSecondaryButtonClassName}>
          <Rss className="h-3.5 w-3.5" suppressHydrationWarning />
          RSS
        </Link>
      </div>
    </section>
  );
}

function FocusSection() {
  return (
    <section aria-labelledby="focus-heading" className="space-y-6">
      <SectionHeading
        eyebrow="Focus"
        title="What I spend time on"
        id="focus-heading"
      />
      <div className="grid gap-4 sm:grid-cols-3">
        {focusAreas.map((item, index) => (
          <section
            key={item.id}
            id={item.id}
            className={cn(
              "surface-card surface-card-hover group flex flex-col gap-4 p-6",
              enterBase,
              index === 1 && "delay-100",
              index === 2 && "delay-200"
            )}
          >
            <div className="flex items-center justify-between">
              <span className={monoLabel}>{item.eyebrow}</span>
              <item.icon
                className="h-4 w-4 text-neutral-300 transition-colors group-hover:text-neutral-500 dark:text-neutral-600 dark:group-hover:text-neutral-300"
                suppressHydrationWarning
              />
            </div>
            <h3 className="font-serif text-xl font-light italic leading-snug text-slate-950 dark:text-white">
              {item.title}
            </h3>
            <p className="text-xs leading-6 text-neutral-500 dark:text-neutral-400">
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
    <section aria-labelledby="entrance-heading" className="space-y-6">
      <SectionHeading
        eyebrow="Journal"
        title="博客功能保留在这里"
        id="entrance-heading"
        description="根路由用于个人介绍；文章、见闻、标签、归档、友链和 RSS 继续作为独立内容入口。"
      />
      <div className={cn("grid gap-8 border-t border-neutral-100 pt-8 dark:border-[#1a1a1f]", enterBase)}>
        {blogEntrances.map((item, index) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-start justify-between gap-6 py-1 transition-colors",
              "animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both",
              index === 1 && "delay-100",
              index === 2 && "delay-200"
            )}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <item.icon
                  className="h-4 w-4 shrink-0 text-neutral-300 transition-colors group-hover:text-slate-950 dark:text-neutral-600 dark:group-hover:text-white"
                  suppressHydrationWarning
                />
                <h3 className="font-serif text-2xl font-light italic leading-tight text-slate-950 transition-colors group-hover:text-slate-700 dark:text-white dark:group-hover:text-neutral-200">
                  {item.title}
                </h3>
              </div>
              <p className="mt-2 max-w-2xl pl-7 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                {item.description}
              </p>
            </div>
            <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-neutral-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-slate-950 dark:text-neutral-600 dark:group-hover:text-white" />
          </Link>
        ))}
      </div>
    </section>
  );
}

function ClosingSection() {
  return (
    <section
      className={cn(
        "surface-card space-y-6 p-7 sm:p-9",
        enterBase
      )}
    >
      <p className="max-w-3xl font-serif text-xl font-light italic leading-relaxed text-neutral-600 dark:text-neutral-300">
        这个个人页只负责第一印象和方向导航。更细的内容继续沉淀在博客系统里，避免把首页变成重复的信息列表。
      </p>
      <div className="grid gap-3 border-t border-neutral-100 pt-6 sm:grid-cols-2 lg:grid-cols-4 dark:border-[#1a1a1f]">
        <ContactLink
          href="mailto:hello@leempty.site"
          icon={Mail}
          label="hello@leempty.site"
        />
        <ContactLink href="/rss.xml" icon={Rss} label="RSS Feed" />
        <ContactLink href="/links" icon={LinkIcon} label="Links" />
        <ContactLink href="/archive" icon={MapPin} label="Suzhou, China" />
      </div>
    </section>
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
    <Link
      href={href}
      className="flex items-center gap-2 text-xs text-neutral-500 transition-colors hover:text-slate-950 dark:text-neutral-400 dark:hover:text-white"
    >
      <Icon className="h-3.5 w-3.5" suppressHydrationWarning />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  id,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  id?: string;
}) {
  return (
    <div className="space-y-2">
      <p className={monoLabel}>{eyebrow}</p>
      <h2
        id={id}
        className="font-serif text-3xl font-light italic leading-tight text-slate-950 dark:text-white sm:text-4xl"
      >
        {title}
      </h2>
      {description ? (
        <p className="max-w-2xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">
          {description}
        </p>
      ) : null}
    </div>
  );
}
