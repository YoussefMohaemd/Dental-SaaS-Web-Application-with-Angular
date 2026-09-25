export interface BillingRecord {
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

export interface BillingFilters {
  search?: string;
  statusFilter?: BillingRecord["status"];
  dateFrom?: string;
  dateTo?: string;
  sortColumn?: keyof BillingRecord;
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}
