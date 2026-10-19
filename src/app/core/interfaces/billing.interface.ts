export type ApiBillingResponse = ApiBillingItem[];

export interface ApiBillingItem {
  id: string;
  orderId: string;
  orderNumber: string;
  patientName: string;
  doctorName: string;
  clinicName: string;
  amount: number;
  status: "Pending" | "Invoiced" | "Paid" | "Overdue" | "Cancelled";
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate: string;
  paidDate?: string;
  vouchers: number;
  notes: string;
}
