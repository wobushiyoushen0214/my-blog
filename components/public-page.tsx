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
        "mx-auto w-full max-w-[1320px] flex-1 px-4 py-8 md:px-6 md:py-10",
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
    <header className="mb-8 border-b border-border/70 pb-7">
      {backHref && backLabel ? (
        <Link
          href={backHref}
          className="mb-4 inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <ArrowLeft className="h-4 w-4" suppressHydrationWarning />
          {backLabel}
        </Link>
      ) : null}

      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="min-w-0 space-y-2">
          {eyebrow ? (
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {eyebrow}
            </p>
          ) : null}
          <div className="flex min-w-0 flex-wrap items-end gap-x-3 gap-y-2">
            <h1 className="min-w-0 font-serif text-4xl leading-none tracking-normal md:text-5xl">
              {title}
            </h1>
            {countLabel ? (
              <span className="pb-1 text-sm text-muted-foreground">
                {countLabel}
              </span>
            ) : null}
          </div>
          {description ? (
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
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
        "mx-auto max-w-xl border border-dashed border-border/70 bg-card px-6 py-12 text-center",
        className
      )}
    >
      {Icon ? (
        <div className="mx-auto mb-4 flex size-10 items-center justify-center border bg-background text-muted-foreground">
          <Icon className="h-5 w-5" suppressHydrationWarning />
        </div>
      ) : null}
      <h2 className="font-serif text-2xl leading-tight">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
