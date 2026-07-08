"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  BookOpen,
  Code2,
  Gamepad2,
  Link as LinkIcon,
  Mail,
  MapPin,
  Music2,
  PenLine,
  Rss,
  Sparkles,
  Terminal,
} from "lucide-react";
import { motion } from "motion/react";
import type { IconType } from "react-icons";
import {
  SiNextdotjs,
  SiReact,
  SiSupabase,
  SiTailwindcss,
  SiTypescript,
  SiVercel,
} from "react-icons/si";

const profileLinks = [
  { href: "/posts", label: "Blog" },
  { href: "/moments", label: "Moments" },
  { href: "/tag", label: "Tags" },
  { href: "/links", label: "Links" },
];

const roles = [
  "Frontend Developer",
  "Product Builder",
  "Technical Writer",
  "Digital Tinkerer",
];

const blogEntrances = [
  {
    href: "/posts",
    title: "文章",
    description: "长期技术笔记、项目复盘和工程实践。",
    meta: "Essays",
    icon: PenLine,
  },
  {
    href: "/moments",
    title: "见闻",
    description: "轻量观察、摘录和阶段性记录。",
    meta: "Field Logs",
    icon: Sparkles,
  },
  {
    href: "/archive",
    title: "归档",
    description: "按时间回看所有已经发布的内容。",
    meta: "Archive",
    icon: BookOpen,
  },
];

const focusAreas = [
  {
    id: "code",
    eyebrow: "Code",
    title: "把复杂界面拆成可维护的产品系统。",
    description:
      "关注 React、Next.js、工程化、交互细节，以及从真实需求里长出来的前端架构。",
    icon: Code2,
  },
  {
    id: "writing",
    eyebrow: "Writing",
    title: "把项目里的判断、踩坑和方法沉淀下来。",
    description:
      "博客保留原有功能，作为文章、见闻、标签和归档的内容系统继续运行。",
    icon: Terminal,
  },
  {
    id: "life",
    eyebrow: "Life",
    title: "记录工具、游戏、音乐和日常灵感。",
    description:
      "个人页负责快速介绍我是谁，博客负责承载更完整的内容和上下文。",
    icon: Gamepad2,
  },
];

const techOrbit: Array<{
  label: string;
  icon: IconType;
  className: string;
  delay: number;
}> = [
  {
    label: "Next.js",
    icon: SiNextdotjs,
    className: "left-8 top-20",
    delay: 0,
  },
  {
    label: "React",
    icon: SiReact,
    className: "right-10 top-24",
    delay: 0.8,
  },
  {
    label: "TypeScript",
    icon: SiTypescript,
    className: "bottom-24 left-12",
    delay: 1.5,
  },
  {
    label: "Tailwind",
    icon: SiTailwindcss,
    className: "bottom-20 right-12",
    delay: 2.2,
  },
  {
    label: "Supabase",
    icon: SiSupabase,
    className: "left-1/2 top-8 -translate-x-1/2",
    delay: 2.8,
  },
  {
    label: "Vercel",
    icon: SiVercel,
    className: "bottom-8 left-1/2 -translate-x-1/2",
    delay: 3.4,
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
};

export default function PersonalHomePage() {
  return (
    <main className="min-h-screen bg-[#f5f2ea] text-slate-800">
      <PersonalHeader />

      <motion.section
        id="home"
        {...fadeUp}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center px-4 pb-20 pt-28 sm:px-8 lg:px-10"
      >
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.72fr)]">
          <div className="relative">
            <motion.div
              whileHover={{ rotate: -1, y: -4 }}
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
              className="relative max-w-xl border border-slate-900/10 bg-[#fffaf0] p-6 shadow-[12px_12px_0_rgba(15,23,42,0.12)] sm:p-8"
            >
              <p className="text-lg font-extrabold text-slate-900">
                My name is:
              </p>
              <h1 className="mt-5 border-b-2 border-slate-800 pb-5 font-serif text-5xl font-black italic leading-none text-orange-500 sm:text-7xl">
                leempty
              </h1>
              <div className="mt-6 text-right">
                <p className="mb-3 text-left text-lg font-extrabold text-slate-900">
                  I&apos;m a:
                </p>
                <ul className="space-y-1 text-xl font-semibold leading-tight text-slate-800 sm:text-2xl">
                  {roles.map((role) => (
                    <li key={role}>
                      <a
                        href="#code"
                        className="underline decoration-transparent underline-offset-4 transition-colors hover:text-orange-500 hover:decoration-orange-400"
                      >
                        {role}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="absolute -bottom-5 -left-5 h-16 w-16 bg-orange-400" />
            </motion.div>

            <p className="mt-10 max-w-3xl text-2xl font-medium leading-snug text-slate-700 sm:text-3xl">
              I build web products, write down engineering notes, and keep a
              small public notebook about code, tools and daily observations.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, rotate: 2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative min-h-[28rem] overflow-hidden border border-slate-900/10 bg-slate-900 p-6 text-[#f5f2ea] shadow-[12px_12px_0_rgba(15,23,42,0.14)]"
          >
            <div className="absolute inset-8 border border-dashed border-white/15" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
              className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
              className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20"
            />
            {techOrbit.map((tech) => (
              <OrbitIcon key={tech.label} {...tech} />
            ))}
            <div className="relative z-10 flex h-full min-h-[24rem] flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.25em] text-white/45">
                <span>Profile</span>
                <span>Suzhou, China</span>
              </div>
              <div className="mx-auto grid h-36 w-36 place-items-center border border-white/20 bg-white/10 text-center backdrop-blur">
                <span className="font-serif text-5xl font-black italic text-orange-400">
                  le
                </span>
              </div>
              <div className="grid gap-3 text-sm text-white/70 sm:grid-cols-2">
                <a
                  href="mailto:hello@leempty.site"
                  className="flex items-center gap-2 transition-colors hover:text-white"
                >
                  <Mail className="h-4 w-4" suppressHydrationWarning />
                  hello@leempty.site
                </a>
                <Link
                  href="/rss.xml"
                  className="flex items-center gap-2 transition-colors hover:text-white"
                >
                  <Rss className="h-4 w-4" suppressHydrationWarning />
                  RSS Feed
                </Link>
                <Link
                  href="/links"
                  className="flex items-center gap-2 transition-colors hover:text-white"
                >
                  <LinkIcon className="h-4 w-4" suppressHydrationWarning />
                  Links
                </Link>
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" suppressHydrationWarning />
                  Remote / Web
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        id="blog"
        {...fadeUp}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        viewport={{ once: true, amount: 0.25 }}
        whileInView="animate"
        className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-8 lg:px-10"
      >
        <div className="flex flex-col gap-4 border-b border-slate-900/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-orange-500">
              Blog System
            </p>
            <h2 className="mt-3 font-serif text-4xl font-black italic text-slate-900">
              博客功能保留在这里。
            </h2>
          </div>
          <p className="max-w-lg text-sm leading-6 text-slate-600">
            根路由用于个人介绍；文章、见闻、标签、归档、友链和 RSS 继续作为独立内容入口。
          </p>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {blogEntrances.map((item) => (
            <FeatureLink key={item.href} {...item} />
          ))}
        </div>
      </motion.section>

      <motion.section
        {...fadeUp}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        viewport={{ once: true, amount: 0.25 }}
        whileInView="animate"
        className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-8 lg:px-10"
      >
        <div className="grid gap-5 lg:grid-cols-3">
          {focusAreas.map((item) => (
            <motion.section
              key={item.id}
              id={item.id}
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="border border-slate-900/10 bg-white/55 p-6"
            >
              <div className="mb-12 flex items-center justify-between">
                <span className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-orange-500">
                  {item.eyebrow}
                </span>
                <item.icon
                  className="h-5 w-5 text-slate-500"
                  suppressHydrationWarning
                />
              </div>
              <h3 className="font-serif text-2xl font-black italic leading-tight text-slate-900">
                {item.title}
              </h3>
              <p className="mt-5 text-sm leading-6 text-slate-600">
                {item.description}
              </p>
            </motion.section>
          ))}
        </div>
      </motion.section>

      <motion.section
        {...fadeUp}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        viewport={{ once: true, amount: 0.25 }}
        whileInView="animate"
        className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-8 lg:px-10"
      >
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="bg-slate-900 p-8 text-[#f5f2ea]">
            <Music2 className="h-7 w-7 text-orange-400" suppressHydrationWarning />
            <h2 className="mt-8 font-serif text-4xl font-black italic">
              Space for projects, games and music.
            </h2>
          </div>
          <div className="border border-slate-900/10 bg-[#fffaf0] p-8">
            <p className="text-2xl font-medium leading-snug text-slate-700">
              这个个人页只负责第一印象和方向导航。更细的内容继续沉淀在博客系统里，避免把首页变成重复的信息列表。
            </p>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
              <Link
                href="/posts"
                className="inline-flex items-center gap-2 font-bold text-slate-900 transition-colors hover:text-orange-500"
              >
                Read posts
                <ArrowUpRight className="h-4 w-4" suppressHydrationWarning />
              </Link>
              <Link
                href="/archive"
                className="inline-flex items-center gap-2 font-bold text-slate-900 transition-colors hover:text-orange-500"
              >
                View archive
                <ArrowUpRight className="h-4 w-4" suppressHydrationWarning />
              </Link>
            </div>
          </div>
        </div>
      </motion.section>

      <footer className="mx-auto flex w-full max-w-7xl flex-col gap-4 border-t border-slate-900/10 px-4 py-10 text-sm text-slate-500 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <span className="font-serif text-2xl font-black italic text-slate-300">
          leempty
        </span>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link href="/posts" className="transition-colors hover:text-slate-900">
            Blog
          </Link>
          <Link href="/links" className="transition-colors hover:text-slate-900">
            Links
          </Link>
          <Link href="/rss.xml" className="transition-colors hover:text-slate-900">
            RSS
          </Link>
        </div>
      </footer>
    </main>
  );
}

function PersonalHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-900/10 bg-[#f5f2ea]/85 px-4 py-4 backdrop-blur sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
        <nav className="flex items-center gap-8 text-slate-700">
          <a href="#home" className="font-serif text-2xl font-black italic">
            leempty
          </a>
          <div className="hidden items-center gap-6 text-sm font-medium lg:flex">
            <a href="#blog" className="transition-colors hover:text-orange-500">
              Blog
            </a>
            <a href="#code" className="transition-colors hover:text-orange-500">
              Code
            </a>
            <a href="#writing" className="transition-colors hover:text-orange-500">
              Writing
            </a>
            <a href="#life" className="transition-colors hover:text-orange-500">
              Life
            </a>
          </div>
        </nav>
        <div className="flex items-center gap-4 text-sm font-medium text-slate-700">
          {profileLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hidden transition-colors hover:text-orange-500 sm:inline"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/links"
            aria-label="Links"
            className="transition-colors hover:text-orange-500"
          >
            <LinkIcon className="h-5 w-5" suppressHydrationWarning />
          </Link>
        </div>
      </div>
    </header>
  );
}

function OrbitIcon({
  label,
  icon: Icon,
  className,
  delay,
}: {
  label: string;
  icon: IconType;
  className: string;
  delay: number;
}) {
  return (
    <motion.div
      className={`absolute z-10 grid h-11 w-11 place-items-center border border-white/15 bg-white/10 text-white/75 backdrop-blur ${className}`}
      title={label}
      aria-label={label}
      animate={{ y: [0, -8, 0], rotate: [0, 4, 0] }}
      transition={{
        duration: 4.2,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <Icon className="h-5 w-5" aria-hidden />
    </motion.div>
  );
}

function FeatureLink({
  href,
  title,
  description,
  meta,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  meta: string;
  icon: LucideIcon;
}) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
    >
      <Link
        href={href}
        className="group block border border-slate-900/10 bg-[#fffaf0] p-6 transition-colors hover:border-orange-400"
      >
        <div className="flex items-start justify-between gap-4">
          <span className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-orange-500">
            {meta}
          </span>
          <Icon
            className="h-5 w-5 text-slate-500 transition-colors group-hover:text-orange-500"
            suppressHydrationWarning
          />
        </div>
        <h3 className="mt-16 font-serif text-3xl font-black italic text-slate-900">
          {title}
        </h3>
        <p className="mt-4 text-sm leading-6 text-slate-600">{description}</p>
        <span className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-slate-900 transition-colors group-hover:text-orange-500">
          Open
          <ArrowUpRight className="h-4 w-4" suppressHydrationWarning />
        </span>
      </Link>
    </motion.div>
  );
}
