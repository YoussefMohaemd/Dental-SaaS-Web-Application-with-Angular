export type SubOrderStatus = 'completed' | 'in-progress' | 'pending' | 'blocked';

export interface SubOrder {
  id: string;
  orderId?: string;
  service: string;
  icon: string;
  status: SubOrderStatus;
  formsComplete: number;
  formsTotal: number;
  scansComplete: number;
  scansTotal: number;
  teeth: number[];
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  dueDate: string;
  notes: string;
}

export interface OrderWorkflowStage {
  name: string;
  completed: boolean;
  active: boolean;
}

export type SubOrderAttachmentStatus = 'uploaded' | 'uploading' | 'failed';

export interface SubOrderAttachment {
  id: string;
  name: string;
  type: string;
  size: string;
  sizeBytes: number;
  status: SubOrderAttachmentStatus;
  progress: number;
  uploadedAt: string;
  uploadedBy: string;
}

export interface SubOrderFormValue {
  clinicalNotes: string;
  occlusalContact: string;
  marginType: string;
  material: string;
  shade: string;
  specialInstructions: string;
}

export interface SubOrderWorkflowStep {
  name: string;
  description: string;
  assignee: string;
  state: 'completed' | 'current' | 'pending';
  requiredActions: string[];
}

export type SubOrderViewState = 'loading' | 'normal' | 'error';

/** React parity (SubOrderPage.tsx): per-sub-order detail collections. */
export type SubOrderFormItemStatus = 'complete' | 'incomplete' | 'optional';
export type SubOrderScanItemStatus = 'uploaded' | 'missing' | 'optional';

export interface SubOrderFormItem {
  id: string;
  label: string;
  required: boolean;
  status: SubOrderFormItemStatus;
}

export interface SubOrderScanItem {
  id: string;
  label: string;
  format: string;
  status: SubOrderScanItemStatus;
}

export interface SubOrderActivityItem {
  time: string;
  user: string;
  text: string;
}

export interface SubOrderDetail {
  id: string;
  forms: SubOrderFormItem[];
  scans: SubOrderScanItem[];
  activity: SubOrderActivityItem[];
}

export type SubOrderTab = 'overview' | 'forms' | 'scans' | 'activity';