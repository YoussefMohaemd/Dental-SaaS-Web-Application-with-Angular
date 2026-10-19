import { Order } from "./order.interface";
import { QuarterMonthDetail, QuarterReportDetail, ServiceQuarterMetric } from "./reporting.interface";
import { SubOrder } from "./sub-order.interface";

export interface SelectOption {
  label: string;
  value: unknown;
}

export interface WorkflowTimelineStage {
  label: string;
  status: string;
  owner: string;
  description: string;
  actions: readonly string[];
}

export type ColumnConfig = any;
export type StatItem = any;
export type ScanOrderRow = any;
export type CaseActivityItem = any;
export type WorkflowStage = any;
export type OrderFileEntry = any;
export type DoctorSuggestion = any;
export type SortConfig = any;
export type QuickStatData = any;
export type StatCardData = any;
export type OrderGridRow = any;
export type PatientGridRow = any;
export type PatientSnapshot = any;
export type ServiceGridRow = any;
export type ServiceShowcaseCard = any;
export type WorkflowGridRow = any;
export type PatientActivityItem = any;
export type PatientDocument = any;

export interface RoleSummary {
  type: string;
  members: number;
  totalRevenue: number;
  averageOnTime: number;
}

export interface QuarterCardViewModel {
  report: QuarterReportDetail;
  hasData: boolean;
  contributionPercent: number;
  quarterTargetProgress: number;
  averageTicket: number;
  topService: ServiceQuarterMetric | null;
  topServices: ServiceQuarterMetric[];
}

export interface MonthPanelViewModel {
  month: QuarterMonthDetail;
  revenueSharePercent: number;
  topService: ServiceQuarterMetric | null;
  activeServices: ServiceQuarterMetric[];
}

export interface ContactItem {
  icon: string;
  label: string;
  value: string;
}

export interface ActiveOrderFilter {
  type: "status" | "duration" | "service";
  value: string;
  label: string;
  icon?: string;
}

export interface OrderTreeRowData {
  kind: string;
  order: Order;
  subOrder?: SubOrder;
}

export interface WorkflowDataPoint {
  name: string;
  count: number;
  color: string;
}

export type ReportCardSeverity = "info" | "warn" | "danger" | "success";

export interface ReportNavigationCard {
  title: string;
  description: string;
  route: string;
  cta: string;
  severity: ReportCardSeverity;
}

export interface MonthlyOrderGroup {
  monthKey: string;
  monthLabel: string;
  ordersCount: number;
  totalRevenue: number;
  chargedRevenue: number;
  chargedOrders: number;
  chargeRate: number;
  averageOrderValue: number;
  topServiceName: string;
  serviceMix: ServiceMixItem[];
  orders: any[];
}

export interface ServiceMixItem {
  serviceName: string;
  totalRevenue: number;
  ordersCount: number;
  sharePercent: number;
}
