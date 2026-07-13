export function Footer() {
  return (
    <footer className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 border-t border-border px-5 py-10 font-mono text-[10px] font-medium uppercase tracking-[0.25em] text-muted-foreground sm:flex-row sm:px-8 lg:px-10">
      <span>&copy; {new Date().getFullYear()} leempty</span>
      <span className="text-center sm:text-right">
        Engineering notes, field logs &amp; quiet observations
      </span>
    </footer>
  );
}
