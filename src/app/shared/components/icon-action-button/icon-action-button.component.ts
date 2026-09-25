import { CommonModule } from "@angular/common";
import { Component, computed, input, output } from "@angular/core";
import { ButtonComponent } from "@shared/components/button/button.component";
import { SafeHtmlPipe } from "@shared/pipes/safe-html.pipe";

export type IconActionTone = "neutral" | "primary" | "danger";
export type IconActionSize = "icon" | "icon-sm";

const TONE_CLASSES: Record<IconActionTone, string> = {
  neutral:
    "!text-muted-foreground hover:!text-foreground !border-border/70 hover:!border-border !bg-card/50 hover:!bg-muted/70",
  primary:
    "!text-primary/80 hover:!text-primary !border-primary/20 hover:!border-primary/35 !bg-primary/5 hover:!bg-primary/10",
  danger:
    "!text-danger/80 hover:!text-danger !border-danger/20 hover:!border-danger/35 !bg-danger/5 hover:!bg-danger/10",
};

@Component({
  selector: "app-icon-action-button",
  standalone: true,
  imports: [CommonModule, ButtonComponent, SafeHtmlPipe],
  templateUrl: "./icon-action-button.component.html",
  styleUrls: ["./icon-action-button.component.scss"],
})
export class IconActionButtonComponent {
  readonly iconSvg = input.required<string>();
  readonly ariaLabel = input.required<string>();
  readonly title = input<string>("");
  readonly tone = input<IconActionTone>("neutral");
  readonly size = input<IconActionSize>("icon-sm");
  readonly disabled = input<boolean>(false);
  readonly customClass = input<string>("");
  readonly ariaExpanded = input<boolean | null>(null);

  readonly actionClick = output<MouseEvent>();

  readonly mergedButtonClass = computed(
    () =>
      `icon-action-btn !rounded-lg !border !shadow-none ${TONE_CLASSES[this.tone()]} ${this.disabled() ? "opacity-45 saturate-50" : ""} ${this.customClass()}`,
  );

  onClick(event: MouseEvent): void {
    this.actionClick.emit(event);
  }
}
