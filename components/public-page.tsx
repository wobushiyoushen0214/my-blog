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
        "mx-auto w-full max-w-[1080px] flex-1 px-5 py-12 md:px-6 md:py-16",
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
    <header className="mb-10">
      {backHref && backLabel ? (
        <Link
          href={backHref}
          className="mb-8 inline-flex h-9 items-center gap-1.5 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground transition-all duration-500 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <ArrowLeft className="h-4 w-4" suppressHydrationWarning />
          {backLabel}
        </Link>
      ) : null}

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="min-w-0 space-y-4">
          <div className="space-y-3">
            {eyebrow ? (
              <p className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                <span className="h-px w-6 bg-primary/50" aria-hidden="true" />
                {eyebrow}
              </p>
            ) : null}
            <div className="flex min-w-0 flex-wrap items-end gap-x-4 gap-y-2">
              <h1 className="min-w-0 font-serif text-4xl leading-[1.1] tracking-tight italic md:text-5xl">
                {title}
              </h1>
              {countLabel ? (
                <span className="pb-2 text-sm uppercase tracking-[0.14em] text-muted-foreground">
                  {countLabel}
                </span>
              ) : null}
            </div>
          </div>
          {description ? (
            <p className="max-w-2xl text-base leading-8 text-muted-foreground">
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
        "inline-flex h-9 items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground transition-all duration-500 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
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
        "mx-auto w-full max-w-2xl py-12 text-center",
        className
      )}
    >
      <div className="grid place-items-center gap-4">
        {Icon ? (
          <span className="flex size-12 items-center justify-center border-[0.5px] border-border/40 text-muted-foreground">
            <Icon className="h-5 w-5" suppressHydrationWarning />
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="font-serif text-2xl leading-tight">{title}</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
            {description}
          </p>
          {action ? <div className="mt-6">{action}</div> : null}
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
        <h2 className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          <span className="text-primary/60" aria-hidden="true">
            ❖
          </span>
          {title}
        </h2>
        {description ? (
          <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      <div className={cn("py-2", contentClassName)}>{children}</div>
    </section>
  );
}

type PublicSummaryStatItem = {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
};

type PublicSummaryStatsProps = {
  items: PublicSummaryStatItem[];
  ariaLabel: string;
  className?: string;
};

export function PublicSummaryStats({
  items,
  ariaLabel,
  className,
}: PublicSummaryStatsProps) {
  if (items.length === 0) return null;

  return (
    <section
      aria-label={ariaLabel}
      className={cn(
        "mt-6 grid gap-px overflow-hidden border-[0.5px] border-border/40 bg-border/40 sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="bg-card px-4 py-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {item.label}
          </p>
          <p className="mt-1.5 font-serif text-2xl leading-none text-foreground">
            {item.value}
          </p>
          {item.detail ? (
            <p className="mt-2 truncate text-xs text-muted-foreground">
              {item.detail}
            </p>
          ) : null}
        </div>
      ))}
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
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className="group -mx-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-2 py-2.5 text-sm transition-all duration-300 hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:gap-3"
          >
            <span className="min-w-0">
              <span className="flex min-w-0 items-center gap-2 font-medium text-foreground">
                {Icon ? (
                  <Icon
                    className="h-4 w-4 shrink-0 text-muted-foreground"
                    suppressHydrationWarning
                  />
                ) : null}
                <span className="truncate">{item.label}</span>
              </span>
              {item.description ? (
                <span className="mt-1 block line-clamp-2 pl-6 text-xs leading-5 text-muted-foreground sm:pl-0">
                  {item.description}
                </span>
              ) : null}
            </span>
            <span className="inline-flex items-center gap-2 justify-self-end text-xs text-muted-foreground">
              {item.meta ? <span>{item.meta}</span> : null}
              <ArrowRight
                className="h-4 w-4 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-foreground"
                suppressHydrationWarning
              />
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
