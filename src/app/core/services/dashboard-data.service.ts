import { Injectable, signal, computed, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { catchError, map, throwError } from "rxjs";
import { ApiEndpoint } from "@core/enum/api.endpoint";
import { VolumeDay, VolumeWeek } from "@core/interfaces";

const EMPTY_WEEK: VolumeWeek = {
  weekStart: "",
  weekLabel: "",
  days: [],
};

@Injectable({ providedIn: "root" })
export class DashboardDataService {
  private readonly http = inject(HttpClient);

  private readonly API_URL = ApiEndpoint.DASHBOARD_VOLUME;

  private readonly _weeks = signal<VolumeWeek[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly weeks = this._weeks.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly currentWeek = computed<VolumeWeek>(() => {
    const weeks = this._weeks();
    return weeks.length > 0 ? weeks[weeks.length - 1] : EMPTY_WEEK;
  });

  readonly currentDays = computed<VolumeDay[]>(() => this.currentWeek().days);

  readonly weekMax = computed<number>(() =>
    Math.max(
      ...this.currentDays().map((d) => Math.max(d.orders, d.completed)),
      1,
    ),
  );

  constructor() {
  }

  loadVolume(): void {
    this._loading.set(true);
    this._error.set(null);

    this.http
      .get<{ data: { weeks?: VolumeWeek[] | Array<{ week: string; orders: number; completed: number }> } }>(this.API_URL)
      .pipe(
        map((response) => this.normalizeWeeksPayload(response.data)),
        catchError((err) => {
          this._error.set("Failed to load dashboard volume");
          console.error("Error loading dashboard volume:", err);
          return throwError(() => err);
        }),
      )
      .subscribe({
        next: (weeks) => {
          this._weeks.set(weeks);
          this._loading.set(false);
        },
        error: () => {
          this._weeks.set([]);
          this._loading.set(false);
        },
      });
  }

  private normalizeWeeksPayload(
    payload:
      | { weeks?: VolumeWeek[] | Array<{ week: string; orders: number; completed: number }> }
      | undefined,
  ): VolumeWeek[] {
    const weeks = payload?.weeks ?? [];
    if (weeks.length === 0) return [];

    const first = weeks[0] as unknown;
    if (isVolumeWeek(first)) {
      return weeks as VolumeWeek[];
    }

    const compactWeeks = weeks as Array<{ week: string; orders: number; completed: number }>;
    const sorted = [...compactWeeks].slice(-7);
    const days: VolumeDay[] = sorted.map((weekPoint) => ({
      day: weekPoint.week,
      orders: weekPoint.orders,
      completed: weekPoint.completed,
    }));

    return [
      {
        weekStart: new Date().toISOString().slice(0, 10),
        weekLabel: "Recent Weeks",
        days,
      },
    ];
  }
}

function isVolumeWeek(value: unknown): value is VolumeWeek {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as { days?: unknown[] }).days)
  );
}
