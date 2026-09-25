import { Component, input, output, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TuiButton } from "@taiga-ui/core/components/button";

export type ButtonVariant =
  "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
export type ButtonSize = "sm" | "md" | "lg" | "icon" | "icon-sm";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground !bg-primary !text-primary-foreground hover:bg-primary/90 hover:!bg-primary/90 active:bg-[#1D4ED8] active:!bg-[#1D4ED8] dark:active:bg-[#2563EB] dark:active:!bg-[#2563EB] " +
    "disabled:bg-primary/60 disabled:text-primary-foreground/80 disabled:!bg-primary/60 disabled:!text-primary-foreground/80 shadow-xs",
  secondary:
    "bg-secondary text-secondary-foreground !bg-secondary !text-secondary-foreground hover:bg-muted hover:!bg-muted active:bg-muted active:!bg-muted " +
    "border border-border !border !border-border",

  outline:
    "border border-border !border !border-border bg-card dark:bg-card !bg-card dark:!bg-card text-foreground !text-foreground hover:bg-muted hover:!bg-muted dark:hover:bg-muted dark:hover:!bg-muted " +
    "active:bg-muted active:!bg-muted disabled:bg-muted/50 disabled:text-muted-foreground disabled:!bg-muted/50 disabled:!text-muted-foreground",

  ghost:
    "bg-transparent text-foreground !bg-transparent !text-foreground hover:bg-muted hover:!bg-muted dark:hover:bg-muted dark:hover:!bg-muted active:bg-muted active:!bg-muted " +
    "disabled:text-muted-foreground disabled:!text-muted-foreground",
  danger:
    "bg-danger text-danger-foreground !bg-danger !text-danger-foreground hover:bg-danger/90 hover:!bg-danger/90 active:bg-[#DC2626] active:!bg-[#DC2626] disabled:bg-danger/60 disabled:!bg-danger/60",
  success:
    "bg-success text-success-foreground !bg-success !text-success-foreground hover:bg-success/90 hover:!bg-success/90 active:bg-[#059669] active:!bg-[#059669] disabled:bg-success/60 disabled:!bg-success/60",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs min-h-8",
  md: "px-4 py-2 text-sm min-h-10",
  lg: "px-4 py-2.5 text-sm min-h-10",
  icon: "p-2 min-h-9 min-w-9",
  "icon-sm": "p-1.5 min-h-7 min-w-7",
};

@Component({
  selector: "app-button",
  standalone: true,
  imports: [CommonModule, TuiButton],
  templateUrl: "./button.component.html",
  styleUrl: "./button.component.scss",
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>("primary");
  readonly size = input<ButtonSize>("md");
  readonly type = input<"button" | "submit" | "reset">("button");
  readonly disabled = input<boolean>(false);
  readonly loading = input<boolean>(false);

  readonly onClick = output<MouseEvent>();

  readonly buttonClasses = computed(() => {
    const base =
      "inline-flex items-center justify-center gap-2  font-semibold rounded-lg !rounded-xl transition-colors duration-150 " +
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1 " +
      "focus-visible:ring-offset-card disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none " +
      "[&_svg]:shrink-0 [&_svg]:block";

    return `${base} ${VARIANT_CLASSES[this.variant()]} ${SIZE_CLASSES[this.size()]}`;
  });

  readonly isDisabled = computed(() => this.disabled() || this.loading());

  handleClick(event: MouseEvent): void {
    if (this.isDisabled()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.onClick.emit(event);
  }
}
