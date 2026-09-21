import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { LayoutComponent } from './core/layout/shell/layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { OrdersComponent } from './features/orders/orders.component';
import { ViewOrderComponent } from './features/orders/view-order/view-order.component';
import { CreateOrderComponent } from './features/orders/create-order/create-order.component';
import { EditOrderComponent } from './features/orders/edit-order/edit-order.component';
import { OrderWorkflowComponent } from './features/orders/order-workflow/order-workflow.component';
import { OrderFilesComponent } from './features/orders/order-files/order-files.component';
import { CasesComponent } from './features/cases/cases.component';
import { CaseDetailsComponent } from './features/cases/case-details/case-details.component';
import { WorkflowBoardComponent } from './features/workflow-board/workflow-board.component';
import { ScanCenterComponent } from './features/scan-center/scan-center.component';
import { PatientsComponent } from './features/patients/patients.component';
import { PatientDetailsComponent } from './features/patients/patient-details/patient-details.component';
import { DoctorsComponent } from './features/doctors/doctors.component';
import { DoctorDetailsComponent } from './features/doctors/doctor-details/doctor-details.component';
import { ClinicsComponent } from './features/clinics/clinics.component';
import { ClinicDetailsComponent } from './features/clinics/clinic-details/clinic-details.component';
import { DocumentsComponent } from './features/documents/documents.component';
import { BillingComponent } from './features/billing/billing.component';
import { ChangeRequestsComponent } from './features/change-requests/change-requests.component';
import { ReportsComponent } from './features/reports/reports.component';
import { NotificationsComponent } from './features/notifications/notifications.component';
import { SettingsComponent } from './features/settings/settings.component';
import { FormsComponent } from './features/forms/forms.component';
import { SubOrderComponent } from './features/orders/sub-order/sub-order.component';
import { AuthGuard } from './core/guards/auth.guard';

export const appRoutes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'orders', component: OrdersComponent },
      { path: 'orders/create', component: CreateOrderComponent },
      { path: 'orders/:orderId', component: ViewOrderComponent },
      { path: 'orders/:orderId/edit', component: EditOrderComponent },
      { path: 'orders/:orderId/workflow', component: OrderWorkflowComponent },
      { path: 'orders/:orderId/files', component: OrderFilesComponent },
      { path: 'orders/:orderId/sub-orders/:subOrderId', component: SubOrderComponent },
      { path: 'cases', component: CasesComponent },
      { path: 'cases/:caseId', component: CaseDetailsComponent },
      { path: 'workflow-board', component: WorkflowBoardComponent },
      { path: 'scan-center', component: ScanCenterComponent },
      { path: 'patients', component: PatientsComponent },
      { path: 'patients/:patientId', component: PatientDetailsComponent },
      { path: 'doctors', component: DoctorsComponent },
      { path: 'doctors/:doctorId', component: DoctorDetailsComponent },
      { path: 'clinics', component: ClinicsComponent },
      { path: 'clinics/:clinicId', component: ClinicDetailsComponent },
      { path: 'documents', component: DocumentsComponent },
      { path: 'billing', component: BillingComponent },
      { path: 'change-requests', component: ChangeRequestsComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'notifications', component: NotificationsComponent },
      { path: 'settings', component: SettingsComponent },
      { path: 'forms', component: FormsComponent }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];