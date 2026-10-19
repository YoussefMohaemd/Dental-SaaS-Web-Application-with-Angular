export type ApiPatientResponse = ApiPatientItem[];

export interface ApiPatientItem {
  id: string;
  name: string;
  dob: string;
  gender: "M" | "F";
  phone: string;
  email: string;
  clinicId: string;
  clinicName: string;
  doctorId: string;
  doctorName: string;
  status: "Active" | "Inactive";
  ordersCount: number;
  lastVisit: string;
}

export type PatientStatus = "Active" | "Inactive";

export interface Patient {
  id: string;
  name: string;
  dob: string;
  gender: "M" | "F";
  phone: string;
  email: string;
  clinicId: string;
  clinicName: string;
  doctorId: string;
  doctorName: string;
  status: PatientStatus;
  ordersCount: number;
  lastVisit: string;
}

export interface PatientFilters {
  search?: string;
  statusFilter?: PatientStatus;
  sortColumn?: keyof Patient;
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}
