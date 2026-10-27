import { Injectable, signal, computed, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { EMPTY, catchError, expand, map, reduce, throwError } from "rxjs";
import { Notification } from "../interfaces";
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
  private static readonly PAGE_SIZE = 100;

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
    return this.loadNotificationsPage(1).pipe(
      expand((pageResult) =>
        pageResult.page < pageResult.totalPages
          ? this.loadNotificationsPage(pageResult.page + 1)
          : EMPTY,
      ),
      reduce(
        (all, pageResult) => all.concat(pageResult.items),
        [] as Notification[],
      ),
    );
  }

  markAsRead(id: string): void {
    const previous = this._notifications();
    this._notifications.update((notifications) =>
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    this.http.post(`${this.API_URL}/${id}/read`, {}).subscribe({
      error: (error) => {
        console.error("Error marking notification as read:", error);
        this._notifications.set(previous);
      },
    });
  }

  markAllAsRead(): void {
    const previous = this._notifications();
    this._notifications.update((notifications) =>
      notifications.map((n) => ({ ...n, read: true })),
    );
    this.http.post(`${this.API_URL}/read-all`, {}).subscribe({
      error: (error) => {
        console.error("Error marking all notifications as read:", error);
        this._notifications.set(previous);
      },
    });
  }

  private loadNotificationsPage(page: number) {
    return this.http
      .get<{
        data: Notification[];
        meta?: {
          pagination?: {
            page?: number;
            totalPages?: number;
          };
        };
      }>(this.API_URL, {
        params: {
          page,
          pageSize: NotificationDataService.PAGE_SIZE,
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
          items: this.notificationAdapter.NotificationAdapter(response.data ?? []),
        })),
      );
  }
}
