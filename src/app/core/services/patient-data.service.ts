import { Injectable, signal, computed, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { catchError, map, throwError } from "rxjs";
import { Patient, PatientFilters } from "../interfaces";
import { filterTableRows, sortTableRows } from "@shared/utils/table-state";
import { ApiEndpoint } from "@core/enum/api.endpoint";
import { PatientApi } from "@core/base/patient.api";
import { PatientAdapter } from "@core/adapters/patient.adapter";

@Injectable({ providedIn: "root" })
export class PatientDataService extends PatientApi {
  private readonly http = inject(HttpClient);
  private readonly patientAdapter = inject(PatientAdapter);
  private readonly API_URL = ApiEndpoint.PATIENTS;

  private readonly _patients = signal<Patient[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly patients = this._patients.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly totalPatients = computed(() => this._patients().length);
  readonly activePatients = computed(
    () => this._patients().filter((p) => p.status === "Active").length,
  );

  constructor() {
    super();
  }

  loadPatients(): void {
    this._loading.set(true);
    this._error.set(null);

    this.getAllPatients()
      .pipe(
        catchError((apiError) => {
          console.error("Error loading patients:", apiError);
          return throwError(() => apiError);
        }),
      )
      .subscribe({
        next: (patients: Patient[]) => {
          this._patients.set(patients);
          this._loading.set(false);
        },
        error: () => {
          this._error.set("Failed to load patients");
          this._patients.set([]);
          this._loading.set(false);
        },
      });
  }

  getAllPatients() {
    return this.http
      .get<{ data: Patient[] }>(this.API_URL)
      .pipe(
        map((response) => response.data ?? []),
        map((rows) => this.patientAdapter.PatientAdapter(rows)),
      );
  }

  getPatientById(id: string): Patient | undefined {
    return this._patients().find((p) => p.id === id);
  }

  getPatientsByDoctor(doctorId: string): Patient[] {
    return this._patients().filter((p) => p.doctorId === doctorId);
  }

  getPatientsByClinic(clinicId: string): Patient[] {
    return this._patients().filter((p) => p.clinicId === clinicId);
  }

  addPatient(patient: Patient): void {
    this._patients.update((current) => [patient, ...current]);
  }

  applyFilters(filters: PatientFilters): Patient[] {
    let result = filterTableRows(this._patients(), filters.search ?? "", [
      (patient) => patient.name,
      (patient) => patient.email,
      (patient) => patient.clinicName,
    ]);

    if (filters.statusFilter) {
      result = result.filter((p) => p.status === filters.statusFilter);
    }

    if (filters.sortColumn) {
      result = sortTableRows(
        result,
        filters.sortColumn,
        filters.sortDirection ?? "asc",
      );
    }

    return result;
  }
}
