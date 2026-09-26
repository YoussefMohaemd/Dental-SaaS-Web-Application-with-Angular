export interface StatusStyle {
  bg: string;
  fg: string;
}

const DEFAULT_STYLE: StatusStyle = { bg: "#F1F5F9", fg: "#5B6779" };

const STATUS_STYLES: Record<string, StatusStyle> = {
  Active: { bg: "#ECFDF5", fg: "#065F46" },
  active: { bg: "#ECFDF5", fg: "#065F46" },
  Inactive: { bg: "#F1F5F9", fg: "#5B6779" },
  inactive: { bg: "#F1F5F9", fg: "#5B6779" },
  New: { bg: "#F1F5F9", fg: "#475569" },
  Review: { bg: "#FFFBEB", fg: "#B45309" },
  Design: { bg: "#ECFEFF", fg: "#164E63" },
  Production: { bg: "#EFF6FF", fg: "#1E40AF" },
  "Quality Check": { bg: "#F5F3FF", fg: "#5B21B6" },
  Ready: { bg: "#ECFDF5", fg: "#065F46" },
  Completed: { bg: "#ECFDF5", fg: "#065F46" },
  Done: { bg: "#ECFDF5", fg: "#065F46" },
  Cancelled: { bg: "#FEF2F2", fg: "#B91C1C" },
  Blocked: { bg: "#FEF2F2", fg: "#B91C1C" },
  Open: { bg: "#EFF6FF", fg: "#1E40AF" },
  "In Progress": { bg: "#FFFBEB", fg: "#B45309" },
  Closed: { bg: "#F1F5F9", fg: "#5B6779" },
  Pending: { bg: "#F1F5F9", fg: "#5B6779" },
  Invoiced: { bg: "#EFF6FF", fg: "#1E40AF" },
  Paid: { bg: "#ECFDF5", fg: "#065F46" },
  Overdue: { bg: "#FEF2F2", fg: "#B91C1C" },
};

export function statusStylesFor(status: string): StatusStyle {
  return STATUS_STYLES[status] ?? DEFAULT_STYLE;
}
