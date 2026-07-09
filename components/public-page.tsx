import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, X } from "lucide-react";
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
    <header className="mb-7 rounded-md border border-neutral-200 bg-white p-5 dark:border-[#262626] dark:bg-neutral-900/10 md:p-6 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
      {backHref && backLabel ? (
        <Link
          href={backHref}
          className="mb-5 inline-flex h-8 items-center gap-1.5 rounded-md border border-neutral-200 bg-transparent px-3 font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-500 transition-colors hover:border-neutral-400 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-700 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" suppressHydrationWarning />
          {backLabel}
        </Link>
      ) : null}

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="min-w-0 space-y-3">
          <div className="space-y-2">
            {eyebrow ? (
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">
                {eyebrow}
              </p>
            ) : null}
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-2">
              <h1 className="min-w-0 font-serif text-3xl font-light italic leading-tight tracking-tight text-slate-950 dark:text-white md:text-4xl">
                {title}
              </h1>
              {countLabel ? (
                <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
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

type PublicCompactHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  meta?: ReactNode;
  backHref?: string;
  backLabel?: string;
  action?: ReactNode;
  className?: string;
};

export function PublicCompactHeader({
  eyebrow,
  title,
  description,
  meta,
  backHref,
  backLabel,
  action,
  className,
}: PublicCompactHeaderProps) {
  return (
    <header
      className={cn(
        "mb-5 border-b border-neutral-100 pb-5 dark:border-[#262626] animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both",
        className
      )}
    >
      {backHref && backLabel ? (
        <Link
          href={backHref}
          className="mb-4 inline-flex h-8 items-center gap-1.5 rounded-md border border-neutral-200 bg-transparent px-3 font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-500 transition-colors hover:border-neutral-400 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-700 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" suppressHydrationWarning />
          {backLabel}
        </Link>
      ) : null}
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-2 min-w-0 font-serif text-3xl font-light italic leading-tight tracking-tight text-slate-950 dark:text-white md:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">
              {description}
            </p>
          ) : null}
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 md:justify-end">
          {meta}
          {action}
        </div>
      </div>
    </header>
  );
}

export function PublicMetaPill({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center font-mono text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400",
        className
      )}
    >
      <span className="truncate">{children}</span>
    </span>
  );
}

export function PublicControlStrip({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "mb-6 border-b border-neutral-100 pb-4 dark:border-[#262626] animate-in fade-in slide-in-from-bottom-3 duration-600 fill-mode-both delay-100",
        className
      )}
    >
      {children}
    </section>
  );
}

export function PublicPillLink({
  href,
  active,
  children,
  className,
  ariaCurrent,
}: {
  href: string;
  active?: boolean;
  children: ReactNode;
  className?: string;
  ariaCurrent?: "page";
}) {
  return (
    <Link
      href={href}
      aria-current={ariaCurrent}
      className={cn(
        "inline-flex h-7 shrink-0 items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        active
          ? "text-slate-950 dark:text-white"
          : "text-neutral-500 hover:text-slate-950 dark:text-neutral-400 dark:hover:text-white",
        className
      )}
    >
      {children}
    </Link>
  );
}

export function PublicFilterSummary({
  children,
  clearHref,
}: {
  children: ReactNode;
  clearHref: string;
}) {
  return (
    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">
          Filter
        </span>
        {children}
      </div>
      <Link
        href={clearHref}
        className="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-500 transition-colors hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:text-neutral-400 dark:hover:text-white"
      >
        清除全部
      </Link>
    </div>
  );
}

export function PublicFilterPill({
  label,
  href,
}: {
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-7 max-w-full items-center gap-1.5 font-mono text-[10px] text-neutral-500 transition-colors hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:text-neutral-400 dark:hover:text-white"
      aria-label={`移除${label}`}
    >
      <span className="truncate">{label}</span>
      <X className="h-3 w-3 shrink-0" suppressHydrationWarning />
    </Link>
  );
}

export const publicSelectClassName =
  "h-9 rounded-md border border-neutral-200 bg-neutral-50/50 px-3 font-mono text-[10px] uppercase tracking-wider text-neutral-600 shadow-none outline-none transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-ring/50 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-300 dark:hover:bg-[#0a0a0a]";

export const publicPrimaryButtonClassName =
  "inline-flex h-9 items-center justify-center rounded-md border border-neutral-950 bg-neutral-950 px-4 font-mono text-[10px] font-bold uppercase tracking-wider text-white shadow-none transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:border-white dark:bg-white dark:text-black dark:hover:bg-neutral-200";

export const publicSecondaryButtonClassName =
  "inline-flex h-9 items-center justify-center rounded-md border border-neutral-200 bg-transparent px-4 font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-500 transition-colors hover:border-neutral-400 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-700 dark:hover:text-white";

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
        publicSecondaryButtonClassName,
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
          <span className="flex size-10 items-center justify-center rounded-md border border-neutral-200 bg-neutral-50 text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
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
