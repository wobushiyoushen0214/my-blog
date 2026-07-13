import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Link as LinkIcon,
  Mail,
  PenLine,
  Rss,
  Sparkles,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const focusAreas = [
  {
    title: "构建",
    body: "把复杂界面拆成可维护的产品系统。关注 React、Next.js、工程化，以及从真实需求里长出来的前端架构。",
  },
  {
    title: "写作",
    body: "把项目里的判断、踩坑和方法沉淀下来。博客作为文章、见闻、标签和归档的内容系统继续运行。",
  },
  {
    title: "日常",
    body: "记录工具、游戏、音乐和零碎灵感。个人页只负责第一印象，更完整的上下文在内容系统里。",
  },
];

const entrances = [
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
    description: "按时间回看已经发布的内容。",
    icon: BookOpen,
  },
  {
    href: "/links",
    title: "友链",
    description: "长期阅读和互相连接的站点。",
    icon: LinkIcon,
  },
];

export default function PersonalHomePage() {
  return (
    <div className="relative min-h-screen">
      <div aria-hidden className="home-glow" />
      <div aria-hidden className="home-grain" />
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
    <section className="relative mx-auto flex min-h-[92svh] w-full max-w-5xl flex-col justify-center px-5 py-24 sm:px-8">
      <div className="absolute right-5 top-6 flex items-center gap-5 sm:right-8 sm:top-8">
        <Link
          href="/rss.xml"
          className="text-[11px] tracking-[0.04em] text-muted-foreground transition-colors hover:text-foreground"
        >
          RSS
        </Link>
        <ThemeToggle />
      </div>

      <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-6 duration-700 fill-mode-both">
        <p className="text-[13px] leading-none tracking-[0.02em] text-muted-foreground">
          苏州 · 前端
        </p>
        <h1 className="mt-8 font-serif text-[4.5rem] font-medium leading-[0.92] tracking-[-0.03em] text-foreground sm:text-[6.5rem]">
          leempty
        </h1>
        <p className="mt-8 max-w-xl text-[1.05rem] leading-8 text-muted-foreground sm:text-lg sm:leading-9">
          我做网页产品，写工程笔记，也保留一个安静的公开笔记本——关于代码、工具和日常观察。
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3">
          <Link
            href="/posts"
            className="group inline-flex items-center gap-2 text-[15px] text-foreground transition-opacity hover:opacity-70"
          >
            阅读文章
            <ArrowUpRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              suppressHydrationWarning
            />
          </Link>
          <Link
            href="/archive"
            className="text-[15px] text-muted-foreground transition-colors hover:text-foreground"
          >
            浏览归档
          </Link>
        </div>
      </div>
    </section>
  );
}

function FocusSection() {
  return (
    <section
      aria-labelledby="focus-heading"
      className="mx-auto w-full max-w-5xl px-5 py-20 sm:px-8 sm:py-24"
    >
      <div className="border-t border-border pt-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2
            id="focus-heading"
            className="font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl"
          >
            我在做什么
          </h2>
          <p className="max-w-sm text-sm leading-7 text-muted-foreground">
            三件事并行：写代码、写文字、记日常。彼此互相喂养。
          </p>
        </div>

        <div className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-8">
          {focusAreas.map((item) => (
            <section key={item.title} className="min-w-0">
              <h3 className="text-[15px] font-medium tracking-tight text-foreground">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {item.body}
              </p>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}

function EntranceSection() {
  return (
    <section
      aria-labelledby="entrance-heading"
      className="mx-auto w-full max-w-5xl px-5 py-20 sm:px-8 sm:py-24"
    >
      <div className="border-t border-border pt-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2
            id="entrance-heading"
            className="font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl"
          >
            内容入口
          </h2>
          <p className="max-w-sm text-sm leading-7 text-muted-foreground">
            根路由只做介绍；文章、见闻、归档与友链作为独立入口。
          </p>
        </div>

        <ul className="mt-12 border-t border-border">
          {entrances.map((item) => (
            <li key={item.href} className="border-b border-border">
              <Link
                href={item.href}
                className="group grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1 py-6 transition-colors"
              >
                <item.icon
                  className="mt-1 h-4 w-4 text-muted-foreground/60 transition-colors group-hover:text-foreground"
                  suppressHydrationWarning
                />
                <div className="min-w-0">
                  <h3 className="font-serif text-2xl font-medium tracking-tight text-foreground transition-opacity group-hover:opacity-70 sm:text-[1.75rem]">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <ArrowUpRight
                  className="mt-1.5 h-4 w-4 shrink-0 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
                  suppressHydrationWarning
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ClosingSection() {
  return (
    <section className="mx-auto w-full max-w-5xl px-5 py-20 sm:px-8 sm:py-24">
      <div className="border-t border-border pt-10">
        <div className="grid gap-12 md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] md:gap-16">
          <div>
            <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
              关于这个站点
            </h2>
            <p className="mt-6 max-w-xl text-[1.05rem] leading-8 text-muted-foreground">
              首页只负责第一印象和方向导航。更细的内容继续沉淀在博客系统里，避免把落地页变成重复的信息列表。
            </p>
          </div>
          <div>
            <p className="text-[13px] text-muted-foreground">联系</p>
            <ul className="mt-4 space-y-3">
              <ContactLink
                href="mailto:hello@leempty.site"
                icon={Mail}
                label="hello@leempty.site"
              />
              <ContactLink href="/rss.xml" icon={Rss} label="RSS" />
              <ContactLink href="/links" icon={LinkIcon} label="友链" />
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function StandaloneFooter() {
  return (
    <footer className="mx-auto w-full max-w-5xl border-t border-border px-5 py-10 sm:px-8">
      <div className="flex flex-col gap-2 text-[12px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>© {new Date().getFullYear()} leempty</span>
        <span>Lora · Hanken Grotesk</span>
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
        className="group flex items-center gap-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <Icon
          className="h-3.5 w-3.5 text-muted-foreground/60 transition-colors group-hover:text-foreground"
          suppressHydrationWarning
        />
        <span className="truncate">{label}</span>
      </Link>
    </li>
  );
}
