import { CommonModule } from "@angular/common";
import { Component, computed, inject } from "@angular/core";
import { Router } from "@angular/router";
import { BillingDataService } from "@core/services/billing-data.service";
import { CaseDataService } from "@core/services/case-data.service";
import { FormatUtils } from "@core/services/format-utils.service";
import { OrderDataService } from "@core/services/order-data.service";
import { ReportsDataService } from "@core/services/reports-data.service";
import { AppButtonComponent } from "@shared/components/button/button.component";
import { ChartConfiguration, ChartData, TooltipItem } from "chart.js";
import {
  BaseChartDirective,
  provideCharts,
  withDefaultRegisterables,
} from "ng2-charts";
import { TagModule } from "primeng/tag";
import {
  BREAKDOWN_COLORS,
  BreakdownSlice,
  RevenuePoint,
  StageShare,
  TurnaroundPoint,
} from "@core/models/report.model";

type ReportCardSeverity = "info" | "warn";

interface ReportNavigationCard {
  title: string;
  description: string;
  route: string;
  cta: string;
  severity: ReportCardSeverity;
}

@Component({
  selector: "app-reports",
  standalone: true,
  imports: [
    CommonModule,
    BaseChartDirective,
    AppButtonComponent,
    TagModule,
  ],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: "./reports.component.html",
  styleUrl: "./reports.component.scss",
})
export class ReportsComponent {
  private readonly router = inject(Router);
  private readonly orderService = inject(OrderDataService);
  private readonly caseService = inject(CaseDataService);
  private readonly billingService = inject(BillingDataService);
  private readonly reportsService = inject(ReportsDataService);
  protected readonly formatUtils = inject(FormatUtils);

  protected readonly reportNavigationCards: ReportNavigationCard[] = [
    {
      title: "Orders Date Explorer",
      description:
        "Filter archived orders, inspect monthly movement, and track collection coverage.",
      route: "/reports/orders-range",
      cta: "Open Orders by Date",
      severity: "info",
    },
    {
      title: "Quarter Targets",
      description:
        "Compare quarter delivery, revenue concentration, and service-level contribution.",
      route: "/reports/quarterly-targets",
      cta: "Open Quarter Targets",
      severity: "warn",
    },
    {
      title: "Team Performance",
      description:
        "Evaluate team throughput, on-time quality, and revenue impact by role.",
      route: "/reports/team-performance",
      cta: "Open Team Performance",
      severity: "info",
    },
  ];

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

  readonly totalRevenue = computed(() =>
    this.billingService
      .records()
      .filter((record) => record.status === "Paid")
      .reduce((sum, record) => sum + record.amount, 0),
  );
  readonly completedOrders = computed(
    () =>
      this.orderService.orders().filter((order) => order.status === "Completed")
        .length,
  );
  readonly openCases = computed(
    () =>
      this.caseService.cases().filter((entry) => entry.status !== "Closed")
        .length,
  );
  readonly averageOrderValue = computed(() => {
    const records = this.billingService.records();
    if (records.length === 0) return 0;
    return Math.round(
      records.reduce((sum, record) => sum + record.amount, 0) / records.length,
    );
  });
  readonly completionRate = computed(() => {
    const completed = this.completedOrders();
    const open = this.openCases();
    const total = completed + open;
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  });
  readonly openCaseShare = computed(() => {
    const completed = this.completedOrders();
    const open = this.openCases();
    const total = completed + open;
    if (total === 0) return 0;
    return Math.round((open / total) * 100);
  });
  readonly revenueGrowthPercent = computed(() => {
    const points = this.monthlyRevenue;
    if (points.length < 2) return 0;
    const current = points[points.length - 1]?.revenue ?? 0;
    const previous = points[points.length - 2]?.revenue ?? 0;
    if (previous === 0) return 0;
    return Math.abs(Math.round(((current - previous) / previous) * 100));
  });
  readonly restorationLeader = computed(() => {
    if (this.restorationBreakdown.length === 0) {
      return { name: "No services", value: 0 };
    }

    return this.restorationBreakdown.reduce((top, current) =>
      current.value > top.value ? current : top,
    );
  });
  readonly restorationCoverage = computed(
    () => this.restorationBreakdown.filter((slice) => slice.value > 0).length,
  );
  readonly restorationAverageShare = computed(() => {
    if (this.restorationBreakdown.length === 0) return 0;
    return Math.round(
      this.restorationBreakdown.reduce((sum, slice) => sum + slice.value, 0) /
        this.restorationBreakdown.length,
    );
  });
  readonly turnaroundAverageDays = computed(() => {
    if (this.turnaround.length === 0) return 0;
    const average =
      this.turnaround.reduce((sum, point) => sum + point.days, 0) /
      this.turnaround.length;
    return Number(average.toFixed(1));
  });
  readonly fastestTurnaround = computed<TurnaroundPoint | null>(() => {
    if (this.turnaround.length === 0) return null;
    return this.turnaround.reduce((fastest, current) =>
      current.days < fastest.days ? current : fastest,
    );
  });
  readonly slowestTurnaround = computed<TurnaroundPoint | null>(() => {
    if (this.turnaround.length === 0) return null;
    return this.turnaround.reduce((slowest, current) =>
      current.days > slowest.days ? current : slowest,
    );
  });
  readonly workflowTotalCount = computed(() =>
    this.workflowShare.reduce((sum, item) => sum + item.count, 0),
  );
  readonly topWorkflowStage = computed(() => {
    const stages = this.workflowShare;
    if (stages.length === 0) {
      return { stage: "No stage data", count: 0, percent: 0 };
    }

    return stages.reduce((top, current) =>
      current.percent > top.percent ? current : top,
    );
  });
  readonly workflowContribution = computed(() => {
    const total = this.workflowTotalCount();
    return this.workflowShare.map((item) => ({
      ...item,
      displayStage: this.workflowStageLabel(item.stage),
      contribution: total === 0 ? 0 : Math.round((item.count / total) * 100),
    }));
  });

  readonly monthlyRevenueChartData = computed<ChartData<"bar">>(() => ({
    labels: this.monthlyRevenue.map((point) => point.month),
    datasets: [
      {
        label: "Revenue",
        data: this.monthlyRevenue.map((point) => point.revenue),
        backgroundColor: "#2563EB",
        hoverBackgroundColor: "#1D4ED8",
        borderRadius: 10,
        borderSkipped: false,
        barThickness: 24,
        maxBarThickness: 28,
        categoryPercentage: 0.66,
        barPercentage: 0.84,
      },
    ],
  }));

  readonly monthlyRevenueChartOptions = computed<
    ChartConfiguration<"bar">["options"]
  >(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    layout: {
      padding: { top: 10, right: 12, left: 8, bottom: 6 },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        displayColors: false,
        backgroundColor: "#0F172A",
        titleColor: "#F8FAFC",
        bodyColor: "#E2E8F0",
        callbacks: {
          label: (context: TooltipItem<"bar">) =>
            `Revenue: ${this.formatUtils.formatCurrency(Number(context.parsed.y ?? 0))}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: "#64748B",
          font: { size: 11, weight: 500 },
          maxRotation: 0,
          minRotation: 0,
        },
      },
      y: {
        min: 0,
        max: this.monthlyRevenueAxisMax(),
        grid: { color: "#E2E8F0", borderDash: [3, 4], drawTicks: false },
        ticks: {
          stepSize: Math.max(
            10000,
            Math.round(this.monthlyRevenueAxisMax() / 4),
          ),
          color: "#64748B",
          font: { size: 11, weight: 500 },
          callback: (value) => this.yTickValue(Number(value)),
        },
      },
    },
  }));

  readonly restorationBreakdownChartData = computed<ChartData<"doughnut">>(
    () => ({
      labels: this.restorationBreakdown.map((slice) => slice.name),
      datasets: [
        {
          label: "Restoration Distribution",
          data: this.restorationBreakdown.map((slice) => slice.value),
          backgroundColor: this.restorationBreakdown.map((_, index) =>
            this.sliceColor(index),
          ),
          borderColor: "#F8FAFC",
          borderWidth: 1.5,
          spacing: 3,
          hoverOffset: 6,
        },
      ],
    }),
  );

  readonly restorationBreakdownChartOptions: ChartConfiguration<"doughnut">["options"] =
    {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      cutout: "66%",
      layout: {
        padding: { top: 6, right: 6, left: 6, bottom: 6 },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          displayColors: false,
          backgroundColor: "#0F172A",
          titleColor: "#F8FAFC",
          bodyColor: "#E2E8F0",
          callbacks: {
            label: (context: TooltipItem<"doughnut">) => {
              const label = context.label ?? "Value";
              const value = context.parsed ?? 0;
              return `${label}: ${value}%`;
            },
          },
        },
      },
    };

  readonly turnaroundChartData = computed<ChartData<"line">>(() => ({
    labels: this.turnaround.map((point) => point.day),
    datasets: [
      {
        label: "Average Turnaround",
        data: this.turnaround.map((point) => point.days),
        borderColor: "#0EA5E9",
        backgroundColor: "rgba(14, 165, 233, 0.14)",
        borderWidth: 2.8,
        tension: 0.36,
        fill: true,
        pointBackgroundColor: "#0EA5E9",
        pointBorderColor: "#FFFFFF",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 5.5,
      },
    ],
  }));

  readonly turnaroundChartOptions = computed<
    ChartConfiguration<"line">["options"]
  >(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    layout: {
      padding: { top: 10, right: 12, left: 8, bottom: 6 },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        displayColors: false,
        backgroundColor: "#0F172A",
        titleColor: "#F8FAFC",
        bodyColor: "#E2E8F0",
        callbacks: {
          label: (context: TooltipItem<"line">) =>
            `${Number(context.parsed.y ?? 0).toFixed(1)} days`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: "#64748B",
          font: { size: 11, weight: 500 },
          maxRotation: 0,
          minRotation: 0,
        },
      },
      y: {
        min: 0,
        max: this.turnaroundAxisMax(),
        grid: { color: "#E2E8F0", borderDash: [3, 4], drawTicks: false },
        ticks: {
          stepSize: 1,
          color: "#64748B",
          font: { size: 11, weight: 500 },
          callback: (value) => `${value}d`,
        },
      },
    },
  }));

  navigateToReport(route: string): void {
    this.router.navigateByUrl(route);
  }

  sliceColor(index: number): string {
    return BREAKDOWN_COLORS[index % BREAKDOWN_COLORS.length];
  }

  yTickValue(tick: number): string {
    return `$${Math.round(tick / 1000)}k`;
  }

  clampedPercent(value: number): number {
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  progressColor(
    value: number,
    tone: "primary" | "positive" | "informative" = "primary",
  ): string {
    const percent = this.clampedPercent(value);

    if (tone === "positive") {
      if (percent >= 85) return "#16A34A";
      if (percent >= 70) return "#0EA5E9";
      if (percent >= 50) return "#F59E0B";
      return "#EF4444";
    }

    if (tone === "informative") {
      if (percent >= 70) return "#0284C7";
      if (percent >= 40) return "#3B82F6";
      return "#94A3B8";
    }

    if (percent >= 75) return "#2563EB";
    if (percent >= 45) return "#0EA5E9";
    return "#94A3B8";
  }

  workflowStageLabel(stage: string): string {
    if (stage === "New") return "New Revenue Design";
    return stage;
  }

  workflowProgressColor(stage: string, value: number): string {
    if (stage === "New") return "#2563EB";
    if (stage === "Review") return "#0EA5E9";
    if (stage === "Design") return "#7C3AED";
    if (stage === "Production") return "#F59E0B";
    if (stage === "Quality Check") return "#14B8A6";
    if (stage === "Ready") return "#16A34A";
    if (stage === "Completed") return "#22C55E";
    return this.progressColor(value, "informative");
  }

  private monthlyRevenueAxisMax(): number {
    const maxRevenue = this.monthlyRevenue.reduce(
      (top, point) => Math.max(top, point.revenue),
      0,
    );
    if (maxRevenue <= 0) return 10000;
    return Math.ceil(maxRevenue / 10000) * 10000 + 10000;
  }

  private turnaroundAxisMax(): number {
    const maxDays = this.turnaround.reduce(
      (top, point) => Math.max(top, point.days),
      0,
    );
    const normalized = Math.ceil(maxDays + 0.5);
    return Math.min(8, Math.max(3, normalized));
  }
}
