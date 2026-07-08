import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type PublicPageShellProps = {
  children: ReactNode;
  className?: string;
};

export function PublicPageShell({ children, className }: PublicPageShellProps) {
  return (
    <main
      className={cn(
        "mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8",
        className
      )}
    >
      {children}
    </main>
  );
}

type PublicPageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  countLabel?: string;
  backHref?: string;
  backLabel?: string;
  action?: ReactNode;
};

export function PublicPageHeader({
  eyebrow,
  title,
  description,
  countLabel,
  backHref,
  backLabel,
  action,
}: PublicPageHeaderProps) {
  return (
    <header className="mb-7 rounded-md border border-neutral-200 bg-white p-5 dark:border-[#262626] dark:bg-neutral-900/10 md:p-6">
      {backHref && backLabel ? (
        <Link
          href={backHref}
          className="mb-5 inline-flex h-8 items-center gap-1.5 rounded-full border border-neutral-200 bg-transparent px-3 font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-500 transition-colors hover:border-neutral-400 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-700 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" suppressHydrationWarning />
          {backLabel}
        </Link>
      ) : null}

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="min-w-0 space-y-3">
          <div className="space-y-2">
            {eyebrow ? (
              <p className="font-sans text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400 dark:text-neutral-500">
                {eyebrow}
              </p>
            ) : null}
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-2">
              <h1 className="min-w-0 font-serif text-2xl font-light italic leading-tight text-slate-950 dark:text-white md:text-3xl">
                {title}
              </h1>
              {countLabel ? (
                <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-400">
                  {countLabel}
                </span>
              ) : null}
            </div>
          </div>
          {description ? (
            <p className="max-w-2xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}

type PublicActionLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
};

export function PublicActionLink({
  href,
  children,
  className,
}: PublicActionLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-full border border-neutral-200 bg-transparent px-4 font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-500 transition-colors hover:border-neutral-400 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-700 dark:hover:text-white",
        className
      )}
    >
      {children}
    </Link>
  );
}

type PublicEmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
};

export function PublicEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: PublicEmptyStateProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-2xl rounded-md border border-neutral-200 bg-white p-8 text-center dark:border-[#262626] dark:bg-neutral-900/10",
        className
      )}
    >
      <div className="grid place-items-center gap-4">
        {Icon ? (
          <span className="flex size-10 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
            <Icon className="h-5 w-5" suppressHydrationWarning />
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="font-serif text-lg font-light italic leading-tight text-slate-950 dark:text-white">
            {title}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500 dark:text-neutral-400">
            {description}
          </p>
          {action ? <div className="mt-6">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}
