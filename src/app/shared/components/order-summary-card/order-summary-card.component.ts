import { CommonModule } from "@angular/common";
import { Component, input } from "@angular/core";
import { Order, Patient, Doctor, Clinic, SubOrder } from "@core/models";

@Component({
  selector: "app-order-summary-card",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./order-summary-card.component.html",
  styleUrl: "./order-summary-card.component.scss",
})
export class OrderSummaryCardComponent {
  readonly order = input.required<Order>();
  readonly patient = input<Patient | undefined>(undefined);
  readonly doctor = input<Doctor | undefined>(undefined);
  readonly clinic = input<Clinic | undefined>(undefined);
  readonly subOrders = input<readonly SubOrder[]>([]);
  readonly completedServices = input<number>(0);
  readonly totalServices = input<number>(0);
  readonly overallProgress = input<number>(0);
  readonly currentStage = input<number>(0);
  readonly stages = input<readonly string[]>([]);
}
