import { Injectable, signal, computed, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { catchError, map, throwError } from "rxjs";
import { Clinic } from "../interfaces";
import { ApiEndpoint } from "@core/enum/api.endpoint";
import { ClinicApi } from "@core/base/clinic.api";
import { ClinicAdapter } from "@core/adapters/clinic.adapter";

@Injectable({ providedIn: "root" })
export class ClinicDataService extends ClinicApi {
  private readonly http = inject(HttpClient);
  private readonly clinicAdapter = inject(ClinicAdapter);
  private readonly API_URL = ApiEndpoint.CLINICS;

  private readonly _clinics = signal<Clinic[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly clinics = this._clinics.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly totalClinics = computed(() => this._clinics().length);
  readonly activeClinics = computed(
    () => this._clinics().filter((c) => c.status === "Active").length,
  );

  constructor() {
    super();
  }

  loadClinics(): void {
    this._loading.set(true);
    this._error.set(null);

    this.getAllClinics()
      .pipe(
        catchError((apiError) => {
          console.error("Error loading clinics:", apiError);
          return throwError(() => apiError);
        }),
      )
      .subscribe({
        next: (clinics: Clinic[]) => {
          this._clinics.set(clinics);
          this._loading.set(false);
        },
        error: () => {
          this._error.set("Failed to load clinics");
          this._clinics.set([]);
          this._loading.set(false);
        },
      });
  }

  getAllClinics() {
    return this.http
      .get<{ data: Clinic[] }>(this.API_URL)
      .pipe(
        map((response) => response.data ?? []),
        map((rows) => this.clinicAdapter.ClinicAdapter(rows)),
      );
  }

  getClinicById(id: string): Clinic | undefined {
    return this._clinics().find((c) => c.id === id);
  }

  addClinic(clinic: Clinic): void {
    this._clinics.update((current) => [clinic, ...current]);
  }
}
