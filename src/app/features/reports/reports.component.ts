import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderDataService } from '@core/services/order-data.service';
import { CaseDataService } from '@core/services/case-data.service';
import { BillingDataService } from '@core/services/billing-data.service';
import { ReportsDataService } from '@core/services/reports-data.service';
import { FormatUtils } from '@core/services/format-utils.service';
import {
  BREAKDOWN_COLORS,
  BreakdownSlice,
  RevenuePoint,
  StageShare,
  TurnaroundPoint
} from '@core/models/report.model';

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
  private readonly reportsService = inject(ReportsDataService);
  protected readonly formatUtils = inject(FormatUtils);

  get monthlyRevenue(): RevenuePoint[] {
    return this.reportsService.reports().monthlyRevenue;
  }

  get restorationBreakdown(): BreakdownSlice[] {
    return this.reportsService.reports().restorationBreakdown;
  }

  get turnaround(): TurnaroundPoint[] {
    return this.reportsService.reports().turnaround;
  }

  get workflowShare(): StageShare[] {
    return this.reportsService.reports().workflowShare;
  }

  get maxRevenue(): number {
    return Math.max(...this.monthlyRevenue.map(r => r.revenue));
  }

  get maxTurnaround(): number {
    return Math.max(...this.turnaround.map(t => t.days));
  }

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
