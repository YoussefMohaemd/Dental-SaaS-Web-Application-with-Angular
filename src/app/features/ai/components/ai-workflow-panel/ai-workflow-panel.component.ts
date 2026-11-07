import { CommonModule } from "@angular/common";
import { Component, computed, input, output } from "@angular/core";
import { AppButtonComponent } from "@shared/components/button/button.component";
import {
  AiActionWorkflowField,
  AiActionWorkflowState,
} from "../../state/ai-action-workflow.models";

@Component({
  selector: "app-ai-workflow-panel",
  standalone: true,
  imports: [CommonModule, AppButtonComponent],
  templateUrl: "./ai-workflow-panel.component.html",
  styleUrl: "./ai-workflow-panel.component.scss",
})
export class AiWorkflowPanelComponent {
  readonly workflow = input.required<AiActionWorkflowState>();
  readonly field = input<AiActionWorkflowField | null>(null);

  readonly valueChanged = output<string>();
  readonly continueRequested = output<void>();
  readonly cancelRequested = output<void>();

  readonly progressText = computed(() => {
    const state = this.workflow();
    return `${state.stepIndex + 1}/${state.fields.length}`;
  });
}
