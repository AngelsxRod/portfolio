import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@repo/ui/components/pagination";

type Props = {
  basePath: string;
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
};

/** Páginas visibles: primera, última y una ventana alrededor de la actual. */
function visiblePages(page: number, totalPages: number) {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);
  const result: (number | "gap")[] = [];
  sorted.forEach((value, index) => {
    if (index > 0 && value - sorted[index - 1]! > 1) result.push("gap");
    result.push(value);
  });
  return result;
}

export function ListPagination({
  basePath,
  page,
  totalPages,
  total,
  pageSize,
}: Props) {
  if (total === 0) return null;
  const href = (value: number) =>
    value === 1 ? basePath : `${basePath}?page=${value}`;
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
      <p className="text-sm text-muted-foreground" role="status">
        {first}–{last} de {total}
      </p>
      {totalPages > 1 && (
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                text="Anterior"
                href={href(Math.max(1, page - 1))}
                aria-label="Página anterior"
                aria-disabled={page === 1}
                className={page === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {visiblePages(page, totalPages).map((value, index) => (
              <PaginationItem
                key={value === "gap" ? `gap-${index}` : value}
                className={
                  value !== "gap" && value !== page
                    ? "hidden sm:list-item"
                    : undefined
                }
              >
                {value === "gap" ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    href={href(value)}
                    isActive={value === page}
                    aria-label={`Página ${value}`}
                  >
                    {value}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                text="Siguiente"
                href={href(Math.min(totalPages, page + 1))}
                aria-label="Página siguiente"
                aria-disabled={page === totalPages}
                className={
                  page === totalPages ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
