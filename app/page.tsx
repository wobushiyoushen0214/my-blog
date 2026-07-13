import Link from "next/link";
import { ArrowUpRight, Mail, Rss, Link as LinkIcon } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const entrances = [
  {
    href: "/posts",
    index: "01",
    title: "文章",
    description: "技术笔记、项目复盘与工程实践。",
  },
  {
    href: "/moments",
    index: "02",
    title: "见闻",
    description: "轻量观察、摘录与阶段性记录。",
  },
  {
    href: "/archive",
    index: "03",
    title: "归档",
    description: "按时间回看已经发布的内容。",
  },
  {
    href: "/links",
    index: "04",
    title: "友链",
    description: "长期阅读和互相连接的站点。",
  },
];

export default function PersonalHomePage() {
  return (
    <div className="signal-shell relative min-h-screen">
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
    <section className="relative mx-auto flex min-h-[82svh] w-full max-w-3xl flex-col justify-center px-5 py-24 sm:px-8">
      <div className="absolute right-5 top-6 flex items-center gap-3 sm:right-8 sm:top-8">
        <Link
          href="/rss.xml"
          className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
        >
          RSS
        </Link>
        <ThemeToggle className="text-muted-foreground hover:text-foreground" />
      </div>

      <div className="max-w-2xl">
        <p className="text-[13px] text-muted-foreground">leempty</p>

        <h1 className="mt-8 text-[2.6rem] font-semibold leading-[1.08] tracking-[-0.045em] text-foreground sm:text-[3.4rem]">
          想法、代码
          <br />
          与日常见闻
        </h1>

        <p className="mt-8 max-w-lg text-[1.02rem] leading-8 text-muted-foreground sm:leading-9">
          记录工程实践、阅读摘录，以及零散但值得留下的观察。
        </p>

        <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link
            href="/posts"
            className="inline-flex items-center gap-1.5 text-[15px] font-medium text-foreground transition-opacity hover:opacity-65"
          >
            阅读文章
            <ArrowUpRight className="h-3.5 w-3.5" suppressHydrationWarning />
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

function EntranceSection() {
  return (
    <section
      aria-labelledby="entrance-heading"
      className="mx-auto w-full max-w-3xl px-5 pb-20 sm:px-8"
    >
      <div className="border-b border-border/80 pb-4">
        <h2
          id="entrance-heading"
          className="text-sm font-medium tracking-tight text-foreground"
        >
          入口
        </h2>
      </div>

      <ul className="mt-0">
        {entrances.map((item) => (
          <li key={item.href} className="border-b border-border/70">
            <Link
              href={item.href}
              className="group grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-baseline gap-4 py-6 transition-opacity hover:opacity-70 sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:gap-6"
            >
              <span className="text-[12px] tabular-nums text-muted-foreground">
                {item.index}
              </span>
              <span className="min-w-0">
                <span className="block text-[1.15rem] font-semibold tracking-tight text-foreground sm:text-[1.25rem]">
                  {item.title}
                </span>
                <span className="mt-1.5 block text-sm leading-6 text-muted-foreground">
                  {item.description}
                </span>
              </span>
              <ArrowUpRight
                className="h-4 w-4 shrink-0 self-center text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
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
    <section className="mx-auto w-full max-w-3xl px-5 pb-16 sm:px-8">
      <div className="grid gap-10 border-t border-border/80 pt-12 md:grid-cols-[minmax(0,1.5fr)_minmax(0,0.7fr)] md:gap-16">
        <div>
          <h2 className="text-sm font-medium tracking-tight text-foreground">
            关于
          </h2>
          <p className="mt-4 max-w-md text-[0.98rem] leading-8 text-muted-foreground">
            首页只负责方向。更细的内容在文章、见闻与归档里慢慢沉淀。
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">联系</p>
          <ul className="mt-4 space-y-2.5">
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
    <footer className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8">
      <div className="flex flex-col gap-2 border-t border-border/80 pt-8 text-[12px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
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
        className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
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
