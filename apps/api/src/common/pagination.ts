import { BadRequestException } from "@nestjs/common";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export type PageParams = { page: number; pageSize: number; offset: number };

export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function integer(
  value: unknown,
  field: string,
  fallback: number,
  min: number,
  max: number,
) {
  if (value === undefined || value === "") return fallback;
  if (
    typeof value !== "string" ||
    !/^\d{1,9}$/.test(value) ||
    Number(value) < min ||
    Number(value) > max
  ) {
    throw new BadRequestException({
      message: "Parámetros de paginación inválidos.",
      fields: {
        [field]:
          max === MAX_PAGE_SIZE
            ? `Usa un entero entre ${min} y ${max}.`
            : `Usa un entero a partir de ${min}.`,
      },
    });
  }
  return Number(value);
}

/** Lee `page` (desde 1) y `pageSize` (1–100, por defecto 20) de la consulta. */
export function pageParams(query: {
  page?: unknown;
  pageSize?: unknown;
}): PageParams {
  const page = integer(query.page, "page", 1, 1, 1_000_000);
  const pageSize = integer(
    query.pageSize,
    "pageSize",
    DEFAULT_PAGE_SIZE,
    1,
    MAX_PAGE_SIZE,
  );
  return { page, pageSize, offset: (page - 1) * pageSize };
}

export function paginate<T>(
  items: T[],
  total: number,
  { page, pageSize }: PageParams,
): Page<T> {
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
