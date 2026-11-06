import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { AiQuickAction } from "@core/interfaces";
import { AppButtonComponent } from "@shared/components/button/button.component";
import { SafeHtmlPipe } from "@shared/pipes/safe-html.pipe";
import { lucideSvg } from "@shared/icons/lucide-icons";

@Component({
  selector: "app-ai-quick-actions",
  standalone: true,
  imports: [CommonModule, AppButtonComponent, SafeHtmlPipe],
  templateUrl: "./ai-quick-actions.component.html",
  styleUrl: "./ai-quick-actions.component.scss",
})
export class AiQuickActionsComponent {
  readonly actions = input<readonly AiQuickAction[]>([]);
  readonly disabled = input<boolean>(false);

  readonly actionInvoked = output<AiQuickAction>();

  onActionSelected(action: AiQuickAction): void {
    if (this.disabled()) {
      return;
    }
    this.actionInvoked.emit(action);
  }

  iconFor(action: AiQuickAction): string {
    return lucideSvg(action.icon || "info", 14);
  }
}
