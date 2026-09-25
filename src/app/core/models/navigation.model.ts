export type PageId =
  | 'login'
  | 'dashboard'
  | 'orders'
  | 'viewOrder'
  | 'orderWorkflow'
  | 'orderFiles'
  | 'createOrder'
  | 'editOrder'
  | 'cases'
  | 'caseDetails'
  | 'workflowBoard'
  | 'scanCenter'
  | 'patients'
  | 'patientDetails'
  | 'doctors'
  | 'doctorDetails'
  | 'clinics'
  | 'clinicDetails'
  | 'documents'
  | 'billing'
  | 'changeRequests'
  | 'reports'
  | 'notifications'
  | 'settings'
  | 'grid'
  | 'forms'
  | 'subOrder';

export interface NavParams {
  orderId?: string;
  patientId?: string;
  doctorId?: string;
  clinicId?: string;
  caseId?: string;
  subOrderId?: string;
  subOrderTab?: string;
}

export interface BreadcrumbItem {
  label: string;
  page?: PageId;
  params?: NavParams;
}

export interface NavItem {
  id: PageId;
  label: string;
  icon: string;
  badge?: number;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
  { id: 'orders', label: 'Orders', icon: 'clipboard-list' },
  { id: 'cases', label: 'Cases', icon: 'folder-open' },
  { id: 'workflowBoard', label: 'Workflow', icon: 'git-branch' },
  { id: 'scanCenter', label: 'Scan Center', icon: 'scan-line' },
  { id: 'patients', label: 'Patients', icon: 'users' },
  { id: 'doctors', label: 'Doctors', icon: 'user-cog' },
  { id: 'clinics', label: 'Clinics', icon: 'building-2' },
  { id: 'documents', label: 'Documents', icon: 'file-text' },
  { id: 'billing', label: 'Billing', icon: 'receipt' },
  { id: 'changeRequests', label: 'Change Requests', icon: 'refresh-ccw', badge: 4 },
  { id: 'reports', label: 'Reports', icon: 'bar-chart-3' },
  { id: 'grid', label: 'Grid', icon: 'layers' },
  { id: 'forms', label: 'Forms', icon: 'square-stack' },
  { id: 'settings', label: 'Settings', icon: 'settings' }
];

export const BREADCRUMB_MAP: Partial<Record<PageId, { label: string; parent?: PageId }>> = {
  dashboard: { label: 'Dashboard' },
  orders: { label: 'Orders' },
  viewOrder: { label: 'View Order', parent: 'orders' },
  orderWorkflow: { label: 'Workflow', parent: 'viewOrder' },
  orderFiles: { label: 'Files', parent: 'viewOrder' },
  createOrder: { label: 'Create Order', parent: 'orders' },
  editOrder: { label: 'Edit Order', parent: 'viewOrder' },
  cases: { label: 'Cases' },
  caseDetails: { label: 'Case Details', parent: 'cases' },
  workflowBoard: { label: 'Workflow Board' },
  scanCenter: { label: 'Scan Center' },
  patients: { label: 'Patients' },
  patientDetails: { label: 'Patient Details', parent: 'patients' },
  doctors: { label: 'Doctors' },
  doctorDetails: { label: 'Doctor Details', parent: 'doctors' },
  clinics: { label: 'Clinics' },
  clinicDetails: { label: 'Clinic Details', parent: 'clinics' },
  documents: { label: 'Documents' },
  billing: { label: 'Billing' },
  changeRequests: { label: 'Change Requests' },
  reports: { label: 'Reports' },
  notifications: { label: 'Notifications' },
  settings: { label: 'Settings' },
  grid: { label: 'Grid' },
  forms: { label: 'Forms' },
  subOrder: { label: 'Sub-Order', parent: 'viewOrder' }
};