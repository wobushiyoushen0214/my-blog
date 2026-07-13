export function Footer() {
  return (
    <footer className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-5 py-10 text-[12px] text-muted-foreground sm:flex-row sm:items-center sm:px-8 lg:px-10">
      <div className="flex w-full flex-col gap-2 border-t border-border/70 pt-8 sm:flex-row sm:items-center sm:justify-between">
        <span>© {new Date().getFullYear()} leempty</span>
        <span className="sm:text-right">想法 · 代码 · 见闻</span>
      </div>
    </footer>
  );
}
