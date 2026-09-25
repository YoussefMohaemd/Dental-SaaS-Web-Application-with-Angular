export function statusDisplayLabel(status: string | null | undefined): string {
  if (!status) return "";
  if (status === "Completed") return "Shapped";
  return status;
}
