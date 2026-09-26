export type OrderStatus =
  | "New"
  | "Review"
  | "Design"
  | "Production"
  | "Quality Check"
  | "Ready"
  | "Completed"
  | "Cancelled";

export type Priority = "Low" | "Normal" | "High" | "Urgent";

export type RestoType =
  | "Crown"
  | "Bridge"
  | "Veneer"
  | "Implant Crown"
  | "Full Arch"
  | "Night Guard"
  | "Inlay"
  | "Onlay"
  | "Partial Denture"
  | "Complete Denture";

export type ArchType = "Maxilla" | "Mandible" | "Both";

import type { SubOrderCreationData } from "./sub-order.model";

export interface Order {
  id: string;
  orderNumber: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  clinicId: string;
  clinicName: string;
  scanCenterId: string;
  scanCenterName: string;
  status: OrderStatus;
  priority: Priority;
  restoration: RestoType;
  arch: ArchType;
  format: string;
  shade: string;
  units: number;
  amount: number;
  billed: boolean;
  billedAmount?: number;
  billTo: string;
  vouchers: number;
  isLocked: boolean;
  hasNotes: boolean;
  notes: string;
  archiveDate?: string;
  receivedAt: string;
  sentAt?: string;
  updatedAt: string;
  chargedAt?: string;
  dueDate: string;
  changeRequest?: string;
  csTask?: string;
  technicianId?: string;
  technicianName?: string;
  creationData?: {
    services: SubOrderCreationData[];
  };
}

export type OrdersViewState = "normal" | "loading" | "empty" | "error";
