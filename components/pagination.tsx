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
    "inline-flex min-h-10 min-w-10 items-center justify-center px-3 font-mono text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background";
  const edgeLinkClassName =
    "flex min-h-10 items-center gap-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background";
  const disabledClassName =
    "flex min-h-10 items-center gap-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground/35";

  return (
    <nav
      className="mt-10 sm:mt-12"
      aria-label="分页"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch gap-3">
        {safeCurrentPage > 1 ? (
          <Link
            href={getHref(safeCurrentPage - 1)}
            className={cn(edgeLinkClassName, "justify-start")}
            aria-label={`上一页，第 ${safeCurrentPage - 1} 页`}
          >
            <ChevronLeft className="h-4 w-4" suppressHydrationWarning />
            <span>上一页</span>
            <span className="hidden font-mono text-[11px] text-muted-foreground/70 sm:inline">
              {String(safeCurrentPage - 1).padStart(2, "0")}
            </span>
          </Link>
        ) : (
          <span className={cn(disabledClassName, "justify-start")} aria-disabled="true">
            <ChevronLeft className="h-4 w-4" suppressHydrationWarning />
            <span>上一页</span>
          </span>
        )}

        <div className="hidden max-w-[min(56vw,520px)] items-stretch overflow-x-auto sm:flex">
          {items.map((item, index) =>
            item === "ellipsis" ? (
              <span
                key={`ellipsis-${index}`}
                className="inline-flex min-h-12 min-w-10 items-center justify-center px-3 font-mono text-xs text-muted-foreground/60"
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
                    ? "bg-muted/30 text-foreground"
                    : "text-muted-foreground hover:bg-muted/20 hover:text-foreground"
                )}
                aria-label={`第 ${item} 页`}
                aria-current={item === safeCurrentPage ? "page" : undefined}
              >
                {String(item).padStart(2, "0")}
              </Link>
            )
          )}
        </div>

        <span className="inline-flex min-h-12 min-w-20 items-center justify-center px-3 font-mono text-xs text-muted-foreground sm:hidden">
          {String(safeCurrentPage).padStart(2, "0")} /{" "}
          {String(totalPages).padStart(2, "0")}
        </span>

        {safeCurrentPage < totalPages ? (
          <Link
            href={getHref(safeCurrentPage + 1)}
            className={cn(edgeLinkClassName, "justify-end")}
            aria-label={`下一页，第 ${safeCurrentPage + 1} 页`}
          >
            <span className="hidden font-mono text-[11px] text-muted-foreground/70 sm:inline">
              {String(safeCurrentPage + 1).padStart(2, "0")}
            </span>
            <span>下一页</span>
            <ChevronRight className="h-4 w-4" suppressHydrationWarning />
          </Link>
        ) : (
          <span
            className={cn(disabledClassName, "justify-end")}
            aria-disabled="true"
          >
            <span>下一页</span>
            <ChevronRight className="h-4 w-4" suppressHydrationWarning />
          </span>
        )}
      </div>
    </nav>
  );
}
