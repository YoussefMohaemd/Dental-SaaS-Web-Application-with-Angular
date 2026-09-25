import { Routes } from "@angular/router";
import { LayoutComponent } from "./core/layout/shell/layout.component";
import { AuthGuard } from "./core/guards/auth.guard";

export const appRoutes: Routes = [
  { path: "", redirectTo: "login", pathMatch: "full" },
  {
    path: "login",
    loadComponent: () =>
      import("./features/auth/login/login.component").then(
        (m) => m.LoginComponent,
      ),
  },
  {
    path: "",
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: "", redirectTo: "dashboard", pathMatch: "full" },
      {
        path: "dashboard",
        loadComponent: () =>
          import("./features/dashboard/dashboard.component").then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: "orders",
        loadComponent: () =>
          import("./features/orders/orders.component").then(
            (m) => m.OrdersComponent,
          ),
      },
      {
        path: "orders/create",
        loadComponent: () =>
          import("./features/orders/create-order/create-order.component").then(
            (m) => m.CreateOrderComponent,
          ),
      },
      {
        path: "orders/:orderId",
        loadComponent: () =>
          import("./features/orders/view-order/view-order.component").then(
            (m) => m.ViewOrderComponent,
          ),
      },
      {
        path: "orders/:orderId/edit",
        loadComponent: () =>
          import("./features/orders/edit-order/edit-order.component").then(
            (m) => m.EditOrderComponent,
          ),
      },
      {
        path: "orders/:orderId/workflow",
        loadComponent: () =>
          import("./features/orders/order-workflow/order-workflow.component").then(
            (m) => m.OrderWorkflowComponent,
          ),
      },
      {
        path: "orders/:orderId/files",
        loadComponent: () =>
          import("./features/orders/order-files/order-files.component").then(
            (m) => m.OrderFilesComponent,
          ),
      },
      {
        path: "orders/:orderId/sub-orders/:subOrderId",
        loadComponent: () =>
          import("./features/orders/sub-order/sub-order.component").then(
            (m) => m.SubOrderComponent,
          ),
      },
      {
        path: "cases",
        loadComponent: () =>
          import("./features/cases/cases.component").then(
            (m) => m.CasesComponent,
          ),
      },
      {
        path: "cases/:caseId",
        loadComponent: () =>
          import("./features/cases/case-details/case-details.component").then(
            (m) => m.CaseDetailsComponent,
          ),
      },
      {
        path: "workflow-board",
        loadComponent: () =>
          import("./features/workflow-board/workflow-board.component").then(
            (m) => m.WorkflowBoardComponent,
          ),
      },
      {
        path: "scan-center",
        loadComponent: () =>
          import("./features/scan-center/scan-center.component").then(
            (m) => m.ScanCenterComponent,
          ),
      },
      {
        path: "patients",
        loadComponent: () =>
          import("./features/patients/patients.component").then(
            (m) => m.PatientsComponent,
          ),
      },
      {
        path: "patients/:patientId",
        loadComponent: () =>
          import("./features/patients/patient-details/patient-details.component").then(
            (m) => m.PatientDetailsComponent,
          ),
      },
      {
        path: "doctors",
        loadComponent: () =>
          import("./features/doctors/doctors.component").then(
            (m) => m.DoctorsComponent,
          ),
      },
      {
        path: "doctors/:doctorId",
        loadComponent: () =>
          import("./features/doctors/doctor-details/doctor-details.component").then(
            (m) => m.DoctorDetailsComponent,
          ),
      },
      {
        path: "clinics",
        loadComponent: () =>
          import("./features/clinics/clinics.component").then(
            (m) => m.ClinicsComponent,
          ),
      },
      {
        path: "clinics/:clinicId",
        loadComponent: () =>
          import("./features/clinics/clinic-details/clinic-details.component").then(
            (m) => m.ClinicDetailsComponent,
          ),
      },
      {
        path: "documents",
        loadComponent: () =>
          import("./features/documents/documents.component").then(
            (m) => m.DocumentsComponent,
          ),
      },
      {
        path: "billing",
        loadComponent: () =>
          import("./features/billing/billing.component").then(
            (m) => m.BillingComponent,
          ),
      },
      {
        path: "change-requests",
        loadComponent: () =>
          import("./features/change-requests/change-requests.component").then(
            (m) => m.ChangeRequestsComponent,
          ),
      },
      {
        path: "reports",
        loadComponent: () =>
          import("./features/reports/reports.component").then(
            (m) => m.ReportsComponent,
          ),
      },
      {
        path: "notifications",
        loadComponent: () =>
          import("./features/notifications/notifications.component").then(
            (m) => m.NotificationsComponent,
          ),
      },
      {
        path: "settings",
        loadComponent: () =>
          import("./features/settings/settings.component").then(
            (m) => m.SettingsComponent,
          ),
      },
      {
        path: "forms",
        loadComponent: () =>
          import("./features/forms/forms.component").then(
            (m) => m.FormsComponent,
          ),
      },
      {
        path: "grid",
        loadComponent: () =>
          import("./features/grid/grid.component").then((m) => m.GridComponent),
      },
    ],
  },
  { path: "**", redirectTo: "login" },
];
