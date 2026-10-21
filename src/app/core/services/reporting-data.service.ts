import { Injectable, computed, inject, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { catchError, map, throwError } from "rxjs";
import type { OrdersRangeReportApi } from "@core/base/orders-range-report.api";
import type { TeamPerformanceReportApi } from "@core/base/team-performance-report.api";
import {
  MonthlyServiceMetric,
  OrderArchiveRecord,
  QuarterMonthDetail,
  QuarterReportDetail,
  ReportingSeedData,
  ServiceQuarterMetric,
  TeamPerformanceRecord,
} from "../interfaces";
import { ApiEndpoint } from "@core/enum/api.endpoint";
import { OrdersRangeReportAdapter } from "@core/adapters/orders-range-report.adapter";
import { TeamPerformanceReportAdapter } from "@core/adapters/team-performance-report.adapter";

const EMPTY_SEED: ReportingSeedData = {
  startYear: 0,
  endYear: 0,
  services: [],
  scanCenters: [],
  doctors: [],
  patientsFirstNames: [],
  patientsLastNames: [],
  operators: [],
  employeeTypes: [],
  employeeNames: [],
};

@Injectable({ providedIn: "root" })
export class ReportingDataService
  implements OrdersRangeReportApi, TeamPerformanceReportApi
{
  private readonly http = inject(HttpClient);
  private readonly ordersRangeAdapter = inject(OrdersRangeReportAdapter);
  private readonly teamPerformanceAdapter = inject(TeamPerformanceReportAdapter);

  private readonly _seed = signal<ReportingSeedData>(EMPTY_SEED);
  private readonly _orderArchive = signal<OrderArchiveRecord[]>([]);
  private readonly _teamPerformance = signal<TeamPerformanceRecord[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly seed = this._seed.asReadonly();
  readonly orderArchive = this._orderArchive.asReadonly();
  readonly teamPerformance = this._teamPerformance.asReadonly();

  readonly monthlyServiceMetrics = computed(() => {
    const metrics = new Map<string, MonthlyServiceMetric>();
    for (const order of this.orderArchive()) {
      const date = new Date(order.receivedAt);
      if (Number.isNaN(date.getTime())) continue;

      const serviceKey = toServiceKey(order.serviceName);
      const key = `${date.getUTCFullYear()}-${date.getUTCMonth()}-${serviceKey}`;
      const current = metrics.get(key);
      if (current) {
        current.ordersCount += 1;
        current.totalRevenue += order.amount;
        continue;
      }

      metrics.set(key, {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        serviceKey,
        serviceName: order.serviceName,
        ordersCount: 1,
        totalRevenue: order.amount,
      });
    }
    return [...metrics.values()];
  });

  readonly availableYears = computed(() => {
    const years = new Set(
      this.orderArchive()
        .map((order) => new Date(order.receivedAt).getUTCFullYear())
        .filter((year) => Number.isFinite(year) && year > 0),
    );
    return [...years].sort((left, right) => right - left);
  });

  loadSeedData(): void {
    this._loading.set(true);
    this._error.set(null);

    this.http
      .get<{ data: ReportingSeedData }>(ApiEndpoint.REPORTING_SEED)
      .pipe(map((response) => response.data ?? EMPTY_SEED))
      .pipe(
        catchError((error) => {
          this._error.set("Failed to load reporting seed data");
          console.error("Error loading reporting seed data:", error);
          return throwError(() => error);
        }),
      )
      .subscribe({
        next: (seed) => {
          this._seed.set(seed);
          this._loading.set(false);
        },
        error: () => {
          this._seed.set(EMPTY_SEED);
          this._loading.set(false);
        },
      });
  }

  loadOrderArchive(): void {
    this._loading.set(true);
    this._error.set(null);

    this.getOrdersRangeReport()
      .pipe(
        catchError((error) => {
          this._error.set("Failed to load order archive");
          console.error("Error loading order archive:", error);
          return throwError(() => error);
        }),
      )
      .subscribe({
        next: (orders) => {
          this._orderArchive.set(orders);
          this._loading.set(false);
        },
        error: () => {
          this._orderArchive.set([]);
          this._loading.set(false);
        },
      });
  }

  loadTeamPerformance(): void {
    this._loading.set(true);
    this._error.set(null);

    this.getTeamPerformanceReport()
      .pipe(
        catchError((error) => {
          this._error.set("Failed to load team performance");
          console.error("Error loading team performance:", error);
          return throwError(() => error);
        }),
      )
      .subscribe({
        next: (records) => {
          this._teamPerformance.set(records);
          this._loading.set(false);
        },
        error: () => {
          this._teamPerformance.set([]);
          this._loading.set(false);
        },
      });
  }

  getOrdersRangeReport() {
    return this.http
      .get<{ data: OrderArchiveRecord[] }>(
        `${ApiEndpoint.REPORTS_ORDERS_RANGE}?page=1&pageSize=100`,
      )
      .pipe(
        map((response) => this.ordersRangeAdapter.adapt(response.data ?? [])),
      );
  }

  getTeamPerformanceReport() {
    return this.http
      .get<{ data: TeamPerformanceRecord[] }>(
        ApiEndpoint.REPORTS_TEAM_PERFORMANCE,
      )
      .pipe(
        map((response) =>
          this.teamPerformanceAdapter.adapt(response.data ?? []),
        ),
      );
  }

  getQuarterReports(year: number): QuarterReportDetail[] {
    return [1, 2, 3, 4]
      .map((quarter) => this.buildQuarterReport(year, quarter))
      .filter((report): report is QuarterReportDetail => report !== null);
  }

  getQuarterReport(
    year: number,
    quarter: number,
  ): QuarterReportDetail | undefined {
    return this.getQuarterReports(year).find(
      (report) => report.quarter === quarter,
    );
  }

  private buildQuarterReport(
    year: number,
    quarter: number,
  ): QuarterReportDetail | null {
    const monthsInQuarter = this.getMonthsForQuarter(quarter);
    const metrics = this.monthlyServiceMetrics().filter(
      (metric) => metric.year === year && monthsInQuarter.includes(metric.month),
    );
    if (metrics.length === 0) return null;

    const months = monthsInQuarter
      .map((month) => this.buildMonthDetail(year, month, metrics))
      .filter((month): month is QuarterMonthDetail => month !== null);
    const services = this.aggregateServiceMetrics(metrics);

    return {
      year,
      quarter,
      quarterLabel: `Q${quarter}`,
      ordersCount: services.reduce((sum, item) => sum + item.ordersCount, 0),
      totalRevenue: services.reduce((sum, item) => sum + item.totalRevenue, 0),
      services,
      months,
    };
  }

  private buildMonthDetail(
    year: number,
    month: number,
    metrics: MonthlyServiceMetric[],
  ): QuarterMonthDetail | null {
    const monthMetrics = metrics.filter(
      (metric) => metric.year === year && metric.month === month,
    );
    if (monthMetrics.length === 0) return null;

    const services = this.aggregateServiceMetrics(monthMetrics);
    return {
      month,
      monthLabel: new Date(Date.UTC(year, month - 1, 1)).toLocaleString(
        "en-US",
        { month: "long", timeZone: "UTC" },
      ),
      ordersCount: services.reduce((sum, item) => sum + item.ordersCount, 0),
      totalRevenue: services.reduce((sum, item) => sum + item.totalRevenue, 0),
      services,
    };
  }

  private aggregateServiceMetrics(
    metrics: MonthlyServiceMetric[],
  ): ServiceQuarterMetric[] {
    const totals = new Map<
      string,
      { serviceName: string; ordersCount: number; totalRevenue: number }
    >();
    for (const metric of metrics) {
      const current = totals.get(metric.serviceKey);
      if (current) {
        current.ordersCount += metric.ordersCount;
        current.totalRevenue += metric.totalRevenue;
      } else {
        totals.set(metric.serviceKey, {
          serviceName: metric.serviceName,
          ordersCount: metric.ordersCount,
          totalRevenue: metric.totalRevenue,
        });
      }
    }

    return [...totals.entries()]
      .map(([serviceKey, total]) => ({
        serviceKey,
        serviceName: total.serviceName,
        ordersCount: total.ordersCount,
        totalRevenue: total.totalRevenue,
        averageUnitPrice:
          total.ordersCount === 0
            ? 0
            : Math.round(total.totalRevenue / total.ordersCount),
      }))
      .sort((left, right) => right.totalRevenue - left.totalRevenue);
  }

  private getMonthsForQuarter(quarter: number): number[] {
    const start = (quarter - 1) * 3 + 1;
    return [start, start + 1, start + 2];
  }
}

function toServiceKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
