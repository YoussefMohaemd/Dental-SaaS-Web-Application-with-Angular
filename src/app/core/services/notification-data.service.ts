import { Injectable, signal, computed, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { of, catchError } from "rxjs";
import { Notification } from "../models";

@Injectable({ providedIn: "root" })
export class NotificationDataService {
  private readonly http = inject(HttpClient);

  private readonly API_URL = "data/notifications.json";

  private static readonly FALLBACK_NOTIFICATIONS: Notification[] = [
    {
      id: "n1",
      type: "order",
      title: "New Order Received",
      message:
        "Order DL-024023 from Dr. Sophia Lin has been received and is awaiting review.",
      read: false,
      createdAt: "2024-12-16T10:00:00Z",
      relatedId: "ord-3",
      relatedType: "order",
    },
    {
      id: "n2",
      type: "workflow",
      title: "Order Ready for Pickup",
      message:
        "Order DL-024017 for Alice Johnson is now Ready and awaiting clinic collection.",
      read: false,
      createdAt: "2024-12-16T14:30:00Z",
      relatedId: "ord-7",
      relatedType: "order",
    },
    {
      id: "n3",
      type: "file",
      title: "Files Uploaded",
      message: "3 new scan files were uploaded for Order DL-024011.",
      read: false,
      createdAt: "2024-12-15T09:00:00Z",
    },
    {
      id: "n4",
      type: "request",
      title: "Change Request Submitted",
      message:
        "CR-03005 submitted by Dr. Marcus Webb — shade modification requested.",
      read: false,
      createdAt: "2024-12-15T16:00:00Z",
    },
    {
      id: "n5",
      type: "billing",
      title: "Invoice Overdue",
      message: "Invoice INV-010008 for Pacific Dental Group is 5 days overdue.",
      read: true,
      createdAt: "2024-12-14T11:00:00Z",
    },
    {
      id: "n6",
      type: "order",
      title: "Order Completed",
      message:
        "Order DL-024009 — Crown for Benjamin Clarke — has been completed.",
      read: true,
      createdAt: "2024-12-14T15:00:00Z",
    },
    {
      id: "n7",
      type: "workflow",
      title: "Production Delayed",
      message:
        "Order DL-024031 has been flagged for review — minor occlusal adjustment required.",
      read: true,
      createdAt: "2024-12-13T10:00:00Z",
    },
    {
      id: "n8",
      type: "system",
      title: "Maintenance Window",
      message:
        "Scheduled maintenance on Dec 20 from 02:00–04:00 AM PST. No downtime expected.",
      read: true,
      createdAt: "2024-12-12T08:00:00Z",
    },
    {
      id: "n9",
      type: "order",
      title: "Rush Order Created",
      message:
        "Urgent order DL-024045 has been flagged for priority production.",
      read: true,
      createdAt: "2024-12-12T14:00:00Z",
    },
    {
      id: "n10",
      type: "file",
      title: "Scan Approval Required",
      message:
        "Scan files for Order DL-024038 require technician approval before production.",
      read: true,
      createdAt: "2024-12-11T16:00:00Z",
    },
  ];

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
    this.loadNotifications();
  }

  loadNotifications(): void {
    this._loading.set(true);
    this._error.set(null);

    this.http
      .get<Notification[]>(this.API_URL)
      .pipe(
        catchError((err) => {
          console.warn(
            `Could not load ${this.API_URL} (status ${err?.status}). ` +
              `If you just added public/data/notifications.json, restart 'ng serve'. Using fallback data.`,
          );
          return of(NotificationDataService.FALLBACK_NOTIFICATIONS);
        }),
      )
      .subscribe({
        next: (notifications: Notification[]) => {
          this._notifications.set(notifications ?? []);
          this._loading.set(false);
        },
        error: () => {
          this._notifications.set(
            NotificationDataService.FALLBACK_NOTIFICATIONS,
          );
          this._loading.set(false);
        },
      });
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
