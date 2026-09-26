import { CommonModule } from "@angular/common";
import { Component, computed, input } from "@angular/core";
import { SafeHtmlPipe } from "@shared/pipes/safe-html.pipe";

@Component({
  selector: "app-table-feedback",
  standalone: true,
  imports: [CommonModule, SafeHtmlPipe],
  templateUrl: "./table-feedback.component.html",
  styleUrl: "./table-feedback.component.scss",
})
export class TableFeedbackComponent {
  readonly mode = input<"loading" | "empty" | "error">("empty");
  readonly message = input.required<string>();
  readonly iconSvg = input<string>("");
  readonly spin = input<boolean>(false);
  readonly containerClass = input<string>(
    "enterprise-empty-state flex flex-col items-center justify-center text-center",
  );
  readonly iconClass = input<string>("mb-3 text-muted-foreground");
  readonly iconWidth = input<string>("");
  readonly iconHeight = input<string>("");

  readonly computedIconClass = computed(() => {
    const spinClass = this.spin() ? " animate-spin" : "";
    return `${this.iconClass()}${spinClass}`;
  });
}