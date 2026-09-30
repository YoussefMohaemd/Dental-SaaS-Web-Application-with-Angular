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
    { key: "model-work", label: "Model Work", basePrice: 8 },
    { key: "conversion", label: "Conversion", basePrice: 9 },
    { key: "report", label: "Report", basePrice: 7 },
    { key: "t-plan", label: "T.Plan", basePrice: 16 },
    { key: "s-guide", label: "S.Guide", basePrice: 20 },
    { key: "temp-restoration", label: "Temp Restoration", basePrice: 13 },
    { key: "final-restoration", label: "Final Restoration", basePrice: 21 },
    { key: "gfmr", label: "GFMR", basePrice: 10 },
    { key: "fmp", label: "FMP", basePrice: 15 },
    { key: "rest-vouchers", label: "Rest Vouchers", basePrice: 24 },
    { key: "other-services", label: "Other Services", basePrice: 11 },
    { key: "software", label: "Software", basePrice: 22 },
    { key: "voucher", label: "Voucher", basePrice: 13 },
    { key: "misc", label: "Misc", basePrice: 18 },
    { key: "printer", label: "Printer", basePrice: 26 },
    { key: "ismile", label: "iSmile", basePrice: 31 },
    { key: "ismile-vouchers", label: "iSmile Vouchers", basePrice: 10 },
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
  patientsFirstNames: ["Adam", "Leila", "Yousef", "Mariam"],
  patientsLastNames: ["Hassan", "Nabil", "Fouad", "Mahmoud"],
  operators: ["shrouk", "ahmed.y", "nouran.s", "mohamed.t"],
  employeeTypes: ["Planner", "Designer", "Production", "Quality Control"],
  employeeNames: ["crispin", "Jimmy", "salma.mohamed", "Mohamed Mitwally"],
};
