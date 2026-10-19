import { Injectable, inject, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { catchError, map, throwError } from "rxjs";
import { ReportsData } from "../models/report.model";
import { ApiResponse } from "@core/interface/api-response.interface";
import { ApiEndpoint } from "@core/enum/api.endpoint";
import { ReportsApi } from "@core/base/reports.api";
import { ReportsAdapter } from "@core/adapters/reports.adapter";

const EMPTY_REPORTS: ReportsData = {
  monthlyRevenue: [],
  restorationBreakdown: [],
  turnaround: [],
  workflowShare: [],
};

@Injectable({ providedIn: "root" })
export class ReportsDataService extends ReportsApi {
  private readonly http = inject(HttpClient);
  private readonly reportsAdapter = inject(ReportsAdapter);
  private readonly API_URL = ApiEndpoint.REPORTS_OVERVIEW;

  private readonly _reports = signal<ReportsData>(EMPTY_REPORTS);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly reports = this._reports.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  constructor() {
    super();
    this.loadReports();
  }

  loadReports(): void {
    this._loading.set(true);
    this._error.set(null);

    this.getReportsOverview()
      .pipe(
        catchError((apiError) => {
          this._error.set("Failed to load reports data");
          console.error("Error loading reports data:", apiError);
          return throwError(() => apiError);
        }),
      )
      .subscribe({
        next: (reports: ReportsData) => {
          this._reports.set(reports);
          this._loading.set(false);
        },
        error: () => {
          this._reports.set(EMPTY_REPORTS);
          this._loading.set(false);
        },
      });
  }

  getReportsOverview() {
    return this.http
      .get<ApiResponse<ReportsData>>(this.API_URL)
      .pipe(
        map((response) => response.data ?? EMPTY_REPORTS),
        map((response) => this.reportsAdapter.ReportsAdapter(response)),
      );
  }
}
