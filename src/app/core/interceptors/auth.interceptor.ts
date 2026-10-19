import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { AuthService } from "@core/services/auth.service";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const tenantId = authService.getTenantId();
  const userId = authService.getUserId();

  const setHeaders: Record<string, string> = {
    "x-tenant-id": tenantId,
  };

  if (token) {
    setHeaders["Authorization"] = `Bearer ${token}`;
  }

  if (userId) {
    setHeaders["x-user-id"] = userId;
  }

  const isAuthRequest = req.url.includes("/auth/");
  return next(
    req.clone({
      setHeaders,
      withCredentials: isAuthRequest || req.withCredentials,
    }),
  );
};
