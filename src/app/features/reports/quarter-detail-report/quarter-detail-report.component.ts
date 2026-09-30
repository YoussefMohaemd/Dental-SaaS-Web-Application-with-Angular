import { CommonModule } from "@angular/common";
import { Component, DestroyRef, computed, inject, signal } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  QuarterMonthDetail,
  QuarterReportDetail,
  ServiceQuarterMetric,
} from "@core/models";
import { FormatUtils } from "@core/services/format-utils.service";
import { NavigationService } from "@core/services/navigation.service";
import { ReportingDataService } from "@core/services/reporting-data.service";
import { AppButtonComponent } from "@shared/components/button/button.component";
import { DataTableToolbarComponent } from "@shared/components/data-table-toolbar/data-table-toolbar.component";
import { TableFeedbackComponent } from "@shared/components/table-feedback/table-feedback.component";
import { TagModule } from "primeng/tag";

interface MonthPanelViewModel {
  month: QuarterMonthDetail;
  revenueSharePercent: number;
  topService: ServiceQuarterMetric | null;
  activeServices: ServiceQuarterMetric[];
}

@Component({
  selector: "app-quarter-detail-report",
  standalone: true,
  imports: [
    CommonModule,
    DataTableToolbarComponent,
    AppButtonComponent,
    TableFeedbackComponent,
    TagModule,
  ],
  templateUrl: "./quarter-detail-report.component.html",
  styleUrl: "./quarter-detail-report.component.scss",
})
export class QuarterDetailReportComponent {
  private readonly reportingData = inject(ReportingDataService);
  private readonly navigationService = inject(NavigationService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly formatUtils = inject(FormatUtils);

  readonly loading = this.reportingData.loading;
  readonly year = signal(new Date().getFullYear());
  readonly quarter = signal(1);

  readonly quarterReport = computed<QuarterReportDetail | undefined>(() =>
    this.reportingData.getQuarterReport(this.year(), this.quarter()),
  );

  readonly title = computed(() => {
    const report = this.quarterReport();
    if (!report) return "Quarter Details";
    return `${report.quarterLabel} ${report.year} Details`;
  });

  readonly subtitle = computed(() => {
    const report = this.quarterReport();
    if (!report) return "No report data found for this quarter.";
    return `${report.ordersCount} service entries • ${this.formatUtils.formatCurrency(report.totalRevenue)}`;
  });
  readonly quarterFeedbackMessage = computed(() => {
    if (this.isFutureQuarter(this.quarter())) {
      return `Q${this.quarter()} has no records yet for ${this.year()}. Data will appear when quarter activity starts.`;
    }
    return "No details available for this quarter.";
  });

  readonly monthPanels = computed<MonthPanelViewModel[]>(() => {
    const report = this.quarterReport();
    if (!report) return [];

    return report.months.map((month) => {
      const activeServices = month.services
        .filter((service) => service.ordersCount > 0)
        .sort((left, right) => right.totalRevenue - left.totalRevenue)
        .slice(0, 6);
      return {
        month,
        revenueSharePercent:
          report.totalRevenue === 0
            ? 0
            : Math.round((month.totalRevenue / report.totalRevenue) * 100),
        topService: activeServices[0] ?? null,
        activeServices,
      };
    });
  });

  readonly quarterAverageTicket = computed(() => {
    const report = this.quarterReport();
    if (!report || report.ordersCount === 0) return 0;
    return Math.round(report.totalRevenue / report.ordersCount);
  });

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const yearParam = Number(params.get("year"));
        const quarterParam = Number(params.get("quarter"));

        if (
          Number.isInteger(yearParam) &&
          yearParam >= 2020 &&
          yearParam <= 2100
        ) {
          this.year.set(yearParam);
        }
        if (
          Number.isInteger(quarterParam) &&
          quarterParam >= 1 &&
          quarterParam <= 4
        ) {
          this.quarter.set(quarterParam);
        }
      });
  }

  goBack(): void {
    this.navigationService.navigate("reportsQuarterlyTargets");
  }

  goToReportsHub(): void {
    this.navigationService.navigate("reports");
  }

  openQuarter(quarter: number): void {
    this.navigationService.navigate("reportsQuarterDetail", {
      reportYear: this.year(),
      reportQuarter: quarter,
    });
  }

  isFutureQuarter(quarter: number): boolean {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
    if (this.year() > currentYear) return true;
    if (this.year() < currentYear) return false;
    return quarter > currentQuarter;
  }

  serviceContributionPercent(
    service: ServiceQuarterMetric,
    month: QuarterMonthDetail,
  ): number {
    if (month.totalRevenue === 0) return 0;
    return Math.round((service.totalRevenue / month.totalRevenue) * 100);
  }

  clampedPercent(value: number): number {
    return Math.max(0, Math.min(100, Math.round(value)));
  }
}
