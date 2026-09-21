export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  clinicId: string;
  clinicName: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive';
  ordersCount: number;
  joinedDate: string;
  avatar: string;
}

export interface DoctorFilters {
  search?: string;
  statusFilter?: 'Active' | 'Inactive';
  clinicId?: string;
  sortColumn?: keyof Doctor;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}