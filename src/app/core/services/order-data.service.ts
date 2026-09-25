import { Injectable, signal, computed, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, of, delay, map, catchError } from "rxjs";
import { Order, OrderFilters, OrderStatus, Priority } from "../models";
import { filterTableRows } from "@shared/utils/table-state";

export function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  const aTime = Date.parse(String(a));
  const bTime = Date.parse(String(b));
  if (!Number.isNaN(aTime) && !Number.isNaN(bTime)) return aTime - bTime;
  return String(a).localeCompare(String(b));
}

@Injectable({ providedIn: "root" })
export class OrderDataService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = "/data/orders.json";

  private readonly _orders = signal<Order[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly orders = this._orders.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly totalOrders = computed(() => this._orders().length);
  readonly statusCounts = computed(() => {
    const counts: Record<OrderStatus, number> = {
      New: 0,
      Review: 0,
      Design: 0,
      Production: 0,
      "Quality Check": 0,
      Ready: 0,
      Completed: 0,
      Cancelled: 0,
    };
    this._orders().forEach((o) => counts[o.status]++);
    return counts;
  });
  readonly priorityCounts = computed(() => {
    const counts: Record<Priority, number> = {
      Low: 0,
      Normal: 0,
      High: 0,
      Urgent: 0,
    };
    this._orders().forEach((o) => counts[o.priority]++);
    return counts;
  });
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
          this._loading.set(false);
        },
        error: () => {
          this._loading.set(false);
        },
      });
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

  applyFilters(filters: OrderFilters): Order[] {
    let result = filterTableRows(this._orders(), filters.search ?? "", [
      (order) => order.orderNumber,
      (order) => order.patientName,
      (order) => order.doctorName,
      (order) => order.clinicName,
    ]);

    if (filters.statusFilter && filters.statusFilter.length > 0) {
      result = result.filter((o) => filters.statusFilter!.includes(o.status));
    }

    if (filters.priorityFilter) {
      result = result.filter((o) => o.priority === filters.priorityFilter);
    }

    if (filters.sortColumn) {
      const direction = filters.sortDirection === "asc" ? 1 : -1;
      result.sort((a, b) => {
        const av = (a as unknown as Record<string, unknown>)[
          filters.sortColumn!
        ];
        const bv = (b as unknown as Record<string, unknown>)[
          filters.sortColumn!
        ];
        return compareValues(av, bv) * direction;
      });
    }

    return result;
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
