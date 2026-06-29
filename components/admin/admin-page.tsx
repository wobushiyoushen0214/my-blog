import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type AdminPageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: ReactNode;
};

export function AdminPageHeader({
  title,
  description,
  eyebrow,
  action,
}: AdminPageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 space-y-1.5">
        {eyebrow ? (
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="truncate text-2xl font-semibold tracking-tight">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

type AdminEmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
};

export function AdminEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: AdminEmptyStateProps) {
  return (
    <div className="border border-dashed border-border/70 bg-muted/25 px-6 py-10 text-center">
      {Icon ? (
        <div className="mx-auto mb-4 flex size-10 items-center justify-center border bg-background text-muted-foreground">
          <Icon className="h-5 w-5" suppressHydrationWarning />
        </div>
      ) : null}
      <h2 className="text-base font-medium">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function AdminTableSurface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden border bg-card", className)}>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

type AdminSummaryLedgerItem = {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
  href?: string;
  tone?: "default" | "primary" | "attention";
};

export function AdminSummaryLedger({
  items,
  className,
  "aria-label": ariaLabel = "管理摘要",
}: {
  items: AdminSummaryLedgerItem[];
  className?: string;
  "aria-label"?: string;
}) {
  if (items.length === 0) return null;

  return (
    <section
      className={cn("overflow-hidden border bg-card", className)}
      aria-label={ariaLabel}
    >
      <div className="divide-y">
        {items.map((item, index) => {
          const content = (
            <div className="grid gap-2 px-4 py-3 sm:grid-cols-[2.75rem_minmax(0,1fr)_auto] sm:items-center sm:gap-4">
              <span className="text-xs tabular-nums text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">{item.label}</span>
                {item.helper ? (
                  <span className="mt-1 block truncate text-xs leading-5 text-muted-foreground">
                    {item.helper}
                  </span>
                ) : null}
              </span>
              <span
                className={cn(
                  "text-lg font-semibold tabular-nums tracking-tight sm:text-right",
                  item.tone === "primary" || item.tone === "attention"
                    ? "text-primary"
                    : "text-foreground"
                )}
              >
                {item.value}
              </span>
            </div>
          );

          if (item.href) {
            return (
              <Link
                key={`${item.label}-${index}`}
                href={item.href}
                className="block transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {content}
              </Link>
            );
          }

          return <div key={`${item.label}-${index}`}>{content}</div>;
        })}
      </div>
    </section>
  );
}

export function AdminFormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="border bg-card p-5">
      <div className="mb-5 space-y-1">
        <h2 className="text-base font-medium">{title}</h2>
        {description ? (
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
