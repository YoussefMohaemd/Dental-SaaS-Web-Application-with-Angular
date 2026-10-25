import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthorizationService } from "@core/services/authorization.service";
import { type DentalCapability } from "@core/security/capabilities";

export const capabilityGuard: CanActivateFn = (route) => {
  const requiredCapabilities = route.data?.["requiredCapabilities"];
  if (!Array.isArray(requiredCapabilities) || requiredCapabilities.length === 0) {
    return true;
  }

  const authorizationService = inject(AuthorizationService);
  const router = inject(Router);
  const capabilities = requiredCapabilities.filter(
    (value): value is DentalCapability => typeof value === "string",
  );

  if (authorizationService.hasAny(capabilities)) {
    return true;
  }

  return router.parseUrl("/dashboard");
};
