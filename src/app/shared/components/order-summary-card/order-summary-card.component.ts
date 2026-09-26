import { CommonModule } from "@angular/common";
import { Component, input } from "@angular/core";
import { Order } from "@core/models";

@Component({
  selector: "app-order-summary-card",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./order-summary-card.component.html",
  styleUrl: "./order-summary-card.component.scss",
})
export class OrderSummaryCardComponent {
  readonly order = input.required<Order>();
  readonly completedServices = input<number>(0);
  readonly totalServices = input<number>(0);
}
