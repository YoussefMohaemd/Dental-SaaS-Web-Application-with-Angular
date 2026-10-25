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
  userId: string;
  type: string;
  fullName: string;
  completedOrders: number;
  revenueCollected: number;
  avgTurnaroundDays: number;
  onTimeRate: number;
  status: "Active" | "On Leave";
}
