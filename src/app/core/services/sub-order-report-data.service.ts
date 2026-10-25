import { Injectable, inject, signal } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { catchError, throwError } from "rxjs";
import { ApiEndpoint } from "@core/enum/api.endpoint";
import { SubOrderReport } from "@core/interfaces";

@Injectable({ providedIn: "root" })
export class SubOrderReportDataService {
  private readonly http = inject(HttpClient);
  private readonly _report = signal<SubOrderReport>({
    summary: {
      total: 0,
      completed: 0,
      inProgress: 0,
      pending: 0,
      blocked: 0,
      overdue: 0,
      completionRate: 0,
    },
    byService: [],
    byPriority: [],
  });
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly report = this._report.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  load(options: { from?: string; to?: string; service?: string } = {}): void {
    this._loading.set(true);
    this._error.set(null);
    let params = new HttpParams();
    if (options.from) params = params.set("from", options.from);
    if (options.to) params = params.set("to", options.to);
    if (options.service) params = params.set("service", options.service);

    this.http
      .get<{ data: SubOrderReport }>(ApiEndpoint.REPORTS_SUB_ORDERS, {
        params,
      })
      .pipe(
        catchError((error) => {
          console.error("Error loading sub-order report:", error);
          this._error.set("Failed to load sub-order report.");
          this._loading.set(false);
          return throwError(() => error);
        }),
      )
      .subscribe({
        next: (response) => {
          this._report.set(response.data);
          this._loading.set(false);
        },
        error: () => {
          this._loading.set(false);
        },
      });
  }
}
