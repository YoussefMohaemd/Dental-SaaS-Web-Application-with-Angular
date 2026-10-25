import { Injectable, computed, inject, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import {
  catchError,
  finalize,
  map,
  Observable,
  of,
  shareReplay,
  tap,
  throwError,
} from "rxjs";
import { ApiEndpoint } from "@core/enum/api.endpoint";
import { type DentalCapability } from "@core/security/capabilities";
import { environment } from "../../../environments/environment";

export interface AuthenticatedUser {
  userId: string;
  tenantId: string;
  fullName: string;
  email: string;
  roles: string[];
  capabilities?: DentalCapability[];
  clinicId?: string;
  avatarUrl?: string;
}

interface LoginResponse {
  accessToken: string;
  user: AuthenticatedUser;
}

const AUTH_MARKER_KEY = "dentalab-auth";
const AUTH_TOKEN_KEY = "dentalab-auth-token";
const AUTH_USER_KEY = "dentalab-auth-user";
const AUTH_TENANT_KEY = "dentalab-tenant-id";
const SESSION_TOKEN_KEY = "dentalab-session-token";
const SESSION_USER_KEY = "dentalab-session-user";
const SESSION_TENANT_KEY = "dentalab-session-tenant-id";

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly _token = signal<string | null>(null);
  private readonly _user = signal<AuthenticatedUser | null>(null);
  private refreshInFlight$: Observable<AuthenticatedUser> | null = null;

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token());

  constructor() {
    this.restoreSession();
  }

  login(credentials: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }): Observable<AuthenticatedUser> {
    return this.http
      .post<{ data: LoginResponse }>(
        ApiEndpoint.AUTH_LOGIN,
        {
          tenantId: environment.defaultTenantId,
          email: credentials.email.trim().toLowerCase(),
          password: credentials.password,
          rememberMe: credentials.rememberMe ?? true,
        },
        { withCredentials: true },
      )
      .pipe(
        map((response) => response.data),
        tap((result) =>
          this.setSession(result.accessToken, result.user, credentials.rememberMe ?? false),
        ),
        map((result) => result.user),
        catchError((error) => {
          this.clearSession();
          return throwError(() => error);
        }),
      );
  }

  logout(): Observable<void> {
    return this.http
      .post(
        ApiEndpoint.AUTH_LOGOUT,
        {},
        { withCredentials: true },
      )
      .pipe(
        map(() => void 0),
        catchError((error) => {
          this.clearSession();
          return throwError(() => error);
        }),
        tap(() => this.clearSession()),
      );
  }

  ensureSession(): Observable<boolean> {
    if (this.isAuthenticated()) {
      return of(true);
    }

    return this.refreshSession().pipe(
      map(() => true),
      catchError(() => of(false)),
    );
  }

  refreshSession(): Observable<AuthenticatedUser> {
    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }

    this.refreshInFlight$ = this.http
      .post<{ data: LoginResponse }>(
        ApiEndpoint.AUTH_REFRESH,
        {},
        { withCredentials: true },
      )
      .pipe(
        map((response) => response.data),
        tap((result) =>
          this.setSession(
            result.accessToken,
            result.user,
            this.shouldRememberSession(),
          ),
        ),
        map((result) => result.user),
        catchError((error) => {
          this.clearSession();
          return throwError(() => error);
        }),
        finalize(() => {
          this.refreshInFlight$ = null;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    return this.refreshInFlight$;
  }

  loadCurrentUser(): Observable<AuthenticatedUser> {
    return this.http
      .get<{ data: AuthenticatedUser }>(ApiEndpoint.AUTH_ME)
      .pipe(
        map((response) => response.data),
        tap((user) => this._user.set(user)),
      );
  }

  changePassword(payload: {
    currentPassword: string;
    newPassword: string;
  }): Observable<void> {
    return this.http
      .post<void>(ApiEndpoint.AUTH_PASSWORD, payload)
      .pipe(map(() => void 0));
  }

  clearSession(): void {
    this._token.set(null);
    this._user.set(null);
    try {
      localStorage.removeItem(AUTH_MARKER_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem(AUTH_TENANT_KEY);
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
      sessionStorage.removeItem(SESSION_USER_KEY);
      sessionStorage.removeItem(SESSION_TENANT_KEY);
    } catch {}
  }

  getToken(): string | null {
    return this._token();
  }

  getTenantId(): string {
    return this._user()?.tenantId ?? this.getStoredTenantId() ?? environment.defaultTenantId;
  }

  getUserId(): string | null {
    return this._user()?.userId ?? null;
  }

  private setSession(
    token: string,
    user: AuthenticatedUser,
    rememberMe: boolean,
  ): void {
    this._token.set(token);
    this._user.set(user);
    try {
      localStorage.removeItem(AUTH_MARKER_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem(AUTH_TENANT_KEY);
      sessionStorage.setItem(SESSION_TOKEN_KEY, token);
      sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
      sessionStorage.setItem(SESSION_TENANT_KEY, user.tenantId);
      if (rememberMe) {
        localStorage.setItem(AUTH_MARKER_KEY, "true");
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
        localStorage.setItem(AUTH_TENANT_KEY, user.tenantId);
      }
    } catch {}
  }

  private restoreSession(): void {
    try {
      const token = sessionStorage.getItem(SESSION_TOKEN_KEY);
      const userRaw = sessionStorage.getItem(SESSION_USER_KEY);
      if (!token || !userRaw) return;
      const user = JSON.parse(userRaw) as AuthenticatedUser;
      if (!user?.tenantId || !user?.userId) return;
      this._token.set(token);
      this._user.set(user);
    } catch {
      this.clearSession();
    }
  }

  private getStoredTenantId(): string | null {
    try {
      return (
        localStorage.getItem(AUTH_TENANT_KEY) ??
        sessionStorage.getItem(SESSION_TENANT_KEY)
      );
    } catch {
      return null;
    }
  }

  private shouldRememberSession(): boolean {
    try {
      return localStorage.getItem(AUTH_MARKER_KEY) === "true";
    } catch {
      return false;
    }
  }
}
