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

const entrances = [
  {
    href: "/posts",
    title: "文章",
    description: "技术笔记、项目复盘与工程实践。",
    icon: PenLine,
  },
  {
    href: "/moments",
    title: "见闻",
    description: "轻量观察、摘录与阶段性记录。",
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
    <div className="signal-shell relative min-h-screen">
      <div aria-hidden className="home-glow" />
      <div aria-hidden className="home-grain" />
      <div className="relative z-10">
        <Hero />
        <EntranceSection />
        <ClosingSection />
        <StandaloneFooter />
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative mx-auto flex min-h-[88svh] w-full max-w-5xl flex-col justify-center px-5 py-24 sm:px-8">
      <div className="absolute right-5 top-6 flex items-center gap-2 sm:right-8 sm:top-8">
        <Link
          href="/rss.xml"
          className="rounded-full border border-border/70 bg-card/50 px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
        >
          RSS
        </Link>
        <ThemeToggle className="rounded-full border border-border/70 bg-card/50" />
      </div>

      <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
        <p className="text-[13px] tracking-[0.04em] text-muted-foreground">
          leempty
        </p>

        <h1 className="mt-6 text-[2.75rem] font-semibold leading-[1.08] tracking-[-0.04em] text-foreground sm:text-[3.75rem]">
          想法、代码
          <br className="hidden sm:block" />
          与日常见闻
        </h1>

        <p className="mt-7 max-w-xl text-[1.05rem] leading-8 text-muted-foreground sm:text-lg sm:leading-9">
          这里记录工程实践、阅读摘录，以及零散但值得留下的观察。不追求热闹，只保留可读、可回看的公开笔记。
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
      </div>
    </section>
  );
}

function EntranceSection() {
  return (
    <section
      aria-labelledby="entrance-heading"
      className="mx-auto w-full max-w-5xl px-5 pb-20 sm:px-8"
    >
      <div className="flex items-end justify-between gap-4 border-b border-border/70 pb-5">
        <div>
          <h2
            id="entrance-heading"
            className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
          >
            入口
          </h2>
          <p className="mt-2 max-w-md text-sm leading-7 text-muted-foreground">
            内容按类型分开存放，首页只负责指路。
          </p>
        </div>
      </div>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {entrances.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="signal-panel signal-panel-hover group flex items-start gap-4 p-5"
            >
              <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border/70 bg-background/50 text-muted-foreground transition-colors group-hover:border-foreground/20 group-hover:text-foreground">
                <item.icon className="h-4 w-4" suppressHydrationWarning />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-3">
                  <span className="text-[1.05rem] font-semibold tracking-tight text-foreground">
                    {item.title}
                  </span>
                  <ArrowUpRight
                    className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
                    suppressHydrationWarning
                  />
                </span>
                <span className="mt-1.5 block text-sm leading-6 text-muted-foreground">
                  {item.description}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ClosingSection() {
  return (
    <section className="mx-auto w-full max-w-5xl px-5 pb-16 sm:px-8">
      <div className="grid gap-10 border-t border-border/70 pt-12 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)] md:gap-16">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            关于这个站点
          </h2>
          <p className="mt-5 max-w-xl text-[1.02rem] leading-8 text-muted-foreground">
            首页只做第一印象和方向导航。更细的内容继续沉淀在文章、见闻与归档里，避免把落地页做成重复的信息列表。
          </p>
        </div>
        <div>
          <p className="text-[13px] text-muted-foreground">联系</p>
          <ul className="mt-4 space-y-2">
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
    <footer className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8">
      <div className="flex flex-col gap-2 border-t border-border/70 pt-8 text-[12px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>© {new Date().getFullYear()} leempty</span>
        <span>想法 · 代码 · 见闻</span>
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
        className="group flex items-center gap-2.5 rounded-lg px-1 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <Icon
          className="h-3.5 w-3.5 text-muted-foreground/70 transition-colors group-hover:text-foreground"
          suppressHydrationWarning
        />
        <span className="truncate">{label}</span>
      </Link>
    </li>
  );
}
