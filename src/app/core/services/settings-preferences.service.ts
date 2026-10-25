import { Injectable, inject, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { map, Observable, tap } from "rxjs";
import { ApiEndpoint } from "@core/enum/api.endpoint";

export interface UserPreferences {
  density: "Compact" | "Default" | "Comfortable";
  theme: "light" | "dark";
  language: string;
  timeZone: string;
  dateFormat: string;
  notificationPrefs: {
    orderUpdates: boolean;
    changeRequests: boolean;
    billingAlerts: boolean;
    systemAlerts: boolean;
    weeklySummary: boolean;
  };
}

@Injectable({ providedIn: "root" })
export class SettingsPreferencesService {
  private readonly http = inject(HttpClient);
  readonly preferences = signal<UserPreferences | null>(null);

  load(): Observable<UserPreferences | null> {
    return this.http
      .get<{ data: UserPreferences | null }>(ApiEndpoint.SETTINGS_PREFERENCES)
      .pipe(
        tap((response) => this.preferences.set(response.data)),
        map((response) => response.data),
      );
  }

  save(preferences: UserPreferences): Observable<UserPreferences> {
    return this.http
      .patch<{ data: UserPreferences }>(
        ApiEndpoint.SETTINGS_PREFERENCES,
        preferences,
      )
      .pipe(
        tap((response) => this.preferences.set(response.data)),
        map((response) => response.data),
      );
  }
}
