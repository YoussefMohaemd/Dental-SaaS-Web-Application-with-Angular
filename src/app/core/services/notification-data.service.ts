import { Injectable, signal, computed, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { catchError, map, throwError } from "rxjs";
import { Notification } from "../models";
import { ApiResponse } from "@core/interface/api-response.interface";
import { ApiEndpoint } from "@core/enum/api.endpoint";
import { NotificationApi } from "@core/base/notification.api";
import { NotificationAdapter } from "@core/adapters/notification.adapter";

@Injectable({ providedIn: "root" })
export class NotificationDataService extends NotificationApi {
  private readonly http = inject(HttpClient);
  private readonly notificationAdapter = inject(NotificationAdapter);

  private readonly API_URL = ApiEndpoint.NOTIFICATIONS;

  private readonly _notifications = signal<Notification[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly notifications = this._notifications.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly unreadCount = computed(
    () => this._notifications().filter((n) => !n.read).length,
  );
  readonly recentNotifications = computed(() =>
    this._notifications().slice(0, 10),
  );

  constructor() {
    super();
    this.loadNotifications();
  }

  loadNotifications(): void {
    this._loading.set(true);
    this._error.set(null);

    this.getAllNotifications()
      .pipe(
        catchError((err) => {
          this._error.set("Failed to load notifications");
          console.error("Error loading notifications:", err);
          return throwError(() => err);
        }),
      )
      .subscribe({
        next: (notifications: Notification[]) => {
          this._notifications.set(notifications ?? []);
          this._loading.set(false);
        },
        error: () => {
          this._notifications.set([]);
          this._loading.set(false);
        },
      });
  }

  getAllNotifications() {
    return this.http
      .get<ApiResponse<Notification[]>>(this.API_URL)
      .pipe(
        map((response) => response.data ?? []),
        map((rows) => this.notificationAdapter.NotificationAdapter(rows)),
      );
  }

  markAsRead(id: string): void {
    this._notifications.update((notifications) =>
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }

  markAllAsRead(): void {
    this._notifications.update((notifications) =>
      notifications.map((n) => ({ ...n, read: true })),
    );
  }
}
