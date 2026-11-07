import { CommonModule } from "@angular/common";
import { Component, computed, input, output } from "@angular/core";
import { AppButtonComponent } from "@shared/components/button/button.component";
import { TeethChartComponent } from "@shared/components/teeth-chart/teeth-chart.component";
import {
  AiOrderWorkflowState,
} from "../../state/ai-order-workflow.models";

@Component({
  selector: "app-ai-order-workflow-panel",
  standalone: true,
  imports: [CommonModule, AppButtonComponent, TeethChartComponent],
  templateUrl: "./ai-order-workflow-panel.component.html",
  styleUrl: "./ai-order-workflow-panel.component.scss",
})
export class AiOrderWorkflowPanelComponent {
  readonly workflow = input.required<AiOrderWorkflowState>();

  readonly inputChanged = output<string>();
  readonly continueRequested = output<void>();
  readonly candidatePicked = output<string>();
  readonly billToChanged = output<"doctor" | "scan-center">();
  readonly serviceToggled = output<string>();
  readonly activeServiceChanged = output<string>();
  readonly toothToggled = output<number>();
  readonly notesChanged = output<string>();
  readonly submitRequested = output<void>();
  readonly cancelRequested = output<void>();

  readonly heading = computed(() => {
    const state = this.workflow();
    if (state.mode === "create") {
      return "Create Order Workflow";
    }
    return "Update Order Workflow";
  });

  readonly selectedServiceNames = computed(() => {
    const state = this.workflow();
    const selected =
      state.mode === "create"
        ? state.create?.selectedServiceIds ?? []
        : state.update?.selectedServiceIds ?? [];
    return selected
      .map((id) => state.services.find((item) => item.id === id)?.name ?? id)
      .join(", ");
  });

  readonly activeServiceId = computed(() => {
    const state = this.workflow();
    if (state.mode === "create") {
      return state.create?.activeServiceId ?? null;
    }
    return state.update?.activeServiceId ?? null;
  });

  readonly activeServiceTeeth = computed(() => {
    const state = this.workflow();
    const activeServiceId = this.activeServiceId();
    if (!activeServiceId) {
      return [];
    }
    if (state.mode === "create") {
      return state.create?.selectedTeethByService[activeServiceId] ?? [];
    }
    return state.update?.selectedTeethByService[activeServiceId] ?? [];
  });

  readonly selectedServiceTeethMap = computed<Record<string, number[]>>(() => {
    const state = this.workflow();
    if (state.mode === "create") {
      return state.create?.selectedTeethByService ?? {};
    }
    return state.update?.selectedTeethByService ?? {};
  });

  readonly selectedServiceItems = computed(() => {
    const state = this.workflow();
    const selectedIds =
      state.mode === "create"
        ? state.create?.selectedServiceIds ?? []
        : state.update?.selectedServiceIds ?? [];
    const map = this.selectedServiceTeethMap();
    return selectedIds.map((id) => ({
      id,
      name: state.services.find((service) => service.id === id)?.name ?? id,
      teeth: map[id] ?? [],
    }));
  });

  onPick(id: string): void {
    this.candidatePicked.emit(id);
  }
}
