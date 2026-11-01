import { CommonModule } from "@angular/common";
import { Component, computed, input, output } from "@angular/core";
import { AiResultCard } from "@core/interfaces";
import { AppButtonComponent } from "../button/button.component";

@Component({
  selector: "app-ai-result-card",
  standalone: true,
  imports: [CommonModule, AppButtonComponent],
  templateUrl: "./ai-result-card.component.html",
  styleUrl: "./ai-result-card.component.scss",
})
export class AiResultCardComponent {
  readonly result = input.required<AiResultCard>();
  readonly resultAction = output<AiResultCard>();

  readonly toneClass = computed(() => `ai-result-card--${this.result().tone}`);

  onResultAction(): void {
    this.resultAction.emit(this.result());
  }
}
