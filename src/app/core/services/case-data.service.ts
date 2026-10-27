import { Injectable, signal, computed, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { EMPTY, catchError, expand, map, Observable, reduce, tap, throwError } from "rxjs";
import { ApiCaseItem, Case } from "../interfaces";
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
  private static readonly PAGE_SIZE = 100;

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
    return this.loadCasesPage(1).pipe(
      expand((pageResult) =>
        pageResult.page < pageResult.totalPages
          ? this.loadCasesPage(pageResult.page + 1)
          : EMPTY,
      ),
      reduce(
        (all, pageResult) => all.concat(pageResult.items),
        [] as Case[],
      ),
    );
  }

  getCaseById(id: string): Case | undefined {
    return this._cases().find((c) => c.id === id);
  }

  createCase$(
    payload: Omit<
      Case,
      | "id"
      | "patientName"
      | "doctorName"
      | "clinicName"
      | "ordersCount"
      | "filesCount"
      | "createdAt"
      | "updatedAt"
    >,
  ): Observable<Case> {
    return this.http.post<{ data: ApiCaseItem }>(this.API_URL, payload).pipe(
      map((response) => this.caseAdapter.CaseAdapter([response.data])[0]),
      tap((created) => this._cases.update((current) => [created, ...current])),
    );
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

  private loadCasesPage(page: number) {
    return this.http
      .get<{
        data: ApiCaseItem[];
        meta?: {
          pagination?: {
            page?: number;
            totalPages?: number;
          };
        };
      }>(this.API_URL, {
        params: {
          page,
          pageSize: CaseDataService.PAGE_SIZE,
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
          items: this.caseAdapter.CaseAdapter(response.data ?? []),
        })),
      );
  }
}
