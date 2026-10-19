export type ApiChangeRequestResponse = ApiChangeRequestItem[];

export interface ApiChangeRequestItem {
  id: string;
  requestNumber: string;
  orderId: string;
  orderNumber: string;
  patientName: string;
  requester: string;
  status: "Pending" | "In Review" | "Approved" | "Rejected" | "Completed";
  priority: "Low" | "Normal" | "High" | "Urgent";
  description: string;
  createdAt: string;
  updatedAt: string;
}
