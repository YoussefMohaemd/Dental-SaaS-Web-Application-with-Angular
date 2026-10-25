export interface SubOrderReportGroup {
  service: string;
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  blocked: number;
  overdue: number;
  completionRate: number;
}

export interface SubOrderPriorityReportGroup {
  priority: string;
  total: number;
  completed: number;
  overdue: number;
}

export interface SubOrderReport {
  summary: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    blocked: number;
    overdue: number;
    completionRate: number;
  };
  byService: SubOrderReportGroup[];
  byPriority: SubOrderPriorityReportGroup[];
}
