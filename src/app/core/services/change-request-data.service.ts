import { Injectable, signal, computed, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { catchError, map, throwError } from "rxjs";
import { ChangeRequest } from "../models";
import { ApiResponse } from "@core/interfaces/api-response.interface";
import { ApiEndpoint } from "@core/enum/api.endpoint";
import { ChangeRequestApi } from "@core/base/change-request.api";
import { ChangeRequestAdapter } from "@core/adapters/change-request.adapter";

@Injectable({ providedIn: "root" })
export class ChangeRequestDataService extends ChangeRequestApi {
  private readonly http = inject(HttpClient);
  private readonly changeRequestAdapter = inject(ChangeRequestAdapter);
  private readonly API_URL = ApiEndpoint.CHANGE_REQUESTS;

  private readonly _changeRequests = signal<ChangeRequest[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly changeRequests = this._changeRequests.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly totalChangeRequests = computed(() => this._changeRequests().length);
  readonly pendingChangeRequests = computed(
    () => this._changeRequests().filter((c) => c.status === "Pending").length,
  );
  readonly inReviewChangeRequests = computed(
    () => this._changeRequests().filter((c) => c.status === "In Review").length,
  );

  constructor() {
    super();
    this.loadChangeRequests();
  }

  loadChangeRequests(): void {
    this._loading.set(true);
    this._error.set(null);

    this.getAllChangeRequests()
      .pipe(
        catchError((apiError) => {
          console.error("Error loading change requests:", apiError);
          return throwError(() => apiError);
        }),
      )
      .subscribe({
        next: (changeRequests: ChangeRequest[]) => {
          this._changeRequests.set(changeRequests);
          this._loading.set(false);
        },
        error: () => {
          this._error.set("Failed to load change requests");
          this._changeRequests.set([]);
          this._loading.set(false);
        },
      });
  }

  getAllChangeRequests() {
    return this.http
      .get<ApiResponse<ChangeRequest[]>>(this.API_URL)
      .pipe(
        map((response) => response.data ?? []),
        map((rows) => this.changeRequestAdapter.ChangeRequestAdapter(rows)),
      );
  }

  getChangeRequestById(id: string): ChangeRequest | undefined {
    return this._changeRequests().find((c) => c.id === id);
  }

  getChangeRequestsByOrder(orderId: string): ChangeRequest[] {
    return this._changeRequests().filter((c) => c.orderId === orderId);
  }

  updateStatus(requestId: string, status: ChangeRequest["status"]): void {
    this._changeRequests.update((current) =>
      current.map((r) => (r.id === requestId ? { ...r, status } : r)),
    );
  }
}
