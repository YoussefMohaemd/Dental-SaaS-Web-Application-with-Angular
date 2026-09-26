import { Component, computed, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { OrderDataService } from "@core/services/order-data.service";
import { CaseDataService } from "@core/services/case-data.service";
import { BillingDataService } from "@core/services/billing-data.service";
import { ReportsDataService } from "@core/services/reports-data.service";
import { FormatUtils } from "@core/services/format-utils.service";
import { ChartConfiguration, ChartData, TooltipItem } from "chart.js";
import {
  BaseChartDirective,
  provideCharts,
  withDefaultRegisterables,
} from "ng2-charts";
import {
  BREAKDOWN_COLORS,
  BreakdownSlice,
  RevenuePoint,
  StageShare,
  TurnaroundPoint,
} from "@core/models/report.model";

@Component({
  selector: "app-reports",
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: "./reports.component.html",
  styleUrl: "./reports.component.scss",
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

  readonly totalRevenue = computed(() =>
    this.billingService
      .records()
      .filter((r) => r.status === "Paid")
      .reduce((sum, r) => sum + r.amount, 0),
  );
  readonly completedOrders = computed(
    () =>
      this.orderService.orders().filter((o) => o.status === "Completed").length,
  );
  readonly openCases = computed(
    () => this.caseService.cases().filter((c) => c.status !== "Closed").length,
  );
  readonly averageOrderValue = computed(() => {
    const records = this.billingService.records();
    if (records.length === 0) return 0;
    return Math.round(
      records.reduce((sum, r) => sum + r.amount, 0) / records.length,
    );
  });

  readonly monthlyRevenueChartData = computed<ChartData<"bar">>(() => ({
    labels: this.monthlyRevenue.map((point) => point.month),
    datasets: [
      {
        label: "Revenue",
        data: this.monthlyRevenue.map((point) => point.revenue),
        backgroundColor: "#2563EB",
        borderRadius: 4,
        barThickness: 28,
        maxBarThickness: 28,
      },
    ],
  }));

  readonly monthlyRevenueChartOptions = computed<
    ChartConfiguration<"bar">["options"]
  >(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<"bar">) =>
            `Revenue: ${this.formatUtils.formatCurrency(Number(context.parsed.y ?? 0))}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#6B7280", font: { size: 11 } },
      },
      y: {
        min: 0,
        max: 70000,
        grid: { color: "#E5E7EB", borderDash: [3, 3] },
        ticks: {
          stepSize: 20000,
          color: "#6B7280",
          font: { size: 11 },
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
          backgroundColor: this.restorationBreakdown.map((_, i) =>
            this.sliceColor(i),
          ),
          borderWidth: 0,
          spacing: 2,
          hoverOffset: 4,
        },
      ],
    }),
  );

  readonly restorationBreakdownChartOptions: ChartConfiguration<"doughnut">["options"] =
    {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      cutout: "62%",
      plugins: {
        legend: { display: false },
        tooltip: {
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
        borderColor: "#06B6D4",
        backgroundColor: "rgba(6, 182, 212, 0.2)",
        borderWidth: 2.5,
        tension: 0.35,
        fill: false,
        pointBackgroundColor: "#06B6D4",
        pointBorderColor: "#06B6D4",
        pointRadius: 4,
        pointHoverRadius: 5,
      },
    ],
  }));

  readonly turnaroundChartOptions = computed<
    ChartConfiguration<"line">["options"]
  >(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<"line">) =>
            `${Number(context.parsed.y ?? 0).toFixed(1)} days`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#6B7280", font: { size: 11 } },
      },
      y: {
        min: 0,
        max: 4,
        grid: { color: "#E5E7EB", borderDash: [3, 3] },
        ticks: {
          stepSize: 1,
          color: "#6B7280",
          font: { size: 11 },
          callback: (value) => `${value}d`,
        },
      },
    },
  }));

  sliceColor(index: number): string {
    return BREAKDOWN_COLORS[index % BREAKDOWN_COLORS.length];
  }

  yTickValue(tick: number): string {
    return `$${Math.round(tick / 1000)}k`;
  }
}
