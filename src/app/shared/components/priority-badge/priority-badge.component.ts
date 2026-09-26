import { Component, input, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { priorityDotClass } from "@shared/utils/priority-styles";

@Component({
  selector: "app-priority-badge",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./priority-badge.component.html",
  styleUrl: "./priority-badge.component.scss",
})
export class PriorityBadgeComponent {
  readonly priority = input.required<string>();
  readonly size = input<"xs" | "sm" | "md">("xs");

  readonly dotClass = computed(() => priorityDotClass(this.priority()));
  readonly textClass = computed(() => {
    if (this.size() === "md") return "text-sm";
    if (this.size() === "sm") return "text-xs";
    return "text-[10px]";
  });
}
