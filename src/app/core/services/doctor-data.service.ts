import { Injectable, signal, computed, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { EMPTY, catchError, expand, map, Observable, reduce, tap, throwError } from "rxjs";
import { ApiDoctorItem, Doctor } from "../interfaces";
import { ApiEndpoint } from "@core/enum/api.endpoint";
import { DoctorApi } from "@core/base/doctor.api";
import { DoctorAdapter } from "@core/adapters/doctor.adapter";

@Injectable({ providedIn: "root" })
export class DoctorDataService extends DoctorApi {
  private readonly http = inject(HttpClient);
  private readonly doctorAdapter = inject(DoctorAdapter);
  private readonly API_URL = ApiEndpoint.DOCTORS;

  private readonly _doctors = signal<Doctor[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private static readonly PAGE_SIZE = 100;

  readonly doctors = this._doctors.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly totalDoctors = computed(() => this._doctors().length);
  readonly activeDoctors = computed(
    () => this._doctors().filter((d) => d.status === "Active").length,
  );

  constructor() {
    super();
  }

  loadDoctors(): void {
    this._loading.set(true);
    this._error.set(null);

    this.getAllDoctors()
      .pipe(
        catchError((apiError) => {
          console.error("Error loading doctors:", apiError);
          return throwError(() => apiError);
        }),
      )
      .subscribe({
        next: (doctors: Doctor[]) => {
          this._doctors.set(doctors);
          this._loading.set(false);
        },
        error: () => {
          this._error.set("Failed to load doctors");
          this._doctors.set([]);
          this._loading.set(false);
        },
      });
  }

  getAllDoctors() {
    return this.loadDoctorsPage(1).pipe(
      expand((pageResult) =>
        pageResult.page < pageResult.totalPages
          ? this.loadDoctorsPage(pageResult.page + 1)
          : EMPTY,
      ),
      reduce(
        (all, pageResult) => all.concat(pageResult.items),
        [] as Doctor[],
      ),
    );
  }

  createDoctor$(
    payload: Omit<Doctor, "id" | "clinicName" | "ordersCount" | "avatar"> & {
      avatar?: string;
      gender?: "M" | "F";
    },
  ): Observable<Doctor> {
    return this.http.post<{ data: ApiDoctorItem }>(this.API_URL, payload).pipe(
      map((response) => this.doctorAdapter.DoctorAdapter([response.data])[0]),
      tap((created) =>
        this._doctors.update((current) => [created, ...current]),
      ),
    );
  }

  getDoctorById(id: string): Doctor | undefined {
    return this._doctors().find((d) => d.id === id);
  }

  getDoctorsByClinic(clinicId: string): Doctor[] {
    return this._doctors().filter((d) => d.clinicId === clinicId);
  }

  addDoctor(doctor: Doctor): void {
    this._doctors.update((current) => [doctor, ...current]);
  }

  private loadDoctorsPage(page: number) {
    return this.http
      .get<{
        data: ApiDoctorItem[];
        meta?: {
          pagination?: {
            page?: number;
            totalPages?: number;
          };
        };
      }>(this.API_URL, {
        params: {
          page,
          pageSize: DoctorDataService.PAGE_SIZE,
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
          items: this.doctorAdapter.DoctorAdapter(response.data ?? []),
        })),
      );
  }
}
