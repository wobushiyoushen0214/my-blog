export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-white/60 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/60">
      <div className="mx-auto w-full max-w-3xl px-5 py-6 text-sm text-zinc-500 dark:text-zinc-400">
        <div>© {new Date().getFullYear()} 我的博客</div>
      </div>
    </footer>
  );
}

