import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, catchError } from 'rxjs';

export interface VolumeDay {
  day: string;
  orders: number;
  completed: number;
}

export interface VolumeWeek {
  weekStart: string;
  weekLabel: string;
  days: VolumeDay[];
}

/**
 * Dashboard chart data flow (React parity for the Order Volume chart):
 *   dashboard-volume.json → HttpClient Observable → signals → component.
 * No chart data is hardcoded in UI components; the JSON holds 12 weeks and
 * the component renders the current week.
 */
@Injectable({ providedIn: 'root' })
export class DashboardDataService {
  private readonly http = inject(HttpClient);
  // Base-href-safe relative URL (same convention as NotificationDataService).
  private readonly API_URL = 'data/dashboard-volume.json';

  /** React DashboardPage weeklyData — fallback when the JSON is unavailable. */
  private static readonly FALLBACK_WEEKS: VolumeWeek[] = [
    {
      weekStart: '2024-12-16',
      weekLabel: 'W51',
      days: [
        { day: 'Mon', orders: 14, completed: 11 },
        { day: 'Tue', orders: 18, completed: 15 },
        { day: 'Wed', orders: 12, completed: 10 },
        { day: 'Thu', orders: 21, completed: 18 },
        { day: 'Fri', orders: 16, completed: 13 },
        { day: 'Sat', orders: 8, completed: 7 },
        { day: 'Sun', orders: 5, completed: 5 },
      ],
    },
  ];

  private readonly _weeks = signal<VolumeWeek[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly weeks = this._weeks.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  /** Current week drives the Order Volume chart. */
  readonly currentWeek = computed<VolumeWeek>(() => {
    const weeks = this._weeks();
    return weeks.length > 0 ? weeks[weeks.length - 1] : DashboardDataService.FALLBACK_WEEKS[0];
  });

  readonly currentDays = computed<VolumeDay[]>(() => this.currentWeek().days);

  /** Data maximum across the current week (both series). */
  readonly weekMax = computed<number>(() =>
    Math.max(...this.currentDays().map((d) => Math.max(d.orders, d.completed)), 1)
  );

  constructor() {
    this.loadVolume();
  }

  loadVolume(): void {
    this._loading.set(true);
    this._error.set(null);

    this.http.get<{ weeks: VolumeWeek[] }>(this.API_URL).pipe(
      catchError((err) => {
        console.warn(
          `Could not load ${this.API_URL} (status ${err?.status}). Using fallback volume data.`
        );
        return of({ weeks: DashboardDataService.FALLBACK_WEEKS });
      })
    ).subscribe({
      next: (payload) => {
        this._weeks.set(payload?.weeks?.length ? payload.weeks : DashboardDataService.FALLBACK_WEEKS);
        this._loading.set(false);
      },
      error: () => {
        this._weeks.set(DashboardDataService.FALLBACK_WEEKS);
        this._loading.set(false);
      },
    });
  }
}
