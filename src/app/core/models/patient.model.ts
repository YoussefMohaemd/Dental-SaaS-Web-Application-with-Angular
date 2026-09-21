export interface Patient {
  id: string;
  name: string;
  dob: string;
  gender: 'M' | 'F';
  phone: string;
  email: string;
  clinicId: string;
  clinicName: string;
  doctorId: string;
  doctorName: string;
  status: 'Active' | 'Inactive';
  ordersCount: number;
  lastVisit: string;
}

export interface PatientFilters {
  search?: string;
  statusFilter?: 'Active' | 'Inactive';
  sortColumn?: keyof Patient;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}