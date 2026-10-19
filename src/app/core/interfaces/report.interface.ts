export interface RevenuePoint {
  month: string;
  revenue: number;
}

export interface BreakdownSlice {
  name: string;
  value: number;
}

export interface TurnaroundPoint {
  day: string;
  days: number;
}

export interface StageShare {
  stage: string;
  count: number;
  percent: number;
}

export interface ReportsData {
  monthlyRevenue: RevenuePoint[];
  restorationBreakdown: BreakdownSlice[];
  turnaround: TurnaroundPoint[];
  workflowShare: StageShare[];
}

export const BREAKDOWN_COLORS = [
  "#2563EB",
  "#1D4ED8",
  "#0EA5E9",
  "#F59E0B",
  "#7C3AED",
  "#94A3B8",
];
