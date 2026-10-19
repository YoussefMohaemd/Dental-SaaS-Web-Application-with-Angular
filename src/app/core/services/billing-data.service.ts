import { Injectable, signal, computed, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { catchError, map, throwError } from "rxjs";
import { BillingRecord } from "../interfaces";
import { ApiEndpoint } from "@core/enum/api.endpoint";
import { BillingApi } from "@core/base/billing.api";
import { BillingAdapter } from "@core/adapters/billing.adapter";

@Injectable({ providedIn: "root" })
export class BillingDataService extends BillingApi {
  private readonly http = inject(HttpClient);
  private readonly billingAdapter = inject(BillingAdapter);
  private readonly API_URL = ApiEndpoint.BILLING;

  private readonly _records = signal<BillingRecord[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly records = this._records.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly totalRecords = computed(() => this._records().length);
  readonly pendingCount = computed(
    () => this._records().filter((r) => r.status === "Pending").length,
  );
  readonly overdueCount = computed(
    () => this._records().filter((r) => r.status === "Overdue").length,
  );
  readonly paidCount = computed(
    () => this._records().filter((r) => r.status === "Paid").length,
  );

  constructor() {
    super();
  }

  loadRecords(): void {
    this._loading.set(true);
    this._error.set(null);

    this.getAllBillingRecords()
      .pipe(
        catchError((apiError) => {
          console.error("Error loading billing records:", apiError);
          return throwError(() => apiError);
        }),
      )
      .subscribe({
        next: (records: BillingRecord[]) => {
          this._records.set(records);
          this._loading.set(false);
        },
        error: () => {
          this._error.set("Failed to load billing records");
          this._records.set([]);
          this._loading.set(false);
        },
      });
  }

  getAllBillingRecords() {
    return this.http
      .get<{ data: BillingRecord[] }>(this.API_URL)
      .pipe(
        map((response) => response.data ?? []),
        map((records) => this.billingAdapter.BillingAdapter(records)),
      );
  }

  getRecordById(id: string): BillingRecord | undefined {
    return this._records().find((r) => r.id === id);
  }

  getRecordsByClinic(clinicName: string): BillingRecord[] {
    return this._records().filter((r) => r.clinicName === clinicName);
  }
}
