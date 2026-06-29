import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
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
    <header className="mb-7 pt-2">
      {backHref && backLabel ? (
        <Link
          href={backHref}
          className="mb-5 inline-flex h-9 items-center gap-1.5 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <ArrowLeft className="h-4 w-4" suppressHydrationWarning />
          {backLabel}
        </Link>
      ) : null}

      <div className="grid gap-4 md:grid-cols-[44px_minmax(0,1fr)_auto] md:items-end">
        <span className="font-mono text-xs text-muted-foreground">00</span>
        <div className="min-w-0 space-y-3">
          <div className="space-y-2">
            {eyebrow ? (
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {eyebrow}
              </p>
            ) : null}
            <div className="flex min-w-0 flex-wrap items-end gap-x-3 gap-y-2">
              <h1 className="min-w-0 font-serif text-3xl leading-none tracking-normal md:text-4xl">
                {title}
              </h1>
              {countLabel ? (
                <span className="pb-1 text-sm text-muted-foreground">
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
        "inline-flex h-9 items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
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
        "mx-auto w-full max-w-2xl py-8",
        className
      )}
    >
      <div className="grid gap-4 sm:grid-cols-[2.5rem_minmax(0,1fr)]">
        <div className="text-xs tabular-nums text-muted-foreground">
          {Icon ? (
            <span className="flex size-9 items-center justify-center bg-muted/25 text-muted-foreground">
              <Icon className="h-4 w-4" suppressHydrationWarning />
            </span>
          ) : (
            "00"
          )}
        </div>
        <div className="min-w-0">
          <h2 className="font-serif text-2xl leading-tight">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
          {action ? <div className="mt-5">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}

type PublicInfoPanelProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function PublicInfoPanel({
  title,
  description,
  children,
  className,
  contentClassName,
}: PublicInfoPanelProps) {
  return (
    <section className={cn("py-1", className)}>
      <div className="py-2">
        <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      <div className={cn("py-2", contentClassName)}>{children}</div>
    </section>
  );
}

type PublicIndexLinkItem = {
  href: string;
  label: string;
  description?: string;
  meta?: ReactNode;
  icon?: LucideIcon;
};

export function PublicIndexLinks({
  items,
  ariaLabel,
  className,
}: {
  items: PublicIndexLinkItem[];
  ariaLabel: string;
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <nav aria-label={ariaLabel} className={cn("grid gap-1", className)}>
      {items.map((item, index) => {
        const Icon = item.icon;

        return (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className="group -mx-2 grid gap-2 px-2 py-2.5 text-sm transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:grid-cols-[2rem_minmax(0,1fr)_auto] sm:items-center"
          >
            <span className="text-xs tabular-nums text-muted-foreground">
              {Icon ? (
                <Icon className="h-4 w-4" suppressHydrationWarning />
              ) : (
                String(index + 1).padStart(2, "0")
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-medium text-foreground">
                {item.label}
              </span>
              {item.description ? (
                <span className="mt-1 block line-clamp-2 text-xs leading-5 text-muted-foreground">
                  {item.description}
                </span>
              ) : null}
            </span>
            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground sm:justify-self-end">
              {item.meta ? <span>{item.meta}</span> : null}
              <ArrowRight
                className="h-4 w-4 transition-colors group-hover:text-foreground"
                suppressHydrationWarning
              />
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
