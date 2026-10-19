import { ArchType, OrderStatus, Priority, RestoType } from "@core/models/order.model";
import type { SubOrderCreationData } from "@core/models/sub-order.model";

export type ApiOrderResponse = ApiOrderItem[];

export interface ApiOrderItem {
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
    communication?: {
      internalCaseNote: string;
      internalCaseFiles: string[];
      sendMailTo: string[];
      sendIhTaskTo?: string;
      rushTask: boolean;
    };
  };
}
