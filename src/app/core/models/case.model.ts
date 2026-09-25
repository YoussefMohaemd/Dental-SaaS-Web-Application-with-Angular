import { Priority } from "./order.model";

export type CaseStatus = "Open" | "In Progress" | "Review" | "Closed";

export interface Case {
  id: string;
  caseNumber: string;
  title: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  clinicId: string;
  clinicName: string;
  status: CaseStatus;
  priority: Priority;
  ordersCount: number;
  filesCount: number;
  createdAt: string;
  updatedAt: string;
  notes: string;
}

export interface CaseFilters {
  search?: string;
  statusFilter?: CaseStatus;
  sortColumn?: keyof Case;
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}
