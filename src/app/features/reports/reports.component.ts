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
  { month: 'Jul', revenue: 48200 },
  { month: 'Aug', revenue: 52800 },
  { month: 'Sep', revenue: 44600 },
  { month: 'Oct', revenue: 61300 },
  { month: 'Nov', revenue: 58900 },
  { month: 'Dec', revenue: 39200 }
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
  { day: 'Mon', days: 2.1 },
  { day: 'Tue', days: 2.4 },
  { day: 'Wed', days: 1.9 },
  { day: 'Thu', days: 2.8 },
  { day: 'Fri', days: 2.2 },
  { day: 'Sat', days: 1.5 },
  { day: 'Sun', days: 1.2 }
];

const WORKFLOW_SHARE: StageShare[] = [
  { stage: 'New', count: 8, percent: 25 },
  { stage: 'Review', count: 5, percent: 15.6 },
  { stage: 'Design', count: 7, percent: 21.9 },
  { stage: 'Production', count: 12, percent: 37.5 },
  { stage: 'Quality Check', count: 4, percent: 12.5 },
  { stage: 'Ready', count: 6, percent: 18.8 }
];

const BREAKDOWN_COLORS = ['#2563EB', '#06B6D4', '#10B981', '#F59E0B', '#8B5CF6', '#94A3B8'];

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

  // --- SVG chart geometry (recharts parity: Bar 240px, Donut 200px, Line 200px) ---
  readonly barW = 560;
  readonly barH = 240;
  readonly barPadL = 44;
  readonly barPadB = 28;
  readonly barPadT = 8;

  barX(index: number): number {
    const inner = this.barW - this.barPadL - 8;
    const slot = inner / this.monthlyRevenue.length;
    return this.barPadL + slot * index + slot / 2 - 14;
  }

  barY(revenue: number): number {
    const plotH = this.barH - this.barPadB - this.barPadT;
    return this.barPadT + plotH - (revenue / 70000) * plotH;
  }

  barHt(revenue: number): number {
    const plotH = this.barH - this.barPadB - this.barPadT;
    return (revenue / 70000) * plotH;
  }

  barLabelX(index: number): number {
    return this.barX(index) + 14;
  }

  yTickValue(tick: number): string {
    return `$${Math.round(tick / 1000)}k`;
  }

  yTickY(tick: number): number {
    const plotH = this.barH - this.barPadB - this.barPadT;
    return this.barPadT + plotH - (tick / 70000) * plotH;
  }

  donutSegments(): { dash: string; offset: number; color: string }[] {
    const total = this.restorationBreakdown.reduce((s, r) => s + r.value, 0);
    const R = 62;
    const C = 2 * Math.PI * R;
    let acc = 0;
    return this.restorationBreakdown.map((slice, i) => {
      const frac = slice.value / total;
      const gap = 0.02;
      const seg = {
        dash: `${Math.max(0, frac * C - 4)} ${C}`,
        offset: -(acc * C) + C / 4,
        color: this.sliceColor(i)
      };
      acc += frac + gap / this.restorationBreakdown.length;
      return seg;
    });
  }

  readonly lineW = 560;
  readonly lineH = 200;
  readonly linePadL = 36;
  readonly linePadB = 28;
  readonly linePadT = 8;

  lineX(index: number): number {
    const inner = this.lineW - this.linePadL - 8;
    return this.linePadL + (inner / (this.turnaround.length - 1)) * index;
  }

  lineY(days: number): number {
    const plotH = this.lineH - this.linePadB - this.linePadT;
    return this.linePadT + plotH - (days / 4) * plotH;
  }

  linePoints(): string {
    return this.turnaround.map((t, i) => `${this.lineX(i)},${this.lineY(t.days)}`).join(' ');
  }

  lineTickY(tick: number): number {
    const plotH = this.lineH - this.linePadB - this.linePadT;
    return this.linePadT + plotH - (tick / 4) * plotH;
  }
}
