import { CommonModule } from "@angular/common";
import { Component, computed, inject, signal } from "@angular/core";
import { FormatUtils } from "@core/services/format-utils.service";
import { ReportingDataService } from "@core/services/reporting-data.service";
import { OrderArchiveRecord } from "@core/models";
import { AppButtonComponent } from "@shared/components/button/button.component";
import { DataTableToolbarComponent } from "@shared/components/data-table-toolbar/data-table-toolbar.component";
import { AppTextFieldComponent } from "@shared/components/input/input.component";
import { TableFeedbackComponent } from "@shared/components/table-feedback/table-feedback.component";

interface MonthlyOrderGroup {
  monthKey: string;
  monthLabel: string;
  ordersCount: number;
  totalRevenue: number;
  chargedRevenue: number;
  orders: OrderArchiveRecord[];
}

@Component({
  selector: "app-orders-range-report",
  standalone: true,
  imports: [
    CommonModule,
    DataTableToolbarComponent,
    AppTextFieldComponent,
    AppButtonComponent,
    TableFeedbackComponent,
  ],
  templateUrl: "./orders-range-report.component.html",
  styleUrl: "./orders-range-report.component.scss",
})
export class OrdersRangeReportComponent {
  private readonly reportingData = inject(ReportingDataService);
  protected readonly formatUtils = inject(FormatUtils);

  readonly loading = this.reportingData.loading;
  readonly sourceOrders = this.reportingData.orderArchive;

  readonly fromDateInput = signal(this.defaultFromDate());
  readonly toDateInput = signal(this.defaultToDate());
  readonly appliedFromDate = signal(this.defaultFromDate());
  readonly appliedToDate = signal(this.defaultToDate());
  readonly search = signal("");
  readonly dateError = signal<string>("");

  readonly filteredOrders = computed(() => {
    const source = this.sourceOrders();
    const fromDate = new Date(`${this.appliedFromDate()}T00:00:00`);
    const toDate = new Date(`${this.appliedToDate()}T23:59:59`);
    const query = this.search().trim().toLowerCase();

    return source.filter((order) => {
      const receivedAt = new Date(order.receivedAt).getTime();
      if (Number.isNaN(receivedAt)) return false;
      if (receivedAt < fromDate.getTime() || receivedAt > toDate.getTime()) {
        return false;
      }
      if (!query) return true;
      return (
        order.orderId.toLowerCase().includes(query) ||
        order.patientName.toLowerCase().includes(query) ||
        order.doctorName.toLowerCase().includes(query) ||
        order.scanCenter.toLowerCase().includes(query) ||
        order.serviceName.toLowerCase().includes(query)
      );
    });
  });

  readonly monthGroups = computed<MonthlyOrderGroup[]>(() => {
    const groups = new Map<string, MonthlyOrderGroup>();
    for (const order of this.filteredOrders()) {
      const date = new Date(order.receivedAt);
      const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
      const monthLabel = date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      });
      if (!groups.has(monthKey)) {
        groups.set(monthKey, {
          monthKey,
          monthLabel,
          ordersCount: 0,
          totalRevenue: 0,
          chargedRevenue: 0,
          orders: [],
        });
      }
      const group = groups.get(monthKey);
      if (!group) continue;
      group.ordersCount += 1;
      group.totalRevenue += order.amount;
      if (order.chargedAt) {
        group.chargedRevenue += order.amount;
      }
      group.orders.push(order);
    }

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        orders: [...group.orders].sort(
          (left, right) =>
            new Date(right.receivedAt).getTime() -
            new Date(left.receivedAt).getTime(),
        ),
      }))
      .sort((left, right) => right.monthKey.localeCompare(left.monthKey));
  });

  readonly summary = computed(() => {
    const groups = this.monthGroups();
    return groups.reduce(
      (acc, group) => {
        acc.months += 1;
        acc.orders += group.ordersCount;
        acc.revenue += group.totalRevenue;
        acc.charged += group.chargedRevenue;
        return acc;
      },
      { months: 0, orders: 0, revenue: 0, charged: 0 },
    );
  });

  applyDateFilter(): void {
    if (this.fromDateInput() > this.toDateInput()) {
      this.dateError.set("From date must be before To date.");
      return;
    }
    this.dateError.set("");
    this.appliedFromDate.set(this.fromDateInput());
    this.appliedToDate.set(this.toDateInput());
  }

  resetFilter(): void {
    const from = this.defaultFromDate();
    const to = this.defaultToDate();
    this.fromDateInput.set(from);
    this.toDateInput.set(to);
    this.appliedFromDate.set(from);
    this.appliedToDate.set(to);
    this.search.set("");
    this.dateError.set("");
  }

  onSearchValueChange(value: string): void {
    this.search.set(value);
  }

  chargedLabel(order: OrderArchiveRecord): string {
    if (!order.chargedAt) return "Not charged yet";
    return this.formatUtils.formatDate(order.chargedAt, true);
  }

  archLabel(order: OrderArchiveRecord): string {
    if (order.maxillary && order.mandibular) return "Both";
    if (order.maxillary) return "Maxilla";
    return "Mandible";
  }

  private defaultFromDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() - 5);
    date.setDate(1);
    return date.toISOString().slice(0, 10);
  }

  private defaultToDate(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
