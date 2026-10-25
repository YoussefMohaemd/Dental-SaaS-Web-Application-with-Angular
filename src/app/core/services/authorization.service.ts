import { computed, Injectable, inject } from "@angular/core";
import { PageId } from "@core/interfaces";
import { AuthService } from "@core/services/auth.service";
import {
  type DentalCapability,
  fallbackCapabilitiesFromRoles,
  NAV_ITEM_CAPABILITY,
} from "@core/security/capabilities";

@Injectable({ providedIn: "root" })
export class AuthorizationService {
  private readonly authService = inject(AuthService);

  readonly capabilities = computed<Set<DentalCapability>>(() => {
    const user = this.authService.user();
    if (!user) {
      return new Set<DentalCapability>();
    }

    const resolvedCapabilities =
      user.capabilities && user.capabilities.length > 0
        ? user.capabilities
        : fallbackCapabilitiesFromRoles(user.roles);

    return new Set(resolvedCapabilities);
  });

  has(capability: DentalCapability): boolean {
    return this.capabilities().has(capability);
  }

  hasAny(capabilities: readonly DentalCapability[]): boolean {
    return capabilities.some((capability) => this.has(capability));
  }

  canAccessNav(pageId: PageId): boolean {
    const requiredCapability = NAV_ITEM_CAPABILITY[pageId];
    return requiredCapability === undefined || this.has(requiredCapability);
  }
}
