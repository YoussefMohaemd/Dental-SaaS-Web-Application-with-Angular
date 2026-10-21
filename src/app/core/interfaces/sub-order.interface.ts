export type SubOrderStatus = "done" | "in-progress" | "pending" | "blocked";

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
  priority: "Low" | "Normal" | "High" | "Urgent";
  dueDate: string;
  notes: string;
  creationData?: SubOrderCreationData;
}

export interface SubOrderCreationData {
  serviceId: string;
  serviceDetails: Record<string, string>;
  serviceForm: Record<string, string>;
  selectedTeeth: number[];
  scanRequirements: string[];
  fileReferences: string[];
}

export interface OrderWorkflowStage {
  name: string;
  completed: boolean;
  active: boolean;
}

export type SubOrderAttachmentStatus = "uploaded" | "uploading" | "failed";

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
  state: "done" | "current" | "pending";
  requiredActions: string[];
}

export type SubOrderFormItemStatus = "complete" | "incomplete" | "optional";
export type SubOrderScanItemStatus =
  "uploaded" | "missing" | "optional" | "selected-local";

export interface SubOrderFormItem {
  id: string;
  label: string;
  required: boolean;
  status: SubOrderFormItemStatus;
  value?: SubOrderFormItemValue;
}

export interface SubOrderScanItem {
  id: string;
  label: string;
  format: string;
  status: SubOrderScanItemStatus;
  localFiles?: SubOrderScanLocalFile[];
  updatedAt?: string;
}

export interface SubOrderScanLocalFile {
  id: string;
  name: string;
  sizeBytes: number;
  sizeLabel: string;
  type: string;
  lastModified: number;
  selectedAt: string;
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

export interface SubOrderFormDraftValue {
  clinicalNotes: string;
  occlusalContact: string;
  marginType: string;
  material: string;
  shade: string;
  specialInstructions: string;
}

export interface SubOrderContextSnapshot {
  orderId: string;
  orderNumber: string;
  subOrderId: string;
  service: string;
  patientName: string;
  doctorName: string;
  clinicName: string;
  selectedTeeth: number[];
  caseNotes: string;
}

export interface SubOrderFormItemValue {
  values: SubOrderFormDraftValue;
  context: SubOrderContextSnapshot;
  updatedAt: string;
}

export type SubOrderTab = "overview" | "forms" | "scans" | "activity";

export const SUB_ORDER_TABS: SubOrderTab[] = [
  "overview",
  "forms",
  "scans",
  "activity",
];

export const DEFAULT_SUB_ORDER_FORM_VALUES: SubOrderFormDraftValue = {
  clinicalNotes: "",
  occlusalContact: "Light contact",
  marginType: "Chamfer",
  material: "Zirconia (Multilayer)",
  shade: "A2",
  specialInstructions: "",
};

export const OCCLUSAL_CONTACT_OPTIONS = [
  "Light contact",
  "Full contact",
  "No contact",
] as const;

export const MARGIN_TYPE_OPTIONS = [
  "Chamfer",
  "Shoulder",
  "Feather edge",
  "Knife edge",
] as const;

export const MATERIAL_OPTIONS = [
  "Zirconia (Multilayer)",
  "PFM",
  "E-max",
  "PMMA",
  "Titanium",
] as const;

export const EMPTY_SUB_ORDER_DETAIL: SubOrderDetail = {
  id: "",
  forms: [],
  scans: [],
  activity: [],
};

export interface SubOrderJson {
  id: string;
  orderId?: string;
  service: string;
  icon: string;
  status: SubOrder["status"];
  formsComplete: number;
  formsTotal: number;
  scansComplete: number;
  scansTotal: number;
  teeth: number[];
  priority: SubOrder["priority"];
  dueDate: string;
  notes: string;
  creationData?: SubOrderCreationData;
  forms?: SubOrderDetail["forms"];
  scans?: SubOrderDetail["scans"];
  activity?: SubOrderDetail["activity"];
}
