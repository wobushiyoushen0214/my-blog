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
        "mx-auto w-full max-w-5xl flex-1 px-5 py-12 sm:px-8 lg:px-10 lg:py-16",
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
    <header className="mb-10 border-b border-border pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
      {backHref && backLabel ? (
        <Link
          href={backHref}
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <ArrowLeft className="h-3.5 w-3.5" suppressHydrationWarning />
          {backLabel}
        </Link>
      ) : null}

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="min-w-0 space-y-4">
          {eyebrow ? (
            <p className="text-[13px] tracking-[0.02em] text-muted-foreground">
              {eyebrow}
            </p>
          ) : null}
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-2">
            <h1 className="min-w-0 font-serif text-[2.75rem] font-medium leading-[1.05] tracking-tight text-foreground sm:text-5xl">
              {title}
            </h1>
            {countLabel ? (
              <span className="text-[13px] text-muted-foreground">
                {countLabel}
              </span>
            ) : null}
          </div>
          {description ? (
            <p className="max-w-2xl text-[15px] leading-7 text-muted-foreground">
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
        "mb-8 border-b border-border pb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both",
        className
      )}
    >
      {backHref && backLabel ? (
        <Link
          href={backHref}
          className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <ArrowLeft className="h-3.5 w-3.5" suppressHydrationWarning />
          {backLabel}
        </Link>
      ) : null}
      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[13px] tracking-[0.02em] text-muted-foreground">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-2 min-w-0 font-serif text-[2.75rem] font-medium leading-[1.05] tracking-tight text-foreground sm:text-5xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted-foreground md:justify-end">
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
        "inline-flex max-w-full items-center text-[13px] text-muted-foreground",
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
        "mb-10 animate-in fade-in slide-in-from-bottom-3 duration-600 fill-mode-both delay-100",
        className
      )}
    >
      {children}
    </section>
  );
}

/** Quiet magazine filter text — no pill, no underline tab. */
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
        "inline-flex shrink-0 items-baseline gap-1.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        active
          ? "font-medium text-foreground"
          : "text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {children}
    </Link>
  );
}

export function PublicFilterRow({
  label,
  children,
  className,
}: {
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-2",
        className
      )}
    >
      {label ? (
        <span className="shrink-0 text-[12px] text-muted-foreground/60">
          {label}
        </span>
      ) : null}
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1.5">
        {children}
      </div>
    </div>
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
    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-muted-foreground">
        {children}
      </div>
      <Link
        href={clearHref}
        className="text-[13px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
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
      className="inline-flex max-w-full items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      aria-label={`移除${label}`}
    >
      <span className="truncate">{label}</span>
      <X className="h-3 w-3 shrink-0" suppressHydrationWarning />
    </Link>
  );
}

export const publicSelectClassName =
  "h-9 rounded-none border border-border bg-transparent px-3 text-[13px] text-muted-foreground shadow-none outline-none transition-colors hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring/50";

export const publicPrimaryButtonClassName =
  "inline-flex h-9 items-center justify-center rounded-none border border-foreground bg-foreground px-4 text-[13px] font-medium text-background shadow-none transition-colors hover:bg-foreground/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

export const publicSecondaryButtonClassName =
  "inline-flex h-9 items-center justify-center rounded-none border border-border bg-transparent px-4 text-[13px] text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

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
    <Link href={href} className={cn(publicSecondaryButtonClassName, className)}>
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
        "mx-auto w-full max-w-xl border-y border-border px-2 py-16 text-center",
        className
      )}
    >
      <div className="grid place-items-center gap-3">
        {Icon ? (
          <span className="text-muted-foreground/50">
            <Icon className="h-5 w-5" suppressHydrationWarning />
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground">
            {title}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-7 text-muted-foreground">
            {description}
          </p>
          {action ? <div className="mt-8">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}
