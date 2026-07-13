export function Footer() {
  return (
    <footer className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-5 py-10 text-[12px] text-muted-foreground sm:flex-row sm:items-center sm:px-8 lg:px-10">
      <div className="flex w-full flex-col gap-2 border-t border-border/80 pt-8 sm:flex-row sm:items-center sm:justify-between">
        <span>© {new Date().getFullYear()} leempty</span>
        <span className="signal-meta sm:text-right">
          工程笔记 · 见闻 · Signal Studio
        </span>
      </div>
    </footer>
  );
}
