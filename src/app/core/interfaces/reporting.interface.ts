export interface StoryServiceDefinition {
  key: string;
  label: string;
  basePrice: number;
}

export interface ReportingSeedData {
  startYear: number;
  endYear: number;
  services: StoryServiceDefinition[];
  scanCenters: string[];
  doctors: string[];
  patientsFirstNames: string[];
  patientsLastNames: string[];
  operators: string[];
  employeeTypes: string[];
  employeeNames: string[];
}

export interface OrderArchiveRecord {
  id: string;
  orderId: string;
  scanCenter: string;
  doctorName: string;
  patientName: string;
  serviceName: string;
  maxillary: boolean;
  mandibular: boolean;
  amount: number;
  vouchers: number;
  receivedAt: string;
  sentAt: string;
  operator: string;
  archiveDate: string;
  chargedAt: string | null;
}

export interface MonthlyServiceMetric {
  year: number;
  month: number;
  serviceKey: string;
  serviceName: string;
  ordersCount: number;
  totalRevenue: number;
}

export interface ServiceQuarterMetric {
  serviceKey: string;
  serviceName: string;
  ordersCount: number;
  totalRevenue: number;
  averageUnitPrice: number;
}

export interface QuarterMonthDetail {
  month: number;
  monthLabel: string;
  ordersCount: number;
  totalRevenue: number;
  services: ServiceQuarterMetric[];
}

export interface QuarterReportDetail {
  year: number;
  quarter: number;
  quarterLabel: string;
  ordersCount: number;
  totalRevenue: number;
  services: ServiceQuarterMetric[];
  months: QuarterMonthDetail[];
}

export interface TeamPerformanceRecord {
  userId: number;
  type: string;
  fullName: string;
  completedOrders: number;
  revenueCollected: number;
  avgTurnaroundDays: number;
  onTimeRate: number;
  status: "Active" | "On Leave";
}

export const FALLBACK_REPORTING_SEED: ReportingSeedData = {
  startYear: 2023,
  endYear: 2026,
  services: [
    { key: "treatment-plan", label: "Treatment Plan", basePrice: 16 },
    { key: "surgical-guide", label: "Surgical Guide", basePrice: 22 },
    { key: "final-restoration", label: "Final Restoration", basePrice: 28 },
    { key: "crown-design", label: "Crown Design", basePrice: 20 },
    { key: "veneer-design", label: "Veneer Design", basePrice: 21 },
    { key: "bridge-design", label: "Bridge Design", basePrice: 24 },
    { key: "inlay-design", label: "Inlay Design", basePrice: 18 },
    { key: "onlay-design", label: "Onlay Design", basePrice: 19 },
    { key: "provisional", label: "Provisional", basePrice: 15 },
    { key: "shade-match", label: "Shade Match", basePrice: 14 },
    { key: "try-in-review", label: "Try-In Review", basePrice: 17 },
    {
      key: "night-guard-fabrication",
      label: "Night Guard Fabrication",
      basePrice: 19,
    },
    { key: "denture-setup", label: "Denture Setup", basePrice: 23 },
    { key: "gfmr", label: "GFMR", basePrice: 20 },
  ],
  scanCenters: [
    "Cairo Main Hub",
    "Alexandria Digital Lab",
    "Nasr City Scan Point",
    "Mansoura Imaging Desk",
    "October 6 Scan Point",
  ],
  doctors: [
    "Dr. Ahmed Youssef",
    "Dr. Hala Nabil",
    "Dr. Karim Essam",
    "Dr. Mona Samir",
    "Dr. Tamer Adel",
    "Dr. Salma Wael",
    "Dr. Mostafa Nassar",
    "Dr. Reham Emad",
    "Dr. Fady Khater",
    "Dr. Nada Fouad",
    "Dr. Omar ElSherif",
    "Dr. Yara Magdy",
  ],
  patientsFirstNames: [
    "Adam",
    "Leila",
    "Yousef",
    "Mariam",
    "Omar",
    "Farah",
    "Nour",
    "Hassan",
  ],
  patientsLastNames: [
    "Hassan",
    "Nabil",
    "Fouad",
    "Mahmoud",
    "Ismail",
    "Sherif",
    "Khalifa",
    "Aziz",
  ],
  operators: ["shrouk", "ahmed.y", "nouran.s", "mohamed.t", "sara.k"],
  employeeTypes: [
    "Planner",
    "Designer",
    "Production",
    "Quality Control",
    "Support",
  ],
  employeeNames: [
    "crispin",
    "Jimmy",
    "salma.mohamed",
    "Mohamed Mitwally",
    "Amr Temraz",
    "Passant",
    "Alan",
    "Andrew",
    "Tarek Adel",
    "Fredrick",
    "Osama",
    "Wess Paul",
    "Rana Fouad",
    "Reham",
    "Selwan Yehia",
    "Nashwa",
  ],
};
