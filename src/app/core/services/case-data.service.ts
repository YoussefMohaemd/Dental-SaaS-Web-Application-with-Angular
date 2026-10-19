import { Injectable, signal, computed, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { catchError, map, throwError } from "rxjs";
import { Case } from "../interfaces";
import { ApiEndpoint } from "@core/enum/api.endpoint";
import { CaseApi } from "@core/base/case.api";
import { CaseAdapter } from "@core/adapters/case.adapter";

@Injectable({ providedIn: "root" })
export class CaseDataService extends CaseApi {
  private readonly http = inject(HttpClient);
  private readonly caseAdapter = inject(CaseAdapter);
  private readonly API_URL = ApiEndpoint.CASES;

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
    super();
  }

  loadCases(): void {
    this._loading.set(true);
    this._error.set(null);

    this.getAllCases()
      .pipe(
        catchError((apiError) => {
          console.error("Error loading cases:", apiError);
          return throwError(() => apiError);
        }),
      )
      .subscribe({
        next: (cases: Case[]) => {
          this._cases.set(cases);
          this._loading.set(false);
        },
        error: () => {
          this._error.set("Failed to load cases");
          this._cases.set([]);
          this._loading.set(false);
        },
      });
  }

  getAllCases() {
    return this.http
      .get<{ data: Case[] }>(this.API_URL)
      .pipe(
        map((response) => response.data ?? []),
        map((rows) => this.caseAdapter.CaseAdapter(rows)),
      );
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
