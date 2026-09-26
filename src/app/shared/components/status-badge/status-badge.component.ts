import { Component, input, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TuiStatus } from "@taiga-ui/kit/components/status";
import { statusDisplayLabel } from "@shared/utils/status-label";
import { statusStylesFor } from "@shared/utils/status-styles";

@Component({
  selector: "app-status-badge",
  standalone: true,
  imports: [CommonModule, TuiStatus],
  templateUrl: "./status-badge.component.html",
  styleUrl: "./status-badge.component.scss",
})
export class StatusBadgeComponent {
  readonly status = input.required<string>();
  readonly label = input<string | null | undefined>(undefined);
  readonly size = input<"xs" | "sm" | "md">("xs");

  readonly styles = computed(() => statusStylesFor(this.status()));
  readonly displayLabel = computed(
    () => this.label() ?? statusDisplayLabel(this.status()),
  );

  readonly badgeClasses = computed(() => {
    const base =
      "inline-flex items-center px-1.5 py-0.5 rounded-full font-semibold";
    const sizes = { xs: "text-[10px]", sm: "text-xs", md: "text-sm" };
    return `${base} ${sizes[this.size()]}`;
  });
}
