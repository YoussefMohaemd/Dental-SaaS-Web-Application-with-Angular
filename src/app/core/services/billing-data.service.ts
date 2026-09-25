import { Injectable, signal, computed, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, of, catchError } from "rxjs";
import { BillingRecord } from "../models";

@Injectable({ providedIn: "root" })
export class BillingDataService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = "/data/billing.json";

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
    this.loadRecords();
  }

  loadRecords(): void {
    this._loading.set(true);
    this._error.set(null);

    this.http
      .get<BillingRecord[]>(this.API_URL)
      .pipe(
        catchError((err) => {
          this._error.set("Failed to load billing records");
          console.error("Error loading billing records:", err);
          return of([] as BillingRecord[]);
        }),
      )
      .subscribe({
        next: (records: BillingRecord[]) => {
          this._records.set(records);
          this._loading.set(false);
        },
        error: () => {
          this._loading.set(false);
        },
      });
  }

  getRecordById(id: string): BillingRecord | undefined {
    return this._records().find((r) => r.id === id);
  }

  getRecordsByClinic(clinicName: string): BillingRecord[] {
    return this._records().filter((r) => r.clinicName === clinicName);
  }
}
