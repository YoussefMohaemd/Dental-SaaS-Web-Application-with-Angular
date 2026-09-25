import { Injectable, signal, computed, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, of, catchError } from "rxjs";
import { Case } from "../models";

@Injectable({ providedIn: "root" })
export class CaseDataService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = "/data/cases.json";

  private readonly _cases = signal<Case[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly cases = this._cases.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly totalCases = computed(() => this._cases().length);
  readonly openCases = computed(
    () => this._cases().filter((c) => c.status !== "Closed").length,
  );

  constructor() {
    this.loadCases();
  }

  loadCases(): void {
    this._loading.set(true);
    this._error.set(null);

    this.http
      .get<Case[]>(this.API_URL)
      .pipe(
        catchError((err) => {
          this._error.set("Failed to load cases");
          console.error("Error loading cases:", err);
          return of([] as Case[]);
        }),
      )
      .subscribe({
        next: (cases: Case[]) => {
          this._cases.set(cases);
          this._loading.set(false);
        },
        error: () => {
          this._loading.set(false);
        },
      });
  }

  getCaseById(id: string): Case | undefined {
    return this._cases().find((c) => c.id === id);
  }

  getCasesByPatient(patientId: string): Case[] {
    return this._cases().filter((c) => c.patientId === patientId);
  }

  getCasesByDoctor(doctorId: string): Case[] {
    return this._cases().filter((c) => c.doctorId === doctorId);
  }

  getCasesByClinic(clinicId: string): Case[] {
    return this._cases().filter((c) => c.clinicId === clinicId);
  }
}
