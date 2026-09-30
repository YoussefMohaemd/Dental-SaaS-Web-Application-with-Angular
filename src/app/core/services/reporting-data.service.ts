import { Injectable, computed, inject, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { catchError, of } from "rxjs";
import {
  FALLBACK_REPORTING_SEED,
  MonthlyServiceMetric,
  OrderArchiveRecord,
  QuarterMonthDetail,
  QuarterReportDetail,
  ReportingSeedData,
  ServiceQuarterMetric,
  TeamPerformanceRecord,
} from "../models";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

@Injectable({ providedIn: "root" })
export class ReportingDataService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = "/data/reporting-seed.json";

  private readonly _seed = signal<ReportingSeedData>(FALLBACK_REPORTING_SEED);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly seed = this._seed.asReadonly();

  readonly orderArchive = computed(() =>
    this.generateOrderArchiveRecords(this.seed()),
  );

  readonly monthlyServiceMetrics = computed(() =>
    this.generateMonthlyServiceMetrics(this.seed()),
  );

  readonly teamPerformance = computed(() =>
    this.generateTeamPerformanceRows(this.seed()),
  );

  readonly availableYears = computed(() => {
    const startYear = this.seed().startYear;
    const endYear = this.seed().endYear;
    const years: number[] = [];
    for (let year = endYear; year >= startYear; year -= 1) {
      years.push(year);
    }
    return years;
  });

  constructor() {
    this.loadSeedData();
  }

  loadSeedData(): void {
    this._loading.set(true);
    this._error.set(null);

    this.http
      .get<ReportingSeedData>(this.API_URL)
      .pipe(
        catchError((err) => {
          this._error.set("Failed to load reporting seed data");
          console.error("Error loading reporting seed data:", err);
          return of(FALLBACK_REPORTING_SEED);
        }),
      )
      .subscribe({
        next: (seedData: ReportingSeedData) => {
          this._seed.set(seedData);
          this._loading.set(false);
        },
        error: () => {
          this._loading.set(false);
        },
      });
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
    return this.getQuarterReports(year).find((report) => report.quarter === quarter);
  }

  private buildQuarterReport(
    year: number,
    quarter: number,
  ): QuarterReportDetail | null {
    if (quarter < 1 || quarter > 4) return null;

    const quarterMonths = this.getMonthsForQuarter(quarter);
    const yearMetrics = this.monthlyServiceMetrics().filter(
      (metric) => metric.year === year && quarterMonths.includes(metric.month),
    );
    if (yearMetrics.length === 0) return null;

    const months = quarterMonths
      .map((month) => this.buildMonthDetail(year, month, yearMetrics))
      .filter((month): month is QuarterMonthDetail => month !== null);

    const services = this.aggregateServiceMetrics(yearMetrics);
    const ordersCount = services.reduce((sum, item) => sum + item.ordersCount, 0);
    const totalRevenue = services.reduce(
      (sum, item) => sum + item.totalRevenue,
      0,
    );

    return {
      year,
      quarter,
      quarterLabel: `Q${quarter}`,
      ordersCount,
      totalRevenue,
      services,
      months,
    };
  }

  private buildMonthDetail(
    year: number,
    month: number,
    scopedMetrics: MonthlyServiceMetric[],
  ): QuarterMonthDetail | null {
    const monthMetrics = scopedMetrics.filter(
      (metric) => metric.year === year && metric.month === month,
    );
    if (monthMetrics.length === 0) return null;

    const services = this.aggregateServiceMetrics(monthMetrics);
    const ordersCount = services.reduce((sum, item) => sum + item.ordersCount, 0);
    const totalRevenue = services.reduce(
      (sum, item) => sum + item.totalRevenue,
      0,
    );

    return {
      month,
      monthLabel: MONTH_NAMES[month - 1] ?? "Unknown",
      ordersCount,
      totalRevenue,
      services,
    };
  }

  private aggregateServiceMetrics(
    metrics: MonthlyServiceMetric[],
  ): ServiceQuarterMetric[] {
    const totalsByService = new Map<
      string,
      { serviceName: string; ordersCount: number; totalRevenue: number }
    >();

    for (const metric of metrics) {
      const current = totalsByService.get(metric.serviceKey);
      if (current) {
        current.ordersCount += metric.ordersCount;
        current.totalRevenue += metric.totalRevenue;
      } else {
        totalsByService.set(metric.serviceKey, {
          serviceName: metric.serviceName,
          ordersCount: metric.ordersCount,
          totalRevenue: metric.totalRevenue,
        });
      }
    }

    return this.seed().services.map((service) => {
      const total = totalsByService.get(service.key);
      const ordersCount = total?.ordersCount ?? 0;
      const totalRevenue = total?.totalRevenue ?? 0;
      return {
        serviceKey: service.key,
        serviceName: service.label,
        ordersCount,
        totalRevenue,
        averageUnitPrice:
          ordersCount === 0 ? 0 : Math.round(totalRevenue / ordersCount),
      };
    });
  }

  private generateOrderArchiveRecords(seed: ReportingSeedData): OrderArchiveRecord[] {
    const records: OrderArchiveRecord[] = [];
    let sequence = 1;

    for (let year = seed.startYear; year <= seed.endYear; year += 1) {
      for (let month = 1; month <= 12; month += 1) {
        const ordersInMonth = 5 + ((year + month) % 3);
        for (let index = 0; index < ordersInMonth; index += 1) {
          const service =
            seed.services[(month + index + year) % seed.services.length];
          const unitCount = 1 + ((year + month + index) % 4);
          const day = Math.min(25, 2 + index * 4 + ((year + month) % 2));
          const receivedDate = new Date(
            Date.UTC(year, month - 1, day, 8 + (index % 5), 15, 0),
          );
          const sentDate = new Date(receivedDate);
          sentDate.setUTCDate(sentDate.getUTCDate() + 1 + ((index + month) % 4));
          const chargedDate = new Date(sentDate);
          chargedDate.setUTCHours(chargedDate.getUTCHours() + 3);

          let maxillary = (month + index) % 2 === 0;
          const mandibular = (month + index + year) % 3 === 0;
          if (!maxillary && !mandibular) {
            maxillary = true;
          }

          const pricePerUnit =
            service.basePrice * 12 + ((month + year + index) % 5) * 7;
          const amount = pricePerUnit * unitCount;
          const shouldBeCharged = (index + month + year) % 5 !== 0;
          const doctorName = seed.doctors[sequence % seed.doctors.length] ?? "N/A";
          const firstName =
            seed.patientsFirstNames[sequence % seed.patientsFirstNames.length] ??
            "Patient";
          const lastName =
            seed.patientsLastNames[(sequence + month) % seed.patientsLastNames.length] ??
            "Name";

          records.push({
            id: `archive-${sequence}`,
            orderId: `DL-${String(year).slice(2)}${String(month).padStart(2, "0")}${String(sequence).padStart(4, "0")}`,
            scanCenter:
              seed.scanCenters[(sequence + index) % seed.scanCenters.length] ??
              "Scan Center",
            doctorName,
            patientName: `${firstName} ${lastName}`,
            serviceName: service.label,
            maxillary,
            mandibular,
            amount,
            vouchers: (sequence + month) % 3,
            receivedAt: receivedDate.toISOString(),
            sentAt: sentDate.toISOString(),
            operator:
              seed.operators[(sequence + year) % seed.operators.length] ?? "operator",
            archiveDate: sentDate.toISOString().slice(0, 10),
            chargedAt: shouldBeCharged ? chargedDate.toISOString() : null,
          });

          sequence += 1;
        }
      }
    }

    return records.sort(
      (left, right) =>
        new Date(right.receivedAt).getTime() - new Date(left.receivedAt).getTime(),
    );
  }

  private generateMonthlyServiceMetrics(
    seed: ReportingSeedData,
  ): MonthlyServiceMetric[] {
    const metrics: MonthlyServiceMetric[] = [];
    const yearSpan = seed.endYear - seed.startYear + 1;

    for (let year = seed.startYear; year <= seed.endYear; year += 1) {
      const yearOffset = year - seed.startYear;
      for (let month = 1; month <= 12; month += 1) {
        for (
          let serviceIndex = 0;
          serviceIndex < seed.services.length;
          serviceIndex += 1
        ) {
          const service = seed.services[serviceIndex];
          const baseline =
            18 + ((month * 5 + serviceIndex * 7 + yearOffset * 11) % 40);
          const quarterBoost = Math.ceil(month / 3) * 2;
          const growthBoost = Math.floor((yearOffset / yearSpan) * 6);
          const ordersCount = baseline + quarterBoost + growthBoost;
          const averagePrice =
            service.basePrice + ((month + serviceIndex + yearOffset) % 6);
          const totalRevenue = ordersCount * averagePrice;

          metrics.push({
            year,
            month,
            serviceKey: service.key,
            serviceName: service.label,
            ordersCount,
            totalRevenue,
          });
        }
      }
    }

    return metrics;
  }

  private generateTeamPerformanceRows(
    seed: ReportingSeedData,
  ): TeamPerformanceRecord[] {
    return seed.employeeNames.map((name, index) => {
      const completedOrders = 70 + ((index * 13) % 210);
      const revenueCollected = completedOrders * (38 + ((index + 3) % 11) * 4);
      const avgTurnaroundDays = Number((1.8 + ((index + 2) % 8) * 0.22).toFixed(1));
      const onTimeRate = 80 + ((index * 3) % 19);
      return {
        userId: 120 + index,
        type: seed.employeeTypes[index % seed.employeeTypes.length] ?? "Planner",
        fullName: name,
        completedOrders,
        revenueCollected,
        avgTurnaroundDays,
        onTimeRate,
        status: index % 8 === 0 ? "On Leave" : "Active",
      };
    });
  }

  private getMonthsForQuarter(quarter: number): number[] {
    const start = (quarter - 1) * 3 + 1;
    return [start, start + 1, start + 2];
  }
}
