import { CommonModule } from "@angular/common";
import { Component, computed, effect, inject, signal } from "@angular/core";
import { FormatUtils } from "@core/services/format-utils.service";
import { NavigationService } from "@core/services/navigation.service";
import { ReportingDataService } from "@core/services/reporting-data.service";
import { QuarterReportDetail } from "@core/models";
import { DataTableToolbarComponent } from "@shared/components/data-table-toolbar/data-table-toolbar.component";
import { TableFeedbackComponent } from "@shared/components/table-feedback/table-feedback.component";
import { AppSelectComponent } from "@shared/components/select/select.component";
import { AppButtonComponent } from "@shared/components/button/button.component";

@Component({
  selector: "app-quarter-targets-report",
  standalone: true,
  imports: [
    CommonModule,
    DataTableToolbarComponent,
    TableFeedbackComponent,
    AppSelectComponent,
    AppButtonComponent,
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

  openQuarterDetails(quarter: number): void {
    this.navigationService.navigate("reportsQuarterDetail", {
      reportYear: Number(this.selectedYear()),
      reportQuarter: quarter,
    });
  }

  monthLabel(quarterReport: QuarterReportDetail): string {
    return quarterReport.months.map((month) => month.monthLabel).join(" • ");
  }
}
