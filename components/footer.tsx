export function Footer() {
  return (
    <footer className="mx-auto flex max-w-7xl flex-col items-center justify-between border-t border-neutral-200 px-6 py-8 text-[9px] font-medium uppercase tracking-[0.25em] text-neutral-400 dark:border-neutral-900 dark:text-neutral-600 sm:flex-row sm:px-8 lg:px-10">
      <span>
        &copy; {new Date().getFullYear()} LeeNotes. Engineering, projects & field logs.
      </span>
      <div className="mt-2 flex items-center gap-2 sm:mt-0">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
        <span>SYSTEM ONLINE</span>
      </div>
    </footer>
  );
}
