export type ClinicStatus = 'Active' | 'Inactive';

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
  status: ClinicStatus;
  accountManager: string;
}

export interface ClinicFilters {
  search?: string;
  statusFilter?: ClinicStatus;
  sortColumn?: keyof Clinic;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}