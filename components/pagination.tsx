import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

export function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getHref = (page: number) => {
    const separator = basePath.includes("?") ? "&" : "?";
    return `${basePath}${separator}page=${page}`;
  };

  return (
    <div className="flex items-center justify-center gap-4 pt-12">
      {currentPage > 1 ? (
        <Link
          href={getHref(currentPage - 1)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; 上一页
        </Link>
      ) : (
        <span className="text-sm text-muted-foreground/40">&larr; 上一页</span>
      )}
      <span className="text-sm text-muted-foreground">
        {currentPage} / {totalPages}
      </span>
      {currentPage < totalPages ? (
        <Link
          href={getHref(currentPage + 1)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          下一页 &rarr;
        </Link>
      ) : (
        <span className="text-sm text-muted-foreground/40">下一页 &rarr;</span>
      )}
    </div>
  );
}
