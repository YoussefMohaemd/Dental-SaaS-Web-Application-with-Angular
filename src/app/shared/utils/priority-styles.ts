const PRIORITY_DOT_CLASSES: Record<string, string> = {
  Low: "bg-slate-400",
  Normal: "bg-blue-500",
  High: "bg-amber-500",
  Urgent: "bg-red-500",
};

const PRIORITY_COLORS: Record<string, string> = {
  Low: "#94A3B8",
  Normal: "#3B82F6",
  High: "#F59E0B",
  Urgent: "#EF4444",
};

export function priorityDotClass(priority: string): string {
  return PRIORITY_DOT_CLASSES[priority] ?? "bg-slate-400";
}

export function priorityColor(priority: string): string {
  return PRIORITY_COLORS[priority] ?? "#94A3B8";
}
