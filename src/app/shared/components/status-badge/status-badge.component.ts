import { Component, input, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { statusDisplayLabel } from "@shared/utils/status-label";

const STATUS_STYLES: Record<string, { bg: string; fg: string }> = {
  New: { bg: "#F1F5F9", fg: "#475569" },
  Review: { bg: "#FFFBEB", fg: "#B45309" },
  Design: { bg: "#ECFEFF", fg: "#164E63" },
  Production: { bg: "#EFF6FF", fg: "#1E40AF" },
  "Quality Check": { bg: "#F5F3FF", fg: "#5B21B6" },
  Ready: { bg: "#ECFDF5", fg: "#065F46" },
  Completed: { bg: "#ECFDF5", fg: "#065F46" },
  Cancelled: { bg: "#FEF2F2", fg: "#B91C1C" },
  Open: { bg: "#EFF6FF", fg: "#1E40AF" },
  "In Progress": { bg: "#FFFBEB", fg: "#B45309" },
  Closed: { bg: "#F1F5F9", fg: "#64748B" },
  Pending: { bg: "#F1F5F9", fg: "#64748B" },
  Invoiced: { bg: "#EFF6FF", fg: "#1E40AF" },
  Paid: { bg: "#ECFDF5", fg: "#065F46" },
  Overdue: { bg: "#FEF2F2", fg: "#B91C1C" },
};

const DEFAULT_STYLE = { bg: "#F1F5F9", fg: "#64748B" };

@Component({
  selector: "app-status-badge",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./status-badge.component.html",
  styleUrl: "./status-badge.component.scss",
})
export class StatusBadgeComponent {
  readonly status = input.required<string>();
  readonly label = input<string | null | undefined>(undefined);
  readonly size = input<"xs" | "sm" | "md">("xs");

  readonly styles = computed(
    () => STATUS_STYLES[this.status()] ?? DEFAULT_STYLE,
  );
  readonly displayLabel = computed(
    () => this.label() ?? statusDisplayLabel(this.status()),
  );

  readonly badgeClasses = computed(() => {
    const base = "inline-flex items-center px-1.5 py-0.5 rounded font-semibold";
    const sizes = { xs: "text-[10px]", sm: "text-xs", md: "text-sm" };
    return `${base} ${sizes[this.size()]}`;
  });
}
