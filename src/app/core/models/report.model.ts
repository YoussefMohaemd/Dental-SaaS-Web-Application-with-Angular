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

export const BREAKDOWN_COLORS = ['#2563EB', '#06B6D4', '#10B981', '#F59E0B', '#8B5CF6', '#94A3B8'];
