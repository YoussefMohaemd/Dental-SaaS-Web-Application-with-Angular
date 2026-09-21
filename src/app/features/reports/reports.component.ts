import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderDataService } from '@core/services/order-data.service';
import { CaseDataService } from '@core/services/case-data.service';
import { BillingDataService } from '@core/services/billing-data.service';
import { FormatUtils } from '@core/services/format-utils.service';

interface RevenuePoint {
  month: string;
  revenue: number;
}

interface BreakdownSlice {
  name: string;
  value: number;
}

interface TurnaroundPoint {
  day: string;
  days: number;
}

interface StageShare {
  stage: string;
  count: number;
  percent: number;
}

const MONTHLY_REVENUE: RevenuePoint[] = [
  { month: 'Jul', revenue: 42000 },
  { month: 'Aug', revenue: 48000 },
  { month: 'Sep', revenue: 45000 },
  { month: 'Oct', revenue: 52000 },
  { month: 'Nov', revenue: 58000 },
  { month: 'Dec', revenue: 64000 }
];

const RESTORATION_BREAKDOWN: BreakdownSlice[] = [
  { name: 'Crown', value: 38 },
  { name: 'Bridge', value: 22 },
  { name: 'Veneer', value: 15 },
  { name: 'Implant', value: 12 },
  { name: 'Full Arch', value: 8 },
  { name: 'Other', value: 5 }
];

const TURNAROUND: TurnaroundPoint[] = [
  { day: 'Mon', days: 4.2 },
  { day: 'Tue', days: 3.8 },
  { day: 'Wed', days: 4.6 },
  { day: 'Thu', days: 3.5 },
  { day: 'Fri', days: 4.0 },
  { day: 'Sat', days: 2.8 },
  { day: 'Sun', days: 2.4 }
];

const WORKFLOW_SHARE: StageShare[] = [
  { stage: 'New', count: 8, percent: 25 },
  { stage: 'Review', count: 5, percent: 15.6 },
  { stage: 'Design', count: 7, percent: 21.9 },
  { stage: 'Production', count: 12, percent: 37.5 },
  { stage: 'Quality Check', count: 4, percent: 12.5 },
  { stage: 'Ready', count: 6, percent: 18.8 }
];

const BREAKDOWN_COLORS = ['#3B82F6', '#22C55E', '#F59E0B', '#8B5CF6', '#EC4899', '#64748B'];

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent {
  private readonly orderService = inject(OrderDataService);
  private readonly caseService = inject(CaseDataService);
  private readonly billingService = inject(BillingDataService);
  protected readonly formatUtils = inject(FormatUtils);

  readonly monthlyRevenue: RevenuePoint[] = MONTHLY_REVENUE;
  readonly restorationBreakdown: BreakdownSlice[] = RESTORATION_BREAKDOWN;
  readonly turnaround: TurnaroundPoint[] = TURNAROUND;
  readonly workflowShare: StageShare[] = WORKFLOW_SHARE;

  readonly maxRevenue = Math.max(...MONTHLY_REVENUE.map(r => r.revenue));
  readonly maxTurnaround = Math.max(...TURNAROUND.map(t => t.days));

  readonly totalRevenue = computed(() =>
    this.billingService.records().filter(r => r.status === 'Paid').reduce((sum, r) => sum + r.amount, 0)
  );
  readonly completedOrders = computed(() => this.orderService.orders().filter(o => o.status === 'Completed').length);
  readonly openCases = computed(() => this.caseService.cases().filter(c => c.status !== 'Closed').length);
  readonly averageOrderValue = computed(() => {
    const records = this.billingService.records();
    if (records.length === 0) return 0;
    return Math.round(records.reduce((sum, r) => sum + r.amount, 0) / records.length);
  });

  barHeight(revenue: number): number {
    return Math.max(4, Math.round((revenue / this.maxRevenue) * 100));
  }

  lineHeight(days: number): number {
    return Math.max(4, Math.round((days / this.maxTurnaround) * 100));
  }

  sliceColor(index: number): string {
    return BREAKDOWN_COLORS[index % BREAKDOWN_COLORS.length];
  }
}
