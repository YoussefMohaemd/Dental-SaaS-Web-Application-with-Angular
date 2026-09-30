import { CommonModule } from "@angular/common";
import { Component, computed, inject, signal } from "@angular/core";
import { OrderArchiveRecord } from "@core/models";
import { FormatUtils } from "@core/services/format-utils.service";
import { NavigationService } from "@core/services/navigation.service";
import { ReportingDataService } from "@core/services/reporting-data.service";
import { AppButtonComponent } from "@shared/components/button/button.component";
import { DataTableToolbarComponent } from "@shared/components/data-table-toolbar/data-table-toolbar.component";
import { EnterprisePaginatorComponent } from "@shared/components/enterprise-paginator/enterprise-paginator.component";
import { AppTextFieldComponent } from "@shared/components/input/input.component";
import { TableFeedbackComponent } from "@shared/components/table-feedback/table-feedback.component";
import { paginateTableRows, tableTotalPages } from "@shared/utils/table-state";
import { TagModule } from "primeng/tag";

interface ServiceMixItem {
  serviceName: string;
  ordersCount: number;
  totalRevenue: number;
  sharePercent: number;
}

interface MonthlyOrderGroup {
  monthKey: string;
  monthLabel: string;
  ordersCount: number;
  totalRevenue: number;
  chargedRevenue: number;
  chargedOrders: number;
  chargeRate: number;
  averageOrderValue: number;
  topServiceName: string;
  serviceMix: ServiceMixItem[];
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
    EnterprisePaginatorComponent,
    TableFeedbackComponent,
    TagModule,
  ],
  templateUrl: "./orders-range-report.component.html",
  styleUrl: "./orders-range-report.component.scss",
})
export class OrdersRangeReportComponent {
  private readonly reportingData = inject(ReportingDataService);
  private readonly navigationService = inject(NavigationService);
  protected readonly formatUtils = inject(FormatUtils);

  readonly loading = this.reportingData.loading;
  readonly sourceOrders = this.reportingData.orderArchive;

  readonly fromDateInput = signal("");
  readonly toDateInput = signal("");
  readonly appliedFromDate = signal("");
  readonly appliedToDate = signal("");
  readonly search = signal("");
  readonly dateError = signal<string>("");

  readonly monthPage = signal(1);
  readonly monthsPerPage = 3;
  readonly monthOrderPageState = signal<Record<string, number>>({});
  readonly ordersPerMonthPage = 6;

  readonly filteredOrders = computed(() => {
    const source = this.sourceOrders();
    const fromValue = this.appliedFromDate().trim();
    const toValue = this.appliedToDate().trim();
    const query = this.search().trim().toLowerCase();

    const fromDate = fromValue ? new Date(`${fromValue}T00:00:00`) : null;
    const toDate = toValue ? new Date(`${toValue}T23:59:59`) : null;

    return source.filter((order) => {
      const receivedAt = new Date(order.receivedAt).getTime();
      if (Number.isNaN(receivedAt)) return false;
      if (fromDate && receivedAt < fromDate.getTime()) {
        return false;
      }
      if (toDate && receivedAt > toDate.getTime()) {
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
    const groups = new Map<
      string,
      {
        monthKey: string;
        monthLabel: string;
        ordersCount: number;
        totalRevenue: number;
        chargedRevenue: number;
        chargedOrders: number;
        orders: OrderArchiveRecord[];
      }
    >();

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
          chargedOrders: 0,
          orders: [],
        });
      }

      const group = groups.get(monthKey);
      if (!group) continue;

      group.ordersCount += 1;
      group.totalRevenue += order.amount;
      if (order.chargedAt) {
        group.chargedRevenue += order.amount;
        group.chargedOrders += 1;
      }
      group.orders.push(order);
    }

    return Array.from(groups.values())
      .map((group) => {
        const orderedRows = [...group.orders].sort(
          (left, right) =>
            new Date(right.receivedAt).getTime() -
            new Date(left.receivedAt).getTime(),
        );
        const serviceMix = this.buildServiceMix(
          orderedRows,
          group.totalRevenue,
        );
        return {
          monthKey: group.monthKey,
          monthLabel: group.monthLabel,
          ordersCount: group.ordersCount,
          totalRevenue: group.totalRevenue,
          chargedRevenue: group.chargedRevenue,
          chargedOrders: group.chargedOrders,
          chargeRate:
            group.ordersCount === 0
              ? 0
              : Math.round((group.chargedOrders / group.ordersCount) * 100),
          averageOrderValue:
            group.ordersCount === 0
              ? 0
              : Math.round(group.totalRevenue / group.ordersCount),
          topServiceName: serviceMix[0]?.serviceName ?? "No services",
          serviceMix,
          orders: orderedRows,
        };
      })
      .sort((left, right) => right.monthKey.localeCompare(left.monthKey));
  });

  readonly totalMonthPages = computed(() =>
    tableTotalPages(this.monthGroups().length, this.monthsPerPage),
  );

  readonly pagedMonthGroups = computed(() =>
    paginateTableRows(this.monthGroups(), this.monthPage(), this.monthsPerPage),
  );

  readonly showMonthPagination = computed(() => this.totalMonthPages() > 1);

  readonly summary = computed(() =>
    this.monthGroups().reduce(
      (acc, group) => {
        acc.months += 1;
        acc.orders += group.ordersCount;
        acc.revenue += group.totalRevenue;
        acc.charged += group.chargedRevenue;
        acc.chargedOrders += group.chargedOrders;
        return acc;
      },
      { months: 0, orders: 0, revenue: 0, charged: 0, chargedOrders: 0 },
    ),
  );

  readonly chargedCoverageRate = computed(() => {
    const totals = this.summary();
    if (totals.orders === 0) return 0;
    return Math.round((totals.chargedOrders / totals.orders) * 100);
  });

  readonly averageOrderValue = computed(() => {
    const totals = this.summary();
    if (totals.orders === 0) return 0;
    return Math.round(totals.revenue / totals.orders);
  });

  readonly dateRangeLabel = computed(() => {
    const fromRaw = this.appliedFromDate().trim();
    const toRaw = this.appliedToDate().trim();
    if (!fromRaw && !toRaw) return "All available dates";
    if (fromRaw && toRaw) {
      return `${this.formatReadableDate(fromRaw)} -> ${this.formatReadableDate(toRaw)}`;
    }
    if (fromRaw) return `From ${this.formatReadableDate(fromRaw)}`;
    return `Until ${this.formatReadableDate(toRaw)}`;
  });

  applyDateFilter(): void {
    const fromValue = this.fromDateInput().trim();
    const toValue = this.toDateInput().trim();

    if (fromValue && toValue && fromValue > toValue) {
      this.dateError.set("From date must be before To date.");
      return;
    }

    this.dateError.set("");
    this.appliedFromDate.set(fromValue);
    this.appliedToDate.set(toValue);
    this.monthPage.set(1);
    this.monthOrderPageState.set({});
  }

  resetFilter(): void {
    this.fromDateInput.set("");
    this.toDateInput.set("");
    this.appliedFromDate.set("");
    this.appliedToDate.set("");
    this.search.set("");
    this.dateError.set("");
    this.monthPage.set(1);
    this.monthOrderPageState.set({});
  }

  onSearchValueChange(value: string): void {
    this.search.set(value);
    this.monthPage.set(1);
    this.monthOrderPageState.set({});
  }

  onMonthPageChange(pageNumber: number): void {
    this.monthPage.set(pageNumber);
  }

  monthOrderRows(group: MonthlyOrderGroup): OrderArchiveRecord[] {
    return paginateTableRows(
      group.orders,
      this.monthOrderPage(group),
      this.ordersPerMonthPage,
    );
  }

  monthOrderPage(group: MonthlyOrderGroup): number {
    const state = this.monthOrderPageState();
    const configuredPage = state[group.monthKey] ?? 1;
    const totalPages = this.monthOrderTotalPages(group);
    if (totalPages === 0) return 1;
    return Math.min(Math.max(configuredPage, 1), totalPages);
  }

  monthOrderTotalPages(group: MonthlyOrderGroup): number {
    return tableTotalPages(group.orders.length, this.ordersPerMonthPage);
  }

  showMonthOrderPagination(group: MonthlyOrderGroup): boolean {
    return this.monthOrderTotalPages(group) > 1;
  }

  onMonthOrderPageChange(monthKey: string, pageNumber: number): void {
    this.monthOrderPageState.update((state) => ({
      ...state,
      [monthKey]: pageNumber,
    }));
  }

  goToReportsHub(): void {
    this.navigationService.navigate("reports");
  }

  chargedLabel(order: OrderArchiveRecord): string {
    if (!order.chargedAt) return "Not charged yet";
    return this.formatUtils.formatDate(order.chargedAt, true);
  }

  archLabel(order: OrderArchiveRecord): string {
    if (order.maxillary && order.mandibular) return "Both arches";
    if (order.maxillary) return "Maxilla";
    return "Mandible";
  }

  groupRevenueShare(group: MonthlyOrderGroup): number {
    const totalRevenue = this.summary().revenue;
    if (totalRevenue === 0) return 0;
    return Math.round((group.totalRevenue / totalRevenue) * 100);
  }

  monthChargeSeverity(rate: number): "info" | "warn" {
    return rate >= 70 ? "info" : "warn";
  }

  clampedPercent(value: number): number {
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  progressColor(
    value: number,
    context: "coverage" | "revenue" | "collection" | "service" = "coverage",
  ): string {
    const percent = this.clampedPercent(value);

    if (context === "collection") {
      if (percent >= 80) return "#16A34A";
      if (percent >= 65) return "#0EA5E9";
      if (percent >= 45) return "#F59E0B";
      return "#EF4444";
    }

    if (context === "service") {
      if (percent >= 50) return "#2563EB";
      if (percent >= 25) return "#0EA5E9";
      return "#94A3B8";
    }

    if (context === "revenue") {
      if (percent >= 40) return "#1D4ED8";
      if (percent >= 20) return "#2563EB";
      return "#60A5FA";
    }

    if (percent >= 85) return "#16A34A";
    if (percent >= 70) return "#0EA5E9";
    if (percent >= 50) return "#F59E0B";
    return "#EF4444";
  }

  private buildServiceMix(
    orders: OrderArchiveRecord[],
    totalRevenue: number,
  ): ServiceMixItem[] {
    const byService = new Map<
      string,
      { ordersCount: number; totalRevenue: number }
    >();

    for (const order of orders) {
      const current = byService.get(order.serviceName);
      if (current) {
        current.ordersCount += 1;
        current.totalRevenue += order.amount;
      } else {
        byService.set(order.serviceName, {
          ordersCount: 1,
          totalRevenue: order.amount,
        });
      }
    }

    return Array.from(byService.entries())
      .map(([serviceName, entry]) => ({
        serviceName,
        ordersCount: entry.ordersCount,
        totalRevenue: entry.totalRevenue,
        sharePercent:
          totalRevenue === 0
            ? 0
            : Math.round((entry.totalRevenue / totalRevenue) * 100),
      }))
      .sort((left, right) => right.totalRevenue - left.totalRevenue);
  }

  private formatReadableDate(rawDate: string): string {
    const date = new Date(`${rawDate}T00:00:00`);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
}
