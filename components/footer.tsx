export function Footer() {
  return (
    <footer className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-2 border-t border-border px-5 py-10 text-[12px] text-muted-foreground sm:flex-row sm:items-center sm:px-8 lg:px-10">
      <span>© {new Date().getFullYear()} leempty</span>
      <span className="sm:text-right">
        工程笔记 · 见闻 · 安静的观察
      </span>
    </footer>
  );
}
