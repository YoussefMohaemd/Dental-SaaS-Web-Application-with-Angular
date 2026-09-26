export type SortDirection = "asc" | "desc";
export type SortAriaValue = "ascending" | "descending" | "none";

export function sortAriaValue(
  active: boolean,
  direction: SortDirection,
): SortAriaValue {
  if (!active) return "none";
  return direction === "asc" ? "ascending" : "descending";
}

export function buildSortAriaLabel(
  columnLabel: string,
  active: boolean,
  direction: SortDirection,
): string {
  const state = sortAriaValue(active, direction);
  if (state === "none") return `Sort by ${columnLabel}, currently unsorted`;
  return `Sort by ${columnLabel}, currently ${state}`;
}
