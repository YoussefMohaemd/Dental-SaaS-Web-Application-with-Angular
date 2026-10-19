import { Priority } from "@core/models/order.model";

export type ApiCaseResponse = ApiCaseItem[];

export interface ApiCaseItem {
  id: string;
  caseNumber: string;
  title: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  clinicId: string;
  clinicName: string;
  status: "Open" | "In Progress" | "Review" | "Closed";
  priority: Priority;
  ordersCount: number;
  filesCount: number;
  createdAt: string;
  updatedAt: string;
  notes: string;
}
