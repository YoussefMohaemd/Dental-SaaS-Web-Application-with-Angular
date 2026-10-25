import { PageId } from "@core/interfaces";

export const DENTAL_CAPABILITIES = [
  "dashboard.read",
  "orders.read",
  "orders.create",
  "orders.update",
  "orders.delete",
  "orders.export",
  "orders.archive",
  "orders.lock",
  "orders.subOrders.update",
  "orders.subOrders.manage",
  "cases.read",
  "cases.create",
  "patients.read",
  "patients.create",
  "patients.update",
  "patients.delete",
  "doctors.read",
  "doctors.manage",
  "clinics.read",
  "clinics.manage",
  "scanCenters.read",
  "documents.read",
  "documents.manage",
  "billing.read",
  "billing.update",
  "changeRequests.read",
  "changeRequests.update",
  "reports.read",
  "notifications.read",
  "settings.read",
  "settings.update",
  "users.read",
  "users.manage",
  "auth.sessions.revoke",
  "forms.read",
  "grid.read",
] as const;

export type DentalCapability = (typeof DENTAL_CAPABILITIES)[number];

const BASE_CAPABILITIES: readonly DentalCapability[] = [
  "dashboard.read",
  "orders.read",
  "cases.read",
  "patients.read",
  "doctors.read",
  "clinics.read",
  "scanCenters.read",
  "documents.read",
  "billing.read",
  "changeRequests.read",
  "reports.read",
  "notifications.read",
  "settings.read",
  "settings.update",
];

const ROLE_CAPABILITY_MAP: Record<string, readonly DentalCapability[]> = {
  admin: DENTAL_CAPABILITIES,
  staff: [
    ...BASE_CAPABILITIES,
    "orders.create",
    "orders.update",
    "orders.delete",
    "orders.export",
    "orders.archive",
    "orders.lock",
    "orders.subOrders.update",
    "orders.subOrders.manage",
    "cases.create",
    "patients.create",
    "patients.update",
    "patients.delete",
    "doctors.manage",
    "clinics.manage",
    "documents.manage",
    "billing.update",
    "changeRequests.update",
    "users.read",
    "forms.read",
    "grid.read",
  ],
  manager: [...BASE_CAPABILITIES, "orders.export", "forms.read", "grid.read"],
  doctor: [
    ...BASE_CAPABILITIES,
    "orders.create",
    "orders.update",
    "orders.export",
    "orders.archive",
    "orders.subOrders.manage",
    "orders.subOrders.update",
    "cases.create",
    "patients.create",
    "patients.update",
    "documents.manage",
    "changeRequests.update",
    "forms.read",
    "grid.read",
  ],
  technician: [
    ...BASE_CAPABILITIES,
    "orders.export",
    "orders.subOrders.update",
    "cases.create",
    "documents.manage",
    "forms.read",
    "grid.read",
  ],
};

export const NAV_ITEM_CAPABILITY: Partial<Record<PageId, DentalCapability>> = {
  dashboard: "dashboard.read",
  orders: "orders.read",
  cases: "cases.read",
  workflowBoard: "orders.read",
  scanCenter: "scanCenters.read",
  patients: "patients.read",
  doctors: "doctors.read",
  clinics: "clinics.read",
  documents: "documents.read",
  billing: "billing.read",
  changeRequests: "changeRequests.read",
  reports: "reports.read",
  notifications: "notifications.read",
  settings: "settings.read",
  forms: "forms.read",
  grid: "grid.read",
};

export function normalizeRoleAlias(role: string): string {
  const normalized = role.trim().toLowerCase();
  if (normalized.includes("admin")) {
    return "admin";
  }

  if (normalized.includes("staff")) {
    return "staff";
  }

  if (normalized.includes("manager")) {
    return "manager";
  }

  if (normalized.includes("doctor")) {
    return "doctor";
  }

  if (normalized.includes("technician") || normalized.includes("tech")) {
    return "technician";
  }

  return normalized;
}

export function fallbackCapabilitiesFromRoles(
  roles: readonly string[],
): DentalCapability[] {
  const normalizedRoles = Array.from(
    new Set(roles.map((role) => normalizeRoleAlias(role)).filter((role) => role.length > 0)),
  );
  const resolved = new Set<DentalCapability>();

  for (const role of normalizedRoles) {
    const roleCapabilities = ROLE_CAPABILITY_MAP[role];
    if (!roleCapabilities) {
      continue;
    }

    for (const capability of roleCapabilities) {
      resolved.add(capability);
    }
  }

  if (resolved.size === 0 && normalizedRoles.length > 0) {
    for (const capability of BASE_CAPABILITIES) {
      resolved.add(capability);
    }
  }

  return [...resolved].sort();
}
