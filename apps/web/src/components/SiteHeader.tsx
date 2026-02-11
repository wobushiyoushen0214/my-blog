import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-zinc-200 bg-white/60 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/60">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-4">
        <Link href="/" className="text-base font-semibold tracking-tight">
          我的博客
        </Link>
        <nav className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-300">
          <Link href="/" className="hover:text-zinc-900 dark:hover:text-white">
            文章
          </Link>
          <Link
            href="/about"
            className="hover:text-zinc-900 dark:hover:text-white"
          >
            关于
          </Link>
        </nav>
      </div>
    </header>
  );
}

