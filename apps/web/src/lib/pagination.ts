export const PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const MAX_PAGES = 50;

export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

/** Convierte `?page=` en un entero ≥ 1; cualquier valor inválido cae a la primera página. */
export function parsePage(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number(raw);
  return Number.isInteger(page) && page >= 1 && page <= 1_000_000 ? page : 1;
}

export function pageQuery(page = 1, pageSize = PAGE_SIZE) {
  return `?page=${page}&pageSize=${pageSize}`;
}

/** Recorre todas las páginas (de 100 en 100) para vistas que necesitan el conjunto completo. */
export async function allPages<T>(
  load: (page: number, pageSize: number) => Promise<Page<T>>,
): Promise<T[]> {
  const first = await load(1, MAX_PAGE_SIZE);
  const rest = await Promise.all(
    Array.from(
      { length: Math.min(first.totalPages, MAX_PAGES) - 1 },
      (_, index) => load(index + 2, MAX_PAGE_SIZE),
    ),
  );
  return [first, ...rest].flatMap((page) => page.items);
}
