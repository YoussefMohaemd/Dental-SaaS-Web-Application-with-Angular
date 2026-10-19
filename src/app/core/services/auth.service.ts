import { Injectable, computed, inject, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { catchError, map, Observable, of, tap, throwError } from "rxjs";
import { ApiEndpoint } from "@core/enum/api.endpoint";
import { environment } from "../../../environments/environment";

interface AuthenticatedUser {
  userId: string;
  tenantId: string;
  fullName: string;
  email: string;
  roles: string[];
}

interface LoginResponse {
  accessToken: string;
  user: AuthenticatedUser;
}

const AUTH_MARKER_KEY = "dentalab-auth";
const AUTH_TOKEN_KEY = "dentalab-auth-token";
const AUTH_USER_KEY = "dentalab-auth-user";
const AUTH_TENANT_KEY = "dentalab-tenant-id";

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly _token = signal<string | null>(null);
  private readonly _user = signal<AuthenticatedUser | null>(null);

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
        tap((result) => this.setSession(result.accessToken, result.user)),
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
        catchError(() => {
          return of(void 0);
        }),
        tap(() => this.clearSession()),
      );
  }

  clearSession(): void {
    this._token.set(null);
    this._user.set(null);
    try {
      localStorage.removeItem(AUTH_MARKER_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem(AUTH_TENANT_KEY);
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

  private setSession(token: string, user: AuthenticatedUser): void {
    this._token.set(token);
    this._user.set(user);
    try {
      localStorage.setItem(AUTH_MARKER_KEY, "true");
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      localStorage.setItem(AUTH_TENANT_KEY, user.tenantId);
    } catch {}
  }

  private restoreSession(): void {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const userRaw = localStorage.getItem(AUTH_USER_KEY);
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
      return localStorage.getItem(AUTH_TENANT_KEY);
    } catch {
      return null;
    }
  }
}
