import { CommonModule } from "@angular/common";
import { Component, computed, inject, signal } from "@angular/core";
import { TeamPerformanceRecord } from "@core/models";
import { FormatUtils } from "@core/services/format-utils.service";
import { NavigationService } from "@core/services/navigation.service";
import { ReportingDataService } from "@core/services/reporting-data.service";
import { AppButtonComponent } from "@shared/components/button/button.component";
import { DataTableToolbarComponent } from "@shared/components/data-table-toolbar/data-table-toolbar.component";
import { EnterprisePaginatorComponent } from "@shared/components/enterprise-paginator/enterprise-paginator.component";
import { SearchFilterToolbarComponent } from "@shared/components/search-filter-toolbar/search-filter-toolbar.component";
import { TableFeedbackComponent } from "@shared/components/table-feedback/table-feedback.component";
import { paginateTableRows, tableTotalPages } from "@shared/utils/table-state";
import { TagModule } from "primeng/tag";

interface RoleSummary {
  type: string;
  members: number;
  totalRevenue: number;
  averageOnTime: number;
}

@Component({
  selector: "app-team-performance-report",
  standalone: true,
  imports: [
    CommonModule,
    DataTableToolbarComponent,
    SearchFilterToolbarComponent,
    EnterprisePaginatorComponent,
    TableFeedbackComponent,
    AppButtonComponent,
    TagModule,
  ],
  templateUrl: "./team-performance-report.component.html",
  styleUrl: "./team-performance-report.component.scss",
})
export class TeamPerformanceReportComponent {
  private readonly rolePresentation: Record<
    string,
    { label: string; description: string }
  > = {
    Planner: {
      label: "Case Planning",
      description: "Treatment intake and digital case preparation",
    },
    Designer: {
      label: "Dental CAD Design",
      description: "Restoration and appliance design delivery",
    },
    Production: {
      label: "Production Operations",
      description: "Manufacturing readiness and release workflow",
    },
    "Quality Control": {
      label: "Quality Assurance",
      description: "Clinical and technical validation checkpoints",
    },
    Support: {
      label: "Client Support",
      description: "Doctor communication and post-delivery support",
    },
  };

  private readonly reportingData = inject(ReportingDataService);
  private readonly navigationService = inject(NavigationService);
  protected readonly formatUtils = inject(FormatUtils);

  readonly loading = this.reportingData.loading;
  readonly records = this.reportingData.teamPerformance;

  readonly search = signal("");
  readonly typeFilter = signal("");
  readonly page = signal(1);
  readonly pageSize = 12;

  readonly typeOptions = computed(() =>
    Array.from(new Set(this.records().map((record) => record.type))).sort(
      (a, b) => a.localeCompare(b),
    ),
  );

  readonly filtered = computed<TeamPerformanceRecord[]>(() => {
    const query = this.search().trim().toLowerCase();
    const selectedType = this.typeFilter().trim();

    let rows = this.records().filter((record) => {
      if (!query) return true;
      return (
        record.fullName.toLowerCase().includes(query) ||
        record.type.toLowerCase().includes(query) ||
        String(record.userId).includes(query)
      );
    });

    if (selectedType) {
      rows = rows.filter((record) => record.type === selectedType);
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
  readonly showPaginator = computed(() => this.totalPages() > 1);

  readonly summary = computed(() => {
    const rows = this.filtered();
    const active = rows.filter((row) => row.status === "Active").length;
    const totalRevenue = rows.reduce(
      (sum, row) => sum + row.revenueCollected,
      0,
    );
    const totalCompleted = rows.reduce(
      (sum, row) => sum + row.completedOrders,
      0,
    );
    const averageOnTime =
      rows.length === 0
        ? 0
        : Math.round(
            rows.reduce((sum, row) => sum + row.onTimeRate, 0) / rows.length,
          );

    return {
      members: rows.length,
      active,
      totalRevenue,
      totalCompleted,
      averageOnTime,
    };
  });

  readonly topPerformer = computed<TeamPerformanceRecord | null>(() => {
    const rows = this.filtered();
    if (rows.length === 0) return null;
    return rows.reduce((best, current) =>
      current.revenueCollected > best.revenueCollected ? current : best,
    );
  });

  readonly roleSummaries = computed<RoleSummary[]>(() => {
    const buckets = new Map<
      string,
      { members: number; totalRevenue: number; onTimeTotal: number }
    >();

    for (const record of this.filtered()) {
      const current = buckets.get(record.type);
      if (current) {
        current.members += 1;
        current.totalRevenue += record.revenueCollected;
        current.onTimeTotal += record.onTimeRate;
      } else {
        buckets.set(record.type, {
          members: 1,
          totalRevenue: record.revenueCollected,
          onTimeTotal: record.onTimeRate,
        });
      }
    }

    return Array.from(buckets.entries())
      .map(([type, values]) => ({
        type,
        members: values.members,
        totalRevenue: values.totalRevenue,
        averageOnTime: Math.round(values.onTimeTotal / values.members),
      }))
      .sort((left, right) => right.totalRevenue - left.totalRevenue);
  });

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

  goToReportsHub(): void {
    this.navigationService.navigate("reports");
  }

  onPageNumberChange(pageNumber: number): void {
    this.page.set(pageNumber);
  }

  performanceScore(record: TeamPerformanceRecord): number {
    const turnaroundScore = Math.max(0, 100 - record.avgTurnaroundDays * 18);
    return Math.round(record.onTimeRate * 0.7 + turnaroundScore * 0.3);
  }

  roleRevenueShare(role: RoleSummary): number {
    const total = this.summary().totalRevenue;
    if (total === 0) return 0;
    return Math.round((role.totalRevenue / total) * 100);
  }

  roleLabel(type: string): string {
    return this.rolePresentation[type]?.label ?? type;
  }

  roleDescription(type: string): string {
    return this.rolePresentation[type]?.description ?? "Core team function";
  }

  clampedPercent(value: number): number {
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  progressColor(value: number, context: "onTime" | "share" = "onTime"): string {
    const percent = this.clampedPercent(value);

    if (context === "share") {
      if (percent >= 40) return "#1D4ED8";
      if (percent >= 20) return "#2563EB";
      return "#60A5FA";
    }

    if (percent >= 90) return "#16A34A";
    if (percent >= 75) return "#0EA5E9";
    if (percent >= 55) return "#F59E0B";
    return "#EF4444";
  }
}
