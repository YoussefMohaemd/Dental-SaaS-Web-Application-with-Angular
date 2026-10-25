import { environment } from "src/environments/environment";

export class ApiEndpoint {
  static readonly AUTH_LOGIN = `${environment.apiBaseUrl}/auth/login`;
  static readonly AUTH_REFRESH = `${environment.apiBaseUrl}/auth/refresh`;
  static readonly AUTH_LOGOUT = `${environment.apiBaseUrl}/auth/logout`;
  static readonly AUTH_ME = `${environment.apiBaseUrl}/auth/me`;
  static readonly AUTH_PASSWORD = `${environment.apiBaseUrl}/auth/password`;
  static readonly BILLING = `${environment.apiBaseUrl}/v1/billing`;
  static readonly CASES = `${environment.apiBaseUrl}/v1/cases`;
  static readonly CHANGE_REQUESTS = `${environment.apiBaseUrl}/v1/change-requests`;
  static readonly CLINICS = `${environment.apiBaseUrl}/v1/clinics`;
  static readonly DASHBOARD_VOLUME = `${environment.apiBaseUrl}/v1/dashboard/volume`;
  static readonly DOCTORS = `${environment.apiBaseUrl}/v1/doctors`;
  static readonly DOCUMENTS = `${environment.apiBaseUrl}/v1/documents`;
  static readonly NOTIFICATIONS = `${environment.apiBaseUrl}/v1/notifications`;
  static readonly ORDERS = `${environment.apiBaseUrl}/v1/orders`;
  static readonly PATIENTS = `${environment.apiBaseUrl}/v1/patients`;
  static readonly REPORTS_OVERVIEW = `${environment.apiBaseUrl}/v1/reports/overview`;
  static readonly REPORTING_SEED = `${environment.apiBaseUrl}/v1/reports/seed`;
  static readonly REPORTS_ORDERS_RANGE = `${environment.apiBaseUrl}/v1/reports/orders-range`;
  static readonly REPORTS_TEAM_PERFORMANCE = `${environment.apiBaseUrl}/v1/reports/team-performance`;
  static readonly REPORTS_SUB_ORDERS = `${environment.apiBaseUrl}/v1/reports/sub-orders`;
  static readonly SCAN_CENTERS = `${environment.apiBaseUrl}/v1/scan-centers`;
  static readonly SETTINGS_PREFERENCES = `${environment.apiBaseUrl}/v1/settings/preferences`;

  static orderSubOrders(orderId: string): string {
    return `${environment.apiBaseUrl}/v1/orders/${orderId}/sub-orders`;
  }

  static subOrder(orderId: string, subOrderId: string): string {
    return `${this.orderSubOrders(orderId)}/${subOrderId}`;
  }

  static changeRequestStatus(requestId: string): string {
    return `${this.CHANGE_REQUESTS}/${requestId}/status`;
  }
}
