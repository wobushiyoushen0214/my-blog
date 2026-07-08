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
        "mx-auto w-full max-w-[980px] flex-1 px-5 py-9 md:px-6 md:py-12",
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
    <header className="pixel-frame mb-7 p-4 md:p-5">
      {backHref && backLabel ? (
        <Link
          href={backHref}
          className="mb-5 inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <ArrowLeft className="h-4 w-4" suppressHydrationWarning />
          {backLabel}
        </Link>
      ) : null}

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="min-w-0 space-y-3">
          <div className="space-y-2">
            {eyebrow ? (
              <p className="pixel-label text-primary">
                {eyebrow}
              </p>
            ) : null}
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-2">
              <h1 className="min-w-0 text-2xl font-semibold leading-tight md:text-3xl">
                {title}
              </h1>
              {countLabel ? (
                <span className="rounded-md border border-border bg-muted px-2 py-1 text-xs text-muted-foreground">
                  {countLabel}
                </span>
              ) : null}
            </div>
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
        "inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
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
        "pixel-frame mx-auto w-full max-w-2xl p-8 text-center",
        className
      )}
    >
      <div className="grid place-items-center gap-4">
        {Icon ? (
          <span className="flex size-10 items-center justify-center rounded-lg border border-border bg-background text-primary">
            <Icon className="h-5 w-5" suppressHydrationWarning />
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="text-lg font-semibold leading-tight">{title}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            {description}
          </p>
          {action ? <div className="mt-6">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}
