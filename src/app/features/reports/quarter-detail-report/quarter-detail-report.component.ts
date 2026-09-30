import { CommonModule } from "@angular/common";
import { Component, DestroyRef, computed, inject, signal } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormatUtils } from "@core/services/format-utils.service";
import { NavigationService } from "@core/services/navigation.service";
import { ReportingDataService } from "@core/services/reporting-data.service";
import { DataTableToolbarComponent } from "@shared/components/data-table-toolbar/data-table-toolbar.component";
import { AppButtonComponent } from "@shared/components/button/button.component";
import { TableFeedbackComponent } from "@shared/components/table-feedback/table-feedback.component";

@Component({
  selector: "app-quarter-detail-report",
  standalone: true,
  imports: [
    CommonModule,
    DataTableToolbarComponent,
    AppButtonComponent,
    TableFeedbackComponent,
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

  readonly quarterReport = computed(() =>
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

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const year = Number(params.get("year"));
        const quarter = Number(params.get("quarter"));
        if (Number.isFinite(year)) this.year.set(year);
        if (Number.isFinite(quarter) && quarter >= 1 && quarter <= 4) {
          this.quarter.set(quarter);
        }
      });
  }

  goBack(): void {
    this.navigationService.navigate("reportsQuarterlyTargets");
  }

  openQuarter(quarter: number): void {
    this.navigationService.navigate("reportsQuarterDetail", {
      reportYear: this.year(),
      reportQuarter: quarter,
    });
  }
}
