import { CommonModule } from "@angular/common";
import { Component, computed, input, output } from "@angular/core";
import { AiShortcutAction } from "@core/interfaces";
import { AppButtonComponent } from "../button/button.component";

@Component({
  selector: "app-ai-shortcut-card",
  standalone: true,
  imports: [CommonModule, AppButtonComponent],
  templateUrl: "./ai-shortcut-card.component.html",
  styleUrl: "./ai-shortcut-card.component.scss",
})
export class AiShortcutCardComponent {
  readonly action = input.required<AiShortcutAction>();
  readonly compact = input<boolean>(false);

  readonly actionSelected = output<AiShortcutAction>();

  readonly intentLabel = computed(() => {
    const labels: Record<AiShortcutAction["intent"], string> = {
      createOrder: "Create",
      updateOrder: "Update",
      openOrderDetails: "Open",
      generateReport: "Report",
      openOrders: "Orders",
      openReports: "Reports",
      searchOrders: "Search",
      searchPatients: "Search",
      addDoctor: "Add",
      addPatient: "Add",
      addClinic: "Add",
      aboutCompany: "Info",
      servicePricing: "Pricing",
      serviceCatalog: "Services",
      submissionStandards: "Standards",
    };
    return labels[this.action().intent];
  });

  onSelect(): void {
    this.actionSelected.emit(this.action());
  }
}
