export type DocumentCategory =
  "Prescriptions" | "Scan Files" | "Patient Photos" | "Invoices" | "Reports";

export interface LabDocument {
  id: string;
  name: string;
  category: DocumentCategory;
  type: string;
  size: string;
  date: string;
  doctor: string;
  patientName?: string;
  orderId?: string;
  orderNumber?: string;
  subOrderId?: string;
}

export const DOCUMENT_CATEGORIES: ReadonlyArray<"All" | DocumentCategory> = [
  "All",
  "Prescriptions",
  "Scan Files",
  "Patient Photos",
  "Invoices",
  "Reports",
];
