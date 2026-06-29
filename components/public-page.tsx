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
        "mx-auto w-full max-w-[1440px] flex-1 px-3 py-5 md:px-5 md:py-8",
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
    <header className="mb-8 border border-border bg-card p-5 md:p-8">
      {backHref && backLabel ? (
        <Link
          href={backHref}
          className="mb-8 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <ArrowLeft className="h-4 w-4" suppressHydrationWarning />
          {backLabel}
        </Link>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
              {eyebrow}
            </p>
          ) : null}
          <div className="mt-6 flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-2">
            <h1 className="min-w-0 font-serif text-5xl leading-none md:text-7xl">
              {title}
            </h1>
            {countLabel ? (
              <span className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
                {countLabel}
              </span>
            ) : null}
          </div>
          {description ? (
            <p className="mt-6 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base md:leading-8">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
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
        "mx-auto max-w-xl border border-dashed border-border bg-card px-6 py-12 text-center",
        className
      )}
    >
      {Icon ? (
        <div className="mx-auto mb-4 flex size-10 items-center justify-center border bg-background text-muted-foreground">
          <Icon className="h-5 w-5" suppressHydrationWarning />
        </div>
      ) : null}
      <h2 className="font-serif text-3xl leading-none">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
