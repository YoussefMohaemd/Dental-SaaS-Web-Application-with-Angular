import { CommonModule } from "@angular/common";
import { Component, computed, inject, signal } from "@angular/core";
import { DataTableToolbarComponent } from "@shared/components/data-table-toolbar/data-table-toolbar.component";
import { EnterprisePaginatorComponent } from "@shared/components/enterprise-paginator/enterprise-paginator.component";
import { SearchFilterToolbarComponent } from "@shared/components/search-filter-toolbar/search-filter-toolbar.component";
import { StatusBadgeComponent } from "@shared/components/status-badge/status-badge.component";
import { TableFeedbackComponent } from "@shared/components/table-feedback/table-feedback.component";
import { TeamPerformanceRecord } from "@core/models";
import { FormatUtils } from "@core/services/format-utils.service";
import { ReportingDataService } from "@core/services/reporting-data.service";
import { paginateTableRows, tableTotalPages } from "@shared/utils/table-state";

@Component({
  selector: "app-team-performance-report",
  standalone: true,
  imports: [
    CommonModule,
    DataTableToolbarComponent,
    SearchFilterToolbarComponent,
    EnterprisePaginatorComponent,
    StatusBadgeComponent,
    TableFeedbackComponent,
  ],
  templateUrl: "./team-performance-report.component.html",
  styleUrl: "./team-performance-report.component.scss",
})
export class TeamPerformanceReportComponent {
  private readonly reportingData = inject(ReportingDataService);
  protected readonly formatUtils = inject(FormatUtils);

  readonly loading = this.reportingData.loading;
  readonly records = this.reportingData.teamPerformance;

  readonly search = signal("");
  readonly typeFilter = signal("");
  readonly page = signal(1);
  readonly pageSize = 12;

  readonly typeOptions = computed(() =>
    Array.from(
      new Set(this.records().map((record) => record.type)),
    ).sort((left, right) => left.localeCompare(right)),
  );

  readonly filtered = computed<TeamPerformanceRecord[]>(() => {
    const query = this.search().trim().toLowerCase();
    const typeFilter = this.typeFilter().trim();
    let rows = this.records().filter((record) => {
      if (!query) return true;
      return (
        record.fullName.toLowerCase().includes(query) ||
        record.type.toLowerCase().includes(query) ||
        String(record.userId).includes(query)
      );
    });

    if (typeFilter) {
      rows = rows.filter((record) => record.type === typeFilter);
    }

    return [...rows].sort((left, right) =>
      left.fullName.localeCompare(right.fullName),
    );
  });

  readonly totalPages = computed(() =>
    tableTotalPages(this.filtered().length, this.pageSize),
  );

  readonly pagedRows = computed(() =>
    paginateTableRows(this.filtered(), this.page(), this.pageSize),
  );

  readonly toolbarSearchIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35"></path></svg>`;

  onSearchValueChange(value: string): void {
    this.search.set(value);
    this.page.set(1);
  }

  onTypeFilterChange(value: string): void {
    this.typeFilter.set(value);
    this.page.set(1);
  }

  clearFilters(): void {
    this.search.set("");
    this.typeFilter.set("");
    this.page.set(1);
  }

  onPageNumberChange(pageNumber: number): void {
    this.page.set(pageNumber);
  }
}
