import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { Notification } from '../models';

@Injectable({ providedIn: 'root' })
export class NotificationDataService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = '/data/notifications.json';

  private readonly _notifications = signal<Notification[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly notifications = this._notifications.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly unreadCount = computed(() => this._notifications().filter(n => !n.read).length);
  readonly recentNotifications = computed(() => this._notifications().slice(0, 10));

  constructor() {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this._loading.set(true);
    this._error.set(null);

    this.http.get<Notification[]>(this.API_URL).pipe(
      catchError(err => {
        this._error.set('Failed to load notifications');
        console.error('Error loading notifications:', err);
        return of([] as Notification[]);
      })
    ).subscribe({
      next: (notifications: Notification[]) => {
        this._notifications.set(notifications);
        this._loading.set(false);
      },
      error: () => {
        this._loading.set(false);
      }
    });
  }

  markAsRead(id: string): void {
    this._notifications.update(notifications =>
      notifications.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }

  markAllAsRead(): void {
    this._notifications.update(notifications =>
      notifications.map(n => ({ ...n, read: true }))
    );
  }
}