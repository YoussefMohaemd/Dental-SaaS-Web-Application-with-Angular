import { environment } from "src/environments/environment";

export class ApiEndpoint {
  static readonly AUTH_LOGIN = `${environment.apiBaseUrl}/auth/login`;
  static readonly AUTH_LOGOUT = `${environment.apiBaseUrl}/auth/logout`;
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
  static readonly SCAN_CENTERS = `${environment.apiBaseUrl}/v1/scan-centers`;

  static orderSubOrders(orderId: string): string {
    return `${environment.apiBaseUrl}/v1/orders/${orderId}/sub-orders`;
  }
}
