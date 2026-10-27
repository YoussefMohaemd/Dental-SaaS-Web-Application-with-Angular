import { Injectable, signal, computed, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { EMPTY, catchError, expand, map, reduce, throwError } from "rxjs";
import { ChangeRequest } from "../interfaces";
import { ApiEndpoint } from "@core/enum/api.endpoint";
import { ChangeRequestApi } from "@core/base/change-request.api";
import { ChangeRequestAdapter } from "@core/adapters/change-request.adapter";
import { AuthService } from "@core/services/auth.service";

@Injectable({ providedIn: "root" })
export class ChangeRequestDataService extends ChangeRequestApi {
  private readonly http = inject(HttpClient);
  private readonly changeRequestAdapter = inject(ChangeRequestAdapter);
  private readonly authService = inject(AuthService);
  private readonly API_URL = ApiEndpoint.CHANGE_REQUESTS;

  private readonly _changeRequests = signal<ChangeRequest[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private _loaded = false;
  private _loadedSessionKey: string | null = null;

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
  readonly openChangeRequests = computed(
    () =>
      this._changeRequests().filter(
        (request) =>
          request.status === "Pending" || request.status === "In Review",
      ).length,
  );

  constructor() {
    super();
  }

  private static readonly PAGE_SIZE = 100;

  loadChangeRequests(forceRefresh = false): void {
    const sessionKey = this.currentSessionKey();
    const hasSessionChanged = this._loadedSessionKey !== null && this._loadedSessionKey !== sessionKey;
    if (hasSessionChanged) {
      this._loaded = false;
      this._changeRequests.set([]);
    }

    if (this._loading()) {
      return;
    }

    if (this._loaded && !forceRefresh && this._loadedSessionKey === sessionKey) {
      return;
    }

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
          this._loaded = true;
          this._loadedSessionKey = sessionKey;
          this._loading.set(false);
        },
        error: () => {
          this._error.set("Failed to load change requests");
          this._changeRequests.set([]);
          this._loaded = false;
          this._loadedSessionKey = null;
          this._loading.set(false);
        },
      });
  }

  getAllChangeRequests() {
    return this.loadChangeRequestsPage(1).pipe(
      expand((pageResult) =>
        pageResult.page < pageResult.totalPages
          ? this.loadChangeRequestsPage(pageResult.page + 1)
          : EMPTY,
      ),
      reduce(
        (all, pageResult) => all.concat(pageResult.items),
        [] as ChangeRequest[],
      ),
    );
  }

  getChangeRequestById(id: string): ChangeRequest | undefined {
    return this._changeRequests().find((c) => c.id === id);
  }

  getChangeRequestsByOrder(orderId: string): ChangeRequest[] {
    return this._changeRequests().filter((c) => c.orderId === orderId);
  }

  updateStatus(requestId: string, status: ChangeRequest["status"]): void {
    this._error.set(null);
    this.http
      .patch<{ data: ChangeRequest }>(
        ApiEndpoint.changeRequestStatus(requestId),
        { status },
      )
      .pipe(map((response) => response.data))
      .subscribe({
        next: (updated) => {
          this._changeRequests.update((current) =>
            current.map((request) =>
              request.id === updated.id ? updated : request,
            ),
          );
        },
        error: (apiError) => {
          console.error("Error updating change request status:", apiError);
          this._error.set("Change request status could not be saved.");
        },
      });
  }

  private loadChangeRequestsPage(page: number) {
    return this.http
      .get<{
        data: ChangeRequest[];
        meta?: {
          pagination?: {
            page?: number;
            totalPages?: number;
          };
        };
      }>(this.API_URL, {
        params: {
          page,
          pageSize: ChangeRequestDataService.PAGE_SIZE,
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
          items: this.changeRequestAdapter.ChangeRequestAdapter(
            response.data ?? [],
          ),
        })),
      );
  }

  private currentSessionKey(): string {
    const user = this.authService.user();
    if (!user) {
      return "anonymous";
    }

    return `${user.tenantId}:${user.userId}`;
  }
}
