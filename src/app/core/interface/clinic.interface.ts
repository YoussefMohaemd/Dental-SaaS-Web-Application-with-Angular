export type ApiClinicResponse = ApiClinicItem[];

export interface ApiClinicItem {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  doctorsCount: number;
  patientsCount: number;
  ordersCount: number;
  status: "Active" | "Inactive";
  accountManager: string;
}
