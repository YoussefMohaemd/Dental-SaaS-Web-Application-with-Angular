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
