import { Component, computed, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ScanCenterDataService } from "@core/services/scan-center-data.service";
import { OrderDataService } from "@core/services/order-data.service";
import { NavigationService } from "@core/services/navigation.service";
import { FormatUtils } from "@core/services/format-utils.service";
import { Order, ScanCenter } from "@core/models";
import { StatusBadgeComponent } from "@shared/components/status-badge/status-badge.component";
import { ButtonComponent } from "@shared/components/button/button.component";
import { AvatarComponent } from "@shared/components/avatar/avatar.component";
import { SafeHtmlPipe } from "../../shared/pipes/safe-html.pipe";

interface ScanOrderRow extends Order {
  scanStatus: "Active" | "Review" | "Done";
}

@Component({
  selector: "app-scan-center",
  standalone: true,
  imports: [CommonModule, SafeHtmlPipe],
  templateUrl: "./scan-center.component.html",
  styleUrl: "./scan-center.component.scss",
})
export class ScanCenterComponent {
  private readonly scanCenterService = inject(ScanCenterDataService);
  private readonly orderService = inject(OrderDataService);
  protected readonly navigationService = inject(NavigationService);
  protected readonly formatUtils = inject(FormatUtils);

  readonly scanCenters = this.scanCenterService.scanCenters;
  readonly orders = this.orderService.orders;

  readonly search = signal("");

  readonly scanCentersData = computed(() => this.scanCenters());

  readonly scanOrders = computed(() =>
    this.orders().filter((o) => o.scanCenterName),
  );

  readonly filteredOrders = computed(() => {
    const search = this.search();
    if (!search) return this.scanOrders().slice(0, 20);
    const q = search.toLowerCase();
    return this.scanOrders()
      .filter(
        (o) =>
          o.scanCenterName.toLowerCase().includes(q) ||
          o.orderNumber.toLowerCase().includes(q) ||
          o.patientName.toLowerCase().includes(q),
      )
      .slice(0, 20);
  });

  getScanStatus(order: Order): { label: string; class: string; icon: string } {
    if (order.status === "Completed") {
      return { label: "Done", class: "text-success", icon: "check-circle-2" };
    }
    if (order.status === "Review") {
      return { label: "Review", class: "text-warning", icon: "alert-circle" };
    }
    return { label: "Active", class: "text-primary", icon: "activity" };
  }

  getStatusColor(status: string): string {
    if (status === "Operational") return "bg-emerald-50 text-emerald-700";
    return "bg-amber-50 text-amber-700";
  }

  navigateToOrder(orderId: string): void {
    this.navigationService.navigate("viewOrder", { orderId });
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.search.set(target.value);
  }

  getIconSvg(name: string): string {
    const icons: Record<string, string> = {
      "scan-line":
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path><path d="M7 12h10"></path></svg>',
      search:
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35"></path></svg>',
      "check-circle-2":
        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
      "alert-circle":
        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
      activity:
        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>',
    };
    return icons[name] || "";
  }
}
