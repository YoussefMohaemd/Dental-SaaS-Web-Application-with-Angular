export type ApiDocumentResponse = ApiDocumentItem[];

export interface ApiDocumentItem {
  id: string;
  name: string;
  category:
    | "Prescriptions"
    | "Scan Files"
    | "Patient Photos"
    | "Invoices"
    | "Reports";
  type: string;
  size: string;
  date: string;
  doctor: string;
  patientName?: string;
  orderId?: string;
  orderNumber?: string;
  subOrderId?: string;
}
