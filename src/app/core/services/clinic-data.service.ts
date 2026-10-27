import { Injectable, signal, computed, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { EMPTY, catchError, expand, map, Observable, reduce, tap, throwError } from "rxjs";
import { ApiClinicItem, Clinic } from "../interfaces";
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
  private static readonly PAGE_SIZE = 100;

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
    return this.loadClinicsPage(1).pipe(
      expand((pageResult) =>
        pageResult.page < pageResult.totalPages
          ? this.loadClinicsPage(pageResult.page + 1)
          : EMPTY,
      ),
      reduce(
        (all, pageResult) => all.concat(pageResult.items),
        [] as Clinic[],
      ),
    );
  }

  createClinic$(
    payload: Omit<Clinic, "id" | "doctorsCount" | "patientsCount" | "ordersCount">,
  ): Observable<Clinic> {
    return this.http
      .post<{ data: ApiClinicItem }>(this.API_URL, payload)
      .pipe(
        map((response) => this.clinicAdapter.ClinicAdapter([response.data])[0]),
        tap((created) => this._clinics.update((current) => [created, ...current])),
      );
  }

  getClinicById(id: string): Clinic | undefined {
    return this._clinics().find((c) => c.id === id);
  }

  addClinic(clinic: Clinic): void {
    this._clinics.update((current) => [clinic, ...current]);
  }

  private loadClinicsPage(page: number) {
    return this.http
      .get<{
        data: ApiClinicItem[];
        meta?: {
          pagination?: {
            page?: number;
            totalPages?: number;
          };
        };
      }>(this.API_URL, {
        params: {
          page,
          pageSize: ClinicDataService.PAGE_SIZE,
        },
      })
      .pipe(
        map((response) => ({
          page:
            response.meta?.pagination?.page && response.meta.pagination.page > 0
              ? response.meta.pagination.page
              : page,
          totalPages:
            response.meta?.pagination?.totalPages &&
            response.meta.pagination.totalPages > 0
              ? response.meta.pagination.totalPages
              : 1,
          items: this.clinicAdapter.ClinicAdapter(response.data ?? []),
        })),
      );
  }
}
