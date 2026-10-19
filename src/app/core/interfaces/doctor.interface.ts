export type ApiDoctorResponse = ApiDoctorItem[];

export interface ApiDoctorItem {
  id: string;
  lookupId?: string;
  name: string;
  specialty: string;
  clinicId: string;
  clinicName: string;
  email: string;
  phone: string;
  status: "Active" | "Inactive";
  ordersCount: number;
  joinedDate: string;
  avatar: string;
}
