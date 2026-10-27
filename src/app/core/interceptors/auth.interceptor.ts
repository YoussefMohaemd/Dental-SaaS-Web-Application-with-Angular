import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from "@angular/common/http";
import { inject } from "@angular/core";
import { catchError, switchMap, throwError } from "rxjs";
import { AuthService } from "@core/services/auth.service";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const isAuthRequest = req.url.includes("/auth/");
  const token = authService.getToken();

  return next(withAuthHeaders(req, authService)).pipe(
    catchError((error: unknown) => {
      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        isAuthRequest ||
        !token
      ) {
        return throwError(() => error);
      }

      return authService.refreshSession().pipe(
        switchMap(() => next(withAuthHeaders(req, authService))),
        catchError((refreshError: unknown) => {
          authService.clearSession();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};

function withAuthHeaders(
  req: HttpRequest<unknown>,
  authService: AuthService,
): HttpRequest<unknown> {
  const setHeaders: Record<string, string> = {};
  const token = authService.getToken();

  if (token) {
    setHeaders["Authorization"] = `Bearer ${token}`;
  }

  return req.clone({
    setHeaders,
    withCredentials: req.url.includes("/auth/") || req.withCredentials,
  });
}
