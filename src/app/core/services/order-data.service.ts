import { Injectable, signal, computed, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { of, catchError } from "rxjs";
import { Order, OrdersViewState } from "../models";

@Injectable({ providedIn: "root" })
export class OrderDataService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = "/data/orders.json";

  private readonly _orders = signal<Order[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private snapshotOrders: Order[] = [];

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
    this.loadOrders();
  }

  loadOrders(): void {
    this._loading.set(true);
    this._error.set(null);

    this.http
      .get<Order[]>(this.API_URL)
      .pipe(
        catchError((err) => {
          this._error.set("Failed to load orders");
          console.error("Error loading orders:", err);
          return of([] as Order[]);
        }),
      )
      .subscribe({
        next: (orders: Order[]) => {
          this._orders.set(orders);
          this.snapshotOrders = [...orders];
          this._loading.set(false);
        },
        error: () => {
          this._loading.set(false);
        },
      });
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
}
