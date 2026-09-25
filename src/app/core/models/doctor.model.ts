export type DoctorStatus = "Active" | "Inactive";

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  clinicId: string;
  clinicName: string;
  email: string;
  phone: string;
  status: DoctorStatus;
  ordersCount: number;
  joinedDate: string;
  avatar: string;
}

export interface DoctorFilters {
  search?: string;
  statusFilter?: DoctorStatus;
  clinicId?: string;
  sortColumn?: keyof Doctor;
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}
