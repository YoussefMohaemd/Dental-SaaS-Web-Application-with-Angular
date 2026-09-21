export interface Clinic {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  doctorsCount: number;
  patientsCount: number;
  ordersCount: number;
  status: 'Active' | 'Inactive';
  accountManager: string;
}

export interface ClinicFilters {
  search?: string;
  statusFilter?: 'Active' | 'Inactive';
  sortColumn?: keyof Clinic;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}