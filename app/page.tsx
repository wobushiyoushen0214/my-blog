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
    code: "01",
  },
  {
    title: "写作",
    body: "把项目里的判断、踩坑和方法沉淀下来。博客作为文章、见闻、标签和归档的内容系统继续运行。",
    code: "02",
  },
  {
    title: "日常",
    body: "记录工具、游戏、音乐和零碎灵感。个人页只负责第一印象，更完整的上下文在内容系统里。",
    code: "03",
  },
];

const entrances = [
  {
    href: "/posts",
    title: "文章",
    description: "长期技术笔记、项目复盘和工程实践。",
    icon: PenLine,
    code: "posts",
  },
  {
    href: "/moments",
    title: "见闻",
    description: "轻量观察、摘录和阶段性记录。",
    icon: Sparkles,
    code: "moments",
  },
  {
    href: "/archive",
    title: "归档",
    description: "按时间回看已经发布的内容。",
    icon: BookOpen,
    code: "archive",
  },
  {
    href: "/links",
    title: "友链",
    description: "长期阅读和互相连接的站点。",
    icon: LinkIcon,
    code: "links",
  },
];

export default function PersonalHomePage() {
  return (
    <div className="signal-shell relative min-h-screen">
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
    <section className="relative mx-auto flex min-h-[92svh] w-full max-w-6xl flex-col justify-center px-5 py-24 sm:px-8">
      <div className="absolute right-5 top-6 flex items-center gap-3 sm:right-8 sm:top-8">
        <Link
          href="/rss.xml"
          className="signal-meta rounded-full border border-border/80 bg-card/60 px-3 py-1.5 transition-colors hover:border-primary/30 hover:text-foreground"
        >
          RSS
        </Link>
        <ThemeToggle className="rounded-full border border-border/80 bg-card/60" />
      </div>

      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:gap-14">
        <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-6 duration-700 fill-mode-both">
          <div className="signal-kicker">
            <span className="signal-dot" />
            苏州 · 前端 · Signal Studio
          </div>

          <h1 className="mt-7 text-[3.6rem] font-semibold leading-[0.95] tracking-[-0.045em] text-foreground sm:text-[5.4rem]">
            leempty
          </h1>

          <p className="mt-7 max-w-xl text-[1.05rem] leading-8 text-muted-foreground sm:text-lg sm:leading-9">
            我做网页产品，写工程笔记，也保留一个冷静清晰的公开笔记本——关于代码、工具和日常观察。
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link href="/posts" className="signal-primary-link">
              阅读文章
              <ArrowUpRight className="h-4 w-4" suppressHydrationWarning />
            </Link>
            <Link href="/archive" className="signal-secondary-link">
              浏览归档
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 signal-meta">
            <span>Next.js · React</span>
            <span>Engineering notes</span>
            <span>Quiet public log</span>
          </div>
        </div>

        <div className="signal-panel relative overflow-hidden p-5 sm:p-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 fill-mode-both">
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,color-mix(in_oklab,var(--primary)_18%,transparent),transparent_70%)]"
          />
          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <p className="signal-meta">system / overview</p>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                online
              </span>
            </div>

            <div className="mt-6 space-y-3">
              {[
                { label: "文章", value: "工程实践与复盘" },
                { label: "见闻", value: "轻量观察与摘录" },
                { label: "归档", value: "按时间回看" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-background/50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {item.label}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.value}
                    </p>
                  </div>
                  <span className="signal-meta">{item.label === "文章" ? "01" : item.label === "见闻" ? "02" : "03"}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-dashed border-border/80 bg-background/40 px-4 py-4">
              <p className="signal-meta">status</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                首页只做方向导航。更细的内容继续沉淀在内容系统里。
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FocusSection() {
  return (
    <section
      aria-labelledby="focus-heading"
      className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="signal-meta">focus</p>
          <h2
            id="focus-heading"
            className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          >
            我在做什么
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-7 text-muted-foreground">
          三件事并行：写代码、写文字、记日常。彼此互相喂养。
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {focusAreas.map((item) => (
          <section key={item.title} className="signal-panel p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
                {item.title}
              </h3>
              <span className="signal-meta">{item.code}</span>
            </div>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              {item.body}
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
      className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="signal-meta">routes</p>
          <h2
            id="entrance-heading"
            className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          >
            内容入口
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-7 text-muted-foreground">
          根路由只做介绍；文章、见闻、归档与友链作为独立入口。
        </p>
      </div>

      <ul className="mt-10 grid gap-3 sm:grid-cols-2">
        {entrances.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="signal-panel signal-panel-hover group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 p-5"
            >
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                <item.icon className="h-4 w-4" suppressHydrationWarning />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className="text-lg font-semibold tracking-tight text-foreground">
                    {item.title}
                  </span>
                  <span className="signal-meta">{item.code}</span>
                </span>
                <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                  {item.description}
                </span>
              </span>
              <ArrowUpRight
                className="h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"
                suppressHydrationWarning
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ClosingSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
      <div className="signal-panel grid gap-10 p-6 sm:p-8 md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] md:gap-14">
        <div>
          <p className="signal-meta">about</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            关于这个站点
          </h2>
          <p className="mt-5 max-w-xl text-[1.02rem] leading-8 text-muted-foreground">
            首页只负责第一印象和方向导航。更细的内容继续沉淀在博客系统里，避免把落地页变成重复的信息列表。
          </p>
        </div>
        <div>
          <p className="signal-meta">contact</p>
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
    </section>
  );
}

function StandaloneFooter() {
  return (
    <footer className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
      <div className="flex flex-col gap-2 border-t border-border/80 pt-8 text-[12px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>© {new Date().getFullYear()} leempty</span>
        <span className="signal-meta">Inter · JetBrains Mono · Signal Studio</span>
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
        className="group flex items-center gap-2.5 rounded-xl border border-transparent px-2 py-2 text-sm text-muted-foreground transition-colors hover:border-border hover:bg-background/50 hover:text-foreground"
      >
        <Icon
          className="h-3.5 w-3.5 text-muted-foreground/70 transition-colors group-hover:text-primary"
          suppressHydrationWarning
        />
        <span className="truncate">{label}</span>
      </Link>
    </li>
  );
}
