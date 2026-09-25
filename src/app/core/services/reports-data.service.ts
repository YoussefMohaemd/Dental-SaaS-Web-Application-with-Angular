import { Injectable, inject, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { of, catchError } from "rxjs";
import { ReportsData } from "../models/report.model";

const FALLBACK_REPORTS: ReportsData = {
  monthlyRevenue: [
    { month: "Jul", revenue: 48200 },
    { month: "Aug", revenue: 52800 },
    { month: "Sep", revenue: 44600 },
    { month: "Oct", revenue: 61300 },
    { month: "Nov", revenue: 58900 },
    { month: "Dec", revenue: 39200 },
  ],
  restorationBreakdown: [
    { name: "Crown", value: 38 },
    { name: "Bridge", value: 22 },
    { name: "Veneer", value: 15 },
    { name: "Implant", value: 12 },
    { name: "Full Arch", value: 8 },
    { name: "Other", value: 5 },
  ],
  turnaround: [
    { day: "Mon", days: 2.1 },
    { day: "Tue", days: 2.4 },
    { day: "Wed", days: 1.9 },
    { day: "Thu", days: 2.8 },
    { day: "Fri", days: 2.2 },
    { day: "Sat", days: 1.5 },
    { day: "Sun", days: 1.2 },
  ],
  workflowShare: [
    { stage: "New", count: 8, percent: 25 },
    { stage: "Review", count: 5, percent: 15.6 },
    { stage: "Design", count: 7, percent: 21.9 },
    { stage: "Production", count: 12, percent: 37.5 },
    { stage: "Quality Check", count: 4, percent: 12.5 },
    { stage: "Ready", count: 6, percent: 18.8 },
  ],
};

@Injectable({ providedIn: "root" })
export class ReportsDataService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = "/data/reports.json";

  private readonly _reports = signal<ReportsData>(FALLBACK_REPORTS);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly reports = this._reports.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  constructor() {
    this.loadReports();
  }

  loadReports(): void {
    this._loading.set(true);
    this._error.set(null);

    this.http
      .get<ReportsData>(this.API_URL)
      .pipe(
        catchError((err) => {
          this._error.set("Failed to load reports data");
          console.error("Error loading reports data:", err);
          return of(FALLBACK_REPORTS);
        }),
      )
      .subscribe({
        next: (reports: ReportsData) => {
          this._reports.set(reports);
          this._loading.set(false);
        },
        error: () => {
          this._loading.set(false);
        },
      });
  }
}
