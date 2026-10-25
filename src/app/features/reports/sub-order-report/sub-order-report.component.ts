import { CommonModule } from "@angular/common";
import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { NavigationService } from "@core/services/navigation.service";
import { SubOrderReportDataService } from "@core/services/sub-order-report-data.service";
import { AppButtonComponent } from "@shared/components/button/button.component";
import { DataTableToolbarComponent } from "@shared/components/data-table-toolbar/data-table-toolbar.component";
import { AppTextFieldComponent } from "@shared/components/input/input.component";
import { TableFeedbackComponent } from "@shared/components/table-feedback/table-feedback.component";
import { TagModule } from "primeng/tag";

@Component({
  selector: "app-sub-order-report",
  standalone: true,
  imports: [
    CommonModule,
    DataTableToolbarComponent,
    AppButtonComponent,
    AppTextFieldComponent,
    TableFeedbackComponent,
    TagModule,
  ],
  templateUrl: "./sub-order-report.component.html",
})
export class SubOrderReportComponent implements OnInit {
  private readonly reportService = inject(SubOrderReportDataService);
  private readonly navigationService = inject(NavigationService);

  readonly report = this.reportService.report;
  readonly loading = this.reportService.loading;
  readonly error = this.reportService.error;
  readonly serviceFilter = signal("");
  readonly summaryCards = computed(() => {
    const summary = this.report().summary;
    return [
      { label: "Total sub-orders", value: summary.total, tone: "text-primary" },
      { label: "Completed", value: summary.completed, tone: "text-success" },
      { label: "In progress", value: summary.inProgress, tone: "text-info" },
      { label: "Overdue", value: summary.overdue, tone: "text-danger" },
    ];
  });

  ngOnInit(): void {
    this.reportService.load();
  }

  applyFilter(): void {
    this.reportService.load({ service: this.serviceFilter().trim() });
  }

  resetFilter(): void {
    this.serviceFilter.set("");
    this.reportService.load();
  }

  goToReportsHub(): void {
    this.navigationService.navigate("reports");
  }
}
