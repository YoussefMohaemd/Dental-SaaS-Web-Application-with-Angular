import { Injectable, signal, computed, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, of, catchError } from "rxjs";
import { Doctor } from "../models";

@Injectable({ providedIn: "root" })
export class DoctorDataService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = "/data/doctors.json";

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
    this.loadDoctors();
  }

  loadDoctors(): void {
    this._loading.set(true);
    this._error.set(null);

    this.http
      .get<Doctor[]>(this.API_URL)
      .pipe(
        catchError((err) => {
          this._error.set("Failed to load doctors");
          console.error("Error loading doctors:", err);
          return of([] as Doctor[]);
        }),
      )
      .subscribe({
        next: (doctors: Doctor[]) => {
          this._doctors.set(doctors);
          this._loading.set(false);
        },
        error: () => {
          this._loading.set(false);
        },
      });
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
