import { Injectable, signal, computed, inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { EMPTY, catchError, expand, map, Observable, reduce, tap, throwError } from "rxjs";
import { ApiOrderItem, Order, OrdersViewState } from "../interfaces";
import { ApiEndpoint } from "@core/enum/api.endpoint";
import { OrdersApi } from "@core/base/orders.api";
import { OrderAdapter } from "@core/adapters/order.adapter";

type OrderMutation = Omit<Partial<Order>, "archiveDate"> & {
  archiveDate?: string | null;
};

const ORDER_MUTATION_FIELDS = [
  "orderNumber",
  "patientId",
  "doctorId",
  "clinicId",
  "scanCenterId",
  "status",
  "priority",
  "restoration",
  "arch",
  "format",
  "shade",
  "units",
  "amount",
  "billed",
  "billedAmount",
  "billTo",
  "vouchers",
  "isLocked",
  "hasNotes",
  "notes",
  "archiveDate",
  "receivedAt",
  "sentAt",
  "chargedAt",
  "dueDate",
  "csTask",
  "technicianId",
  "creationData",
] as const satisfies readonly (keyof OrderMutation)[];

export interface OrderPageQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?:
    | "orderNumber"
    | "status"
    | "priority"
    | "restoration"
    | "receivedAt"
    | "dueDate"
    | "amount"
    | "createdAt"
    | "updatedAt";
  sortDirection?: "asc" | "desc";
  status?: string[];
  duration?: "today" | "week" | "month" | "2-months" | "3-months" | "6-months";
  service?: string[];
}

interface OrderPaginationState {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

interface OrdersPageResponse {
  data: ApiOrderItem[];
  meta?: {
    pagination?: {
      page?: number;
      pageSize?: number;
      totalItems?: number;
      totalPages?: number;
    };
  };
}

interface OrdersPageResult {
  items: Order[];
  pagination: OrderPaginationState;
}

interface AggregatedOrdersResult {
  items: Order[];
  totalItems: number;
  totalPages: number;
  pageSize: number;
}

@Injectable({ providedIn: "root" })
export class OrderDataService extends OrdersApi {
  private readonly http = inject(HttpClient);
  private readonly orderAdapter = inject(OrderAdapter);
  private readonly API_URL = ApiEndpoint.ORDERS;

  private readonly _orders = signal<Order[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private snapshotOrders: Order[] = [];
  private static readonly PAGE_SIZE = 20;
  private static readonly BULK_PAGE_SIZE = 100;
  private readonly _pagination = signal<OrderPaginationState>({
    page: 1,
    pageSize: OrderDataService.PAGE_SIZE,
    totalItems: 0,
    totalPages: 1,
  });
  private _lastQuery: OrderPageQuery = {
    page: 1,
    pageSize: OrderDataService.PAGE_SIZE,
    sortBy: "receivedAt",
    sortDirection: "desc",
  };

  readonly orders = this._orders.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly pagination = this._pagination.asReadonly();

  readonly totalOrders = computed(() => this._pagination().totalItems);
  readonly urgentOrdersCount = computed(
    () => this._orders().filter((o) => o.priority === "Urgent").length,
  );
  readonly completedTodayCount = computed(
    () => this._orders().filter((o) => o.status === "Completed").length,
  );

  constructor() {
    super();
  }

  loadOrders(query: OrderPageQuery = this._lastQuery): void {
    this._lastQuery = {
      ...this._lastQuery,
      ...query,
    };

    this._loading.set(true);
    this._error.set(null);

    this.loadOrdersPage(this._lastQuery)
      .pipe(
        catchError((apiError) => {
          console.error("Error loading orders:", apiError);
          return throwError(() => apiError);
        }),
      )
      .subscribe({
        next: (pageResult) => {
          this.applyLoadSuccess(pageResult.items, pageResult.pagination);
        },
        error: () => {
          this.applyLoadError({ ...this._pagination(), totalItems: 0, totalPages: 1 });
        },
      });
  }

  loadAllOrders(query: Omit<OrderPageQuery, "page" | "pageSize"> = {}): void {
    const normalizedQuery: Omit<OrderPageQuery, "page" | "pageSize"> = {
      sortBy: query.sortBy ?? "receivedAt",
      sortDirection: query.sortDirection ?? "desc",
      ...(query.search !== undefined ? { search: query.search } : {}),
      ...(query.duration !== undefined ? { duration: query.duration } : {}),
      ...(query.status !== undefined ? { status: query.status } : {}),
      ...(query.service !== undefined ? { service: query.service } : {}),
    };

    this._loading.set(true);
    this._error.set(null);

    this.loadAllOrdersPages(normalizedQuery)
      .pipe(
        catchError((apiError) => {
          console.error("Error loading all orders:", apiError);
          return throwError(() => apiError);
        }),
      )
      .subscribe({
        next: (result) => {
          this.applyLoadSuccess(result.items, {
            page: 1,
            pageSize: result.pageSize,
            totalItems: result.totalItems,
            totalPages: result.totalPages,
          });
        },
        error: () => {
          this.applyLoadError({
            page: 1,
            pageSize: OrderDataService.BULK_PAGE_SIZE,
            totalItems: 0,
            totalPages: 1,
          });
        },
      });
  }

  getOrderById$(id: string): Observable<Order> {
    return this.http
      .get<{ data: ApiOrderItem }>(`${this.API_URL}/${id}`)
      .pipe(
        map((response) => this.orderAdapter.OrdersAdapter([response.data])[0]),
        tap((order) => {
          this._orders.update((orders) => this.upsertOrder(orders, order));
          this.snapshotOrders = this.upsertOrder(this.snapshotOrders, order);
        }),
      );
  }

  createOrder$(
    payload: Omit<Order, "id" | "orderNumber" | "receivedAt" | "updatedAt" | "createdAt">,
  ): Observable<Order> {
    const body = {
      ...this.toApiOrderPayload(payload),
      orderNumber: `DL-${Date.now().toString().slice(-8)}`,
      receivedAt: new Date().toISOString(),
    };

    return this.http
      .post<{ data: ApiOrderItem }>(
        this.API_URL,
        body,
      )
      .pipe(
        map((response) => this.orderAdapter.OrdersAdapter([response.data])[0]),
        tap((created) => {
          this._orders.update((orders) => [created, ...orders]);
          this.snapshotOrders = [created, ...this.snapshotOrders];
        }),
      );
  }

  updateOrder$(
    id: string,
    updates: OrderMutation,
  ): Observable<Order> {
    return this.http
      .patch<{ data: ApiOrderItem }>(
        `${this.API_URL}/${id}`,
        this.toApiOrderPayload(updates),
      )
      .pipe(
        map((response) => this.orderAdapter.OrdersAdapter([response.data])[0]),
        tap((updated) => {
          this._orders.update((orders) => this.replaceOrder(orders, id, updated));
          this.snapshotOrders = this.replaceOrder(this.snapshotOrders, id, updated);
        }),
      );
  }

  deleteOrder$(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
      tap(() => {
        this._orders.update((orders) => this.removeOrder(orders, id));
        this.snapshotOrders = this.removeOrder(this.snapshotOrders, id);
      }),
      map(() => void 0),
    );
  }

  reload(): void {
    this.loadOrders(this._lastQuery);
  }

  // POC evidence control: keeps screenshots and service state in sync.
  previewState(state: OrdersViewState): void {
    if (state === "normal") {
      if (this.snapshotOrders.length > 0) {
        this._orders.set([...this.snapshotOrders]);
      }
      this.reload();
      return;
    }

    if (state === "loading") {
      this._error.set(null);
      this._loading.set(true);
      return;
    }

    if (state === "error") {
      this._loading.set(false);
      this._error.set("Failed to load orders");
      return;
    }

    this._loading.set(false);
    this._error.set(null);
    if (this._orders().length > 0) {
      this.snapshotOrders = [...this._orders()];
    }
    this._orders.set([]);
  }

  getOrderById(id: string): Order | undefined {
    return this._orders().find((o) => o.id === id);
  }

  getOrdersByPatient(patientId: string): Order[] {
    return this._orders().filter((o) => o.patientId === patientId);
  }

  getOrdersByDoctor(doctorId: string): Order[] {
    return this._orders().filter((o) => o.doctorId === doctorId);
  }

  getOrdersByClinic(clinicId: string): Order[] {
    return this._orders().filter((o) => o.clinicId === clinicId);
  }

  createOrder(
    order: Omit<Order, "id" | "orderNumber" | "receivedAt" | "updatedAt">,
  ): Order {
    const newOrder: Order = {
      ...order,
      id: `ord-${Date.now()}`,
      orderNumber: `DL-${String(24000 + this._orders().length + 1).padStart(6, "0")}`,
      receivedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this._orders.update((orders) => [newOrder, ...orders]);
    return newOrder;
  }

  updateOrder(id: string, updates: Partial<Order>): Order | null {
    let updated: Order | null = null;
    this._orders.update((orders) =>
      orders.map((o) => {
        if (o.id === id) {
          updated = { ...o, ...updates, updatedAt: new Date().toISOString() };
          return updated;
        }
        return o;
      }),
    );
    return updated;
  }

  deleteOrder(id: string): boolean {
    let deleted = false;
    this._orders.update((orders) => {
      const idx = orders.findIndex((o) => o.id === id);
      if (idx >= 0) {
        deleted = true;
        return orders.filter((o) => o.id !== id);
      }
      return orders;
    });
    return deleted;
  }

  private toApiOrderPayload(
    payload: OrderMutation,
  ): Record<string, unknown> {
    return Object.fromEntries(
      ORDER_MUTATION_FIELDS
        .filter((key) => payload[key] !== undefined && payload[key] !== "")
        .map((key) => [key, payload[key]]),
    );
  }

  private loadOrdersPage(query: OrderPageQuery): Observable<OrdersPageResult> {
    let params = new HttpParams()
      .set("page", String(query.page ?? 1))
      .set("pageSize", String(query.pageSize ?? OrderDataService.PAGE_SIZE))
      .set("sortBy", query.sortBy ?? "receivedAt")
      .set("sortDirection", query.sortDirection ?? "desc");

    if (query.search && query.search.trim()) {
      params = params.set("search", query.search.trim());
    }

    if (query.duration) {
      params = params.set("duration", query.duration);
    }

    if (query.status && query.status.length > 0) {
      params = params.set("status", query.status.join(","));
    }

    if (query.service && query.service.length > 0) {
      params = params.set("service", query.service.join(","));
    }

    return this.http
      .get<OrdersPageResponse>(this.API_URL, { params })
      .pipe(
        map((response) => ({
          items: this.orderAdapter.OrdersAdapter(response.data ?? []),
          pagination: {
            page:
              response.meta?.pagination?.page &&
              response.meta.pagination.page > 0
                ? response.meta.pagination.page
                : query.page ?? 1,
            pageSize:
              response.meta?.pagination?.pageSize &&
              response.meta.pagination.pageSize > 0
                ? response.meta.pagination.pageSize
                : query.pageSize ?? OrderDataService.PAGE_SIZE,
            totalItems:
              response.meta?.pagination?.totalItems &&
              response.meta.pagination.totalItems >= 0
                ? response.meta.pagination.totalItems
                : response.data?.length ?? 0,
            totalPages:
              response.meta?.pagination?.totalPages &&
              response.meta.pagination.totalPages > 0
                ? response.meta.pagination.totalPages
                : 1,
          },
        })),
      );
  }

  private loadAllOrdersPages(
    query: Omit<OrderPageQuery, "page" | "pageSize">,
  ): Observable<AggregatedOrdersResult> {
    const firstPageQuery: OrderPageQuery = {
      ...query,
      page: 1,
      pageSize: OrderDataService.BULK_PAGE_SIZE,
    };

    return this.loadOrdersPage(firstPageQuery).pipe(
      expand((pageResult) =>
        pageResult.pagination.page < pageResult.pagination.totalPages
          ? this.loadOrdersPage({
              ...query,
              page: pageResult.pagination.page + 1,
              pageSize: OrderDataService.BULK_PAGE_SIZE,
            })
          : EMPTY,
      ),
      reduce(
        (accumulator, pageResult) => ({
          items: [...accumulator.items, ...pageResult.items],
          totalItems: pageResult.pagination.totalItems,
          totalPages: pageResult.pagination.totalPages,
          pageSize: pageResult.pagination.pageSize,
        }),
        {
          items: [] as Order[],
          totalItems: 0,
          totalPages: 1,
          pageSize: OrderDataService.BULK_PAGE_SIZE,
        },
      ),
    );
  }

  private upsertOrder(orders: readonly Order[], order: Order): Order[] {
    const existingIndex = orders.findIndex((candidate) => candidate.id === order.id);
    if (existingIndex === -1) {
      return [order, ...orders];
    }

    return orders.map((candidate, index) =>
      index === existingIndex ? order : candidate,
    );
  }

  private applyLoadSuccess(items: Order[], pagination: OrderPaginationState): void {
    this._orders.set(items);
    this._pagination.set(pagination);
    this.snapshotOrders = [...items];
    this._loading.set(false);
  }

  private applyLoadError(pagination: OrderPaginationState): void {
    this._error.set("Failed to load orders");
    this._orders.set([]);
    this.snapshotOrders = [];
    this._pagination.set(pagination);
    this._loading.set(false);
  }

  private replaceOrder(orders: readonly Order[], id: string, updated: Order): Order[] {
    return orders.map((order) => (order.id === id ? updated : order));
  }

  private removeOrder(orders: readonly Order[], id: string): Order[] {
    return orders.filter((order) => order.id !== id);
  }
}
