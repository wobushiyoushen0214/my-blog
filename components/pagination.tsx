import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

type PaginationItem = number | "ellipsis";

const SIBLING_COUNT = 1;

function getPaginationItems(
  currentPage: number,
  totalPages: number
): PaginationItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const visiblePages = new Set<number>([1, totalPages]);
  const start = Math.max(1, currentPage - SIBLING_COUNT);
  const end = Math.min(totalPages, currentPage + SIBLING_COUNT);

  for (let page = start; page <= end; page += 1) {
    visiblePages.add(page);
  }

  if (currentPage <= 4) {
    for (let page = 2; page <= Math.min(5, totalPages); page += 1) {
      visiblePages.add(page);
    }
  }

  if (currentPage >= totalPages - 3) {
    for (let page = Math.max(1, totalPages - 4); page < totalPages; page += 1) {
      visiblePages.add(page);
    }
  }

  const sortedPages = Array.from(visiblePages).sort((a, b) => a - b);

  return sortedPages.reduce<PaginationItem[]>((items, page, index) => {
    const previousPage = sortedPages[index - 1];

    if (previousPage && page - previousPage > 1) {
      if (page - previousPage === 2) {
        items.push(previousPage + 1);
      } else {
        items.push("ellipsis");
      }
    }

    items.push(page);
    return items;
  }, []);
}

export function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null;

  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const items = getPaginationItems(safeCurrentPage, totalPages);

  const getHref = (page: number) => {
    const separator = basePath.includes("?") ? "&" : "?";
    return `${basePath}${separator}page=${page}`;
  };

  const pageLinkClassName =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background";
  const edgeLinkClassName =
    "inline-flex h-9 items-center gap-1 rounded-md border border-border/60 px-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:bg-muted/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background";
  const disabledClassName =
    "inline-flex h-9 items-center gap-1 rounded-md border border-border/40 px-3 text-sm font-medium text-muted-foreground/40";

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-2 pt-10 sm:pt-12"
      aria-label="分页"
    >
      {safeCurrentPage > 1 ? (
        <Link
          href={getHref(safeCurrentPage - 1)}
          className={edgeLinkClassName}
          aria-label={`上一页，第 ${safeCurrentPage - 1} 页`}
        >
          <ChevronLeft className="h-4 w-4" suppressHydrationWarning />
          上一页
        </Link>
      ) : (
        <span
          className={disabledClassName}
          aria-disabled="true"
        >
          <ChevronLeft className="h-4 w-4" suppressHydrationWarning />
          上一页
        </span>
      )}

      <div className="hidden items-center gap-1 sm:flex">
        {items.map((item, index) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm text-muted-foreground/60"
              aria-hidden="true"
            >
              ...
            </span>
          ) : (
            <Link
              key={item}
              href={getHref(item)}
              className={cn(
                pageLinkClassName,
                item === safeCurrentPage
                  ? "border-primary/30 bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border-border/60 text-muted-foreground hover:border-primary/30 hover:bg-muted/40 hover:text-primary"
              )}
              aria-label={`第 ${item} 页`}
              aria-current={item === safeCurrentPage ? "page" : undefined}
            >
              {item}
            </Link>
          )
        )}
      </div>

      <span className="inline-flex h-9 min-w-20 items-center justify-center rounded-md border border-border/50 px-3 text-sm text-muted-foreground sm:hidden">
        {safeCurrentPage} / {totalPages}
      </span>

      {safeCurrentPage < totalPages ? (
        <Link
          href={getHref(safeCurrentPage + 1)}
          className={edgeLinkClassName}
          aria-label={`下一页，第 ${safeCurrentPage + 1} 页`}
        >
          下一页
          <ChevronRight className="h-4 w-4" suppressHydrationWarning />
        </Link>
      ) : (
        <span
          className={disabledClassName}
          aria-disabled="true"
        >
          下一页
          <ChevronRight className="h-4 w-4" suppressHydrationWarning />
        </span>
      )}
    </nav>
  );
}
