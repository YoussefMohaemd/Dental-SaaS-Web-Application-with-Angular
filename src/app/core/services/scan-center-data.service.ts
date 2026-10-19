import { Injectable, signal, computed, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { catchError, map, throwError } from "rxjs";
import { ScanCenter } from "../models";
import { ApiResponse } from "@core/interface/api-response.interface";
import { ApiEndpoint } from "@core/enum/api.endpoint";
import { ScanCenterApi } from "@core/base/scan-center.api";
import { ScanCenterAdapter } from "@core/adapters/scan-center.adapter";

@Injectable({ providedIn: "root" })
export class ScanCenterDataService extends ScanCenterApi {
  private readonly http = inject(HttpClient);
  private readonly scanCenterAdapter = inject(ScanCenterAdapter);
  private readonly API_URL = ApiEndpoint.SCAN_CENTERS;

  private readonly _centers = signal<ScanCenter[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly centers = this._centers.asReadonly();
  readonly scanCenters = this._centers.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly totalCenters = computed(() => this._centers().length);
  readonly operationalCenters = computed(
    () => this._centers().filter((c) => c.status === "Operational").length,
  );

  constructor() {
    super();
    this.loadCenters();
  }

  loadCenters(): void {
    this._loading.set(true);
    this._error.set(null);

    this.getAllScanCenters()
      .pipe(
        catchError((apiError) => {
          console.error("Error loading scan centers:", apiError);
          return throwError(() => apiError);
        }),
      )
      .subscribe({
        next: (centers: ScanCenter[]) => {
          this._centers.set(centers);
          this._loading.set(false);
        },
        error: () => {
          this._error.set("Failed to load scan centers");
          this._centers.set([]);
          this._loading.set(false);
        },
      });
  }

  getAllScanCenters() {
    return this.http
      .get<ApiResponse<ScanCenter[]>>(this.API_URL)
      .pipe(
        map((response) => response.data ?? []),
        map((rows) => this.scanCenterAdapter.ScanCenterAdapter(rows)),
      );
  }

  getCenterById(id: string): ScanCenter | undefined {
    return this._centers().find((c) => c.id === id);
  }
}
