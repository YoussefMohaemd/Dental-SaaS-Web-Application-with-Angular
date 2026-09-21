export interface ChangeRequest {
  id: string;
  requestNumber: string;
  orderId: string;
  orderNumber: string;
  patientName: string;
  requester: string;
  status: 'Pending' | 'In Review' | 'Approved' | 'Rejected' | 'Completed';
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChangeRequestFilters {
  search?: string;
  statusFilter?: ChangeRequest['status'];
  priorityFilter?: ChangeRequest['priority'];
  sortColumn?: keyof ChangeRequest;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}