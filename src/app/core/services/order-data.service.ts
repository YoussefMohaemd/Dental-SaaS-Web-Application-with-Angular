import { Injectable, signal, computed, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { EMPTY, catchError, expand, map, Observable, reduce, tap, throwError } from "rxjs";
import { ApiOrderItem, Order, OrdersViewState } from "../interfaces";
import { ApiEndpoint } from "@core/enum/api.endpoint";
import { OrdersApi } from "@core/base/orders.api";
import { OrderAdapter } from "@core/adapters/order.adapter";

type OrderMutation = Omit<Partial<Order>, "archiveDate"> & {
  archiveDate?: string | null;
};

@Injectable({ providedIn: "root" })
export class OrderDataService extends OrdersApi {
  private readonly http = inject(HttpClient);
  private readonly orderAdapter = inject(OrderAdapter);
  private readonly API_URL = ApiEndpoint.ORDERS;

  private readonly _orders = signal<Order[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private snapshotOrders: Order[] = [];
  private static readonly PAGE_SIZE = 100;

  readonly orders = this._orders.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly totalOrders = computed(() => this._orders().length);
  readonly urgentOrdersCount = computed(
    () => this._orders().filter((o) => o.priority === "Urgent").length,
  );
  readonly completedTodayCount = computed(
    () => this._orders().filter((o) => o.status === "Completed").length,
  );

  constructor() {
    super();
  }

  loadOrders(): void {
    this._loading.set(true);
    this._error.set(null);

    this.getAllOrders()
      .pipe(
        catchError((apiError) => {
          console.error("Error loading orders:", apiError);
          return throwError(() => apiError);
        }),
      )
      .subscribe({
        next: (orders: Order[]) => {
          this._orders.set(orders);
          this.snapshotOrders = [...orders];
          this._loading.set(false);
        },
        error: () => {
          this._error.set("Failed to load orders");
          this._orders.set([]);
          this.snapshotOrders = [];
          this._loading.set(false);
        },
      });
  }

  getAllOrders() {
    return this.loadOrdersPage(1).pipe(
      expand((pageResult) =>
        pageResult.page < pageResult.totalPages
          ? this.loadOrdersPage(pageResult.page + 1)
          : EMPTY,
      ),
      reduce(
        (all, pageResult) => all.concat(pageResult.items),
        [] as Order[],
      ),
    );
  }

  getOrderById$(id: string): Observable<Order> {
    return this.http
      .get<{ data: ApiOrderItem }>(`${this.API_URL}/${id}`)
      .pipe(
        map((response) => this.orderAdapter.OrdersAdapter([response.data])[0]),
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
          this._orders.update((orders) =>
            orders.map((order) => (order.id === id ? updated : order)),
          );
          this.snapshotOrders = this.snapshotOrders.map((order) =>
            order.id === id ? updated : order,
          );
        }),
      );
  }

  deleteOrder$(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
      tap(() => {
        this._orders.update((orders) => orders.filter((order) => order.id !== id));
        this.snapshotOrders = this.snapshotOrders.filter(
          (order) => order.id !== id,
        );
      }),
      map(() => void 0),
    );
  }

  reload(): void {
    this.loadOrders();
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
    const allowed = [
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
    ] as const;

    return Object.fromEntries(
      allowed
        .filter((key) => payload[key] !== undefined && payload[key] !== "")
        .map((key) => [key, payload[key]]),
    );
  }

  private loadOrdersPage(page: number) {
    return this.http
      .get<{
        data: ApiOrderItem[];
        meta?: {
          pagination?: {
            page?: number;
            totalPages?: number;
          };
        };
      }>(this.API_URL, {
        params: {
          page,
          pageSize: OrderDataService.PAGE_SIZE,
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
          items: this.orderAdapter.OrdersAdapter(response.data ?? []),
        })),
      );
  }
}
