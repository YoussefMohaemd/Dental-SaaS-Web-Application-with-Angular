import { CommonModule } from "@angular/common";
import { Component, computed, effect, inject, signal } from "@angular/core";
import { QuarterReportDetail, ServiceQuarterMetric } from "@core/models";
import { FormatUtils } from "@core/services/format-utils.service";
import { NavigationService } from "@core/services/navigation.service";
import { ReportingDataService } from "@core/services/reporting-data.service";
import { AppButtonComponent } from "@shared/components/button/button.component";
import { DataTableToolbarComponent } from "@shared/components/data-table-toolbar/data-table-toolbar.component";
import { AppSelectComponent } from "@shared/components/select/select.component";
import { TableFeedbackComponent } from "@shared/components/table-feedback/table-feedback.component";
import { TagModule } from "primeng/tag";

const ALL_QUARTERS = [1, 2, 3, 4] as const;

interface QuarterCardViewModel {
  report: QuarterReportDetail;
  hasData: boolean;
  contributionPercent: number;
  quarterTargetProgress: number;
  averageTicket: number;
  topService: ServiceQuarterMetric | null;
  topServices: ServiceQuarterMetric[];
}

@Component({
  selector: "app-quarter-targets-report",
  standalone: true,
  imports: [
    CommonModule,
    DataTableToolbarComponent,
    TableFeedbackComponent,
    AppSelectComponent,
    AppButtonComponent,
    TagModule,
  ],
  templateUrl: "./quarter-targets-report.component.html",
  styleUrl: "./quarter-targets-report.component.scss",
})
export class QuarterTargetsReportComponent {
  private readonly reportingData = inject(ReportingDataService);
  private readonly navigationService = inject(NavigationService);
  protected readonly formatUtils = inject(FormatUtils);

  readonly loading = this.reportingData.loading;
  readonly availableYears = this.reportingData.availableYears;
  readonly yearOptions = computed(() =>
    this.availableYears().map((year) => String(year)),
  );
  readonly selectedYear = signal(String(new Date().getFullYear()));

  readonly quarterReports = computed<QuarterReportDetail[]>(() =>
    this.reportingData.getQuarterReports(Number(this.selectedYear())),
  );

  readonly annualTotals = computed(() =>
    this.quarterReports().reduce(
      (acc, quarterReport) => {
        acc.ordersCount += quarterReport.ordersCount;
        acc.totalRevenue += quarterReport.totalRevenue;
        return acc;
      },
      { ordersCount: 0, totalRevenue: 0 },
    ),
  );

  readonly annualTarget = computed(() =>
    Math.round(this.annualTotals().totalRevenue * 1.12),
  );
  readonly quarterTargetAmount = computed(() =>
    Math.round(this.annualTarget() / 4),
  );

  readonly annualTargetProgress = computed(() => {
    const target = this.annualTarget();
    if (target === 0) return 0;
    return Math.min(
      100,
      Math.round((this.annualTotals().totalRevenue / target) * 100),
    );
  });

  readonly quarterCards = computed<QuarterCardViewModel[]>(() => {
    const annualRevenue = this.annualTotals().totalRevenue;
    const quarterTarget = this.quarterTargetAmount();
    const year = Number(this.selectedYear());
    const reportsByQuarter = new Map(
      this.quarterReports().map((report) => [report.quarter, report]),
    );

    return ALL_QUARTERS.map((quarter) => {
      const report =
        reportsByQuarter.get(quarter) ?? this.emptyQuarter(year, quarter);
      const activeServices = report.services
        .filter((service) => service.ordersCount > 0)
        .sort((left, right) => right.totalRevenue - left.totalRevenue);

      return {
        report,
        hasData: report.months.length > 0,
        contributionPercent:
          annualRevenue === 0
            ? 0
            : Math.round((report.totalRevenue / annualRevenue) * 100),
        quarterTargetProgress:
          quarterTarget === 0
            ? 0
            : Math.min(
                100,
                Math.round((report.totalRevenue / quarterTarget) * 100),
              ),
        averageTicket:
          report.ordersCount === 0
            ? 0
            : Math.round(report.totalRevenue / report.ordersCount),
        topService: activeServices[0] ?? null,
        topServices: activeServices.slice(0, 5),
      };
    });
  });

  readonly bestQuarter = computed(() => {
    const cards = this.quarterCards().filter((card) => card.hasData);
    if (cards.length === 0) return null;
    return cards.reduce((best, current) =>
      current.report.totalRevenue > best.report.totalRevenue ? current : best,
    );
  });

  constructor() {
    effect(() => {
      const years = this.availableYears();
      if (years.length === 0) return;
      const selectedYear = Number(this.selectedYear());
      if (!years.includes(selectedYear)) {
        this.selectedYear.set(String(years[0]));
      }
    });
  }

  onYearChange(value: string): void {
    this.selectedYear.set(value);
  }

  goToReportsHub(): void {
    this.navigationService.navigate("reports");
  }

  openQuarterDetails(quarter: number): void {
    this.navigationService.navigate("reportsQuarterDetail", {
      reportYear: Number(this.selectedYear()),
      reportQuarter: quarter,
    });
  }

  monthLabel(quarterReport: QuarterReportDetail): string {
    if (quarterReport.months.length === 0) return "No month activity recorded";
    return quarterReport.months.map((month) => month.monthLabel).join(" • ");
  }

  serviceContributionPercent(
    service: ServiceQuarterMetric,
    quarter: QuarterReportDetail,
  ): number {
    if (quarter.totalRevenue === 0) return 0;
    return Math.round((service.totalRevenue / quarter.totalRevenue) * 100);
  }

  isFutureQuarter(quarter: number): boolean {
    const selectedYear = Number(this.selectedYear());
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentQuarter = Math.floor(now.getMonth() / 3) + 1;

    if (selectedYear > currentYear) return true;
    if (selectedYear < currentYear) return false;
    return quarter > currentQuarter;
  }

  quarterStatusLabel(card: QuarterCardViewModel): string {
    if (card.hasData) return `${card.contributionPercent}% annual share`;
    return this.isFutureQuarter(card.report.quarter)
      ? "Awaiting quarter close"
      : "No data submitted";
  }

  quarterStatusSeverity(card: QuarterCardViewModel): "info" | "warn" {
    if (card.hasData) return "info";
    return this.isFutureQuarter(card.report.quarter) ? "info" : "warn";
  }

  quarterHint(card: QuarterCardViewModel): string {
    if (card.hasData) return "";
    if (this.isFutureQuarter(card.report.quarter)) {
      return `${card.report.quarterLabel} has not started yet for ${card.report.year}.`;
    }
    return `No recorded month activity for ${card.report.quarterLabel} ${card.report.year}.`;
  }

  quarterProgressColor(
    value: number,
    context: "target" | "contribution",
    hasData: boolean,
  ): string {
    if (!hasData) return "#CBD5E1";
    const percent = this.clampedPercent(value);

    if (context === "target") {
      if (percent >= 95) return "#16A34A";
      if (percent >= 70) return "#0EA5E9";
      if (percent >= 45) return "#F59E0B";
      return "#EF4444";
    }

    if (percent >= 40) return "#1D4ED8";
    if (percent >= 20) return "#2563EB";
    return "#60A5FA";
  }

  clampedPercent(value: number): number {
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  private emptyQuarter(year: number, quarter: number): QuarterReportDetail {
    return {
      year,
      quarter,
      quarterLabel: `Q${quarter}`,
      ordersCount: 0,
      totalRevenue: 0,
      services: [],
      months: [],
    };
  }
}
