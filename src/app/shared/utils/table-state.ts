export type TableSortDirection = "asc" | "desc";

export function filterTableRows<T>(
  rows: readonly T[],
  query: string,
  fields: readonly ((row: T) => unknown)[],
): T[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [...rows];
  return rows.filter((row) =>
    fields.some((field) =>
      String(field(row) ?? "")
        .toLowerCase()
        .includes(normalizedQuery),
    ),
  );
}

export function sortTableRows<T>(
  rows: readonly T[],
  column: keyof T,
  direction: TableSortDirection,
): T[] {
  const result = [...rows];
  result.sort((left, right) => {
    const leftValue = String(left[column] ?? "");
    const rightValue = String(right[column] ?? "");
    const comparison = leftValue.localeCompare(rightValue);
    return direction === "asc" ? comparison : -comparison;
  });
  return result;
}

export function paginateTableRows<T>(
  rows: readonly T[],
  page: number,
  pageSize: number,
): T[] {
  const start = Math.max(0, page - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

export function tableTotalPages(rowCount: number, pageSize: number): number {
  return Math.ceil(rowCount / pageSize);
}

export function visibleTablePages(
  totalPages: number,
  currentPage: number,
  maxPages = 5,
): number[] {
  if (totalPages <= 0) return [];
  let start = Math.max(1, currentPage - Math.floor(maxPages / 2));
  let end = Math.min(totalPages, start + maxPages - 1);
  if (end - start + 1 < maxPages) {
    start = Math.max(1, end - maxPages + 1);
  }
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}
