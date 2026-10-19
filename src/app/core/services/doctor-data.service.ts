import { Injectable, signal, computed, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { catchError, map, throwError } from "rxjs";
import { Doctor } from "../models";
import { ApiResponse } from "@core/interfaces/api-response.interface";
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

  readonly doctors = this._doctors.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly totalDoctors = computed(() => this._doctors().length);
  readonly activeDoctors = computed(
    () => this._doctors().filter((d) => d.status === "Active").length,
  );

  constructor() {
    super();
    this.loadDoctors();
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
    return this.http
      .get<ApiResponse<Doctor[]>>(this.API_URL)
      .pipe(
        map((response) => response.data ?? []),
        map((rows) => this.doctorAdapter.DoctorAdapter(rows)),
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
}
