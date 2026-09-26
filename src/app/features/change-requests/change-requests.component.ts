import { Component, computed, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TableModule } from "primeng/table";
import { ChangeRequestDataService } from "@core/services/change-request-data.service";
import { NavigationService } from "@core/services/navigation.service";
import { FormatUtils } from "@core/services/format-utils.service";
import { ChangeRequest } from "@core/models";
import { AppButtonComponent } from "@shared/components/button/button.component";
import { EnterprisePaginatorComponent } from "@shared/components/enterprise-paginator/enterprise-paginator.component";
import { DataTableToolbarComponent } from "@shared/components/data-table-toolbar/data-table-toolbar.component";
import { SearchFilterToolbarComponent } from "@shared/components/search-filter-toolbar/search-filter-toolbar.component";
import { TableFeedbackComponent } from "@shared/components/table-feedback/table-feedback.component";
import { SafeHtmlPipe } from "../../shared/pipes/safe-html.pipe";
import { PriorityBadgeComponent } from "@shared/components/priority-badge/priority-badge.component";

@Component({
  selector: "app-change-requests",
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    AppButtonComponent,
    EnterprisePaginatorComponent,
    DataTableToolbarComponent,
    SearchFilterToolbarComponent,
    TableFeedbackComponent,
    SafeHtmlPipe,
    PriorityBadgeComponent,
  ],
  templateUrl: "./change-requests.component.html",
  styleUrl: "./change-requests.component.scss",
})
export class ChangeRequestsComponent {
  private readonly changeRequestService = inject(ChangeRequestDataService);
  protected readonly navigationService = inject(NavigationService);
  protected readonly formatUtils = inject(FormatUtils);

  readonly requests = this.changeRequestService.changeRequests;
  readonly loading = this.changeRequestService.loading;
  readonly search = signal("");
  readonly statusFilter = signal<ChangeRequest["status"] | "">("");
  readonly page = signal(1);
  readonly pageSize = 10;

  readonly filtered = computed(() => {
    let result = [...this.requests()];
    const query = this.search().trim().toLowerCase();
    if (query) {
      result = result.filter(
        (r) =>
          r.requestNumber.toLowerCase().includes(query) ||
          r.orderNumber.toLowerCase().includes(query) ||
          r.patientName.toLowerCase().includes(query) ||
          r.requester.toLowerCase().includes(query),
      );
    }
    if (this.statusFilter())
      result = result.filter((r) => r.status === this.statusFilter());
    return result;
  });

  readonly pendingCount = computed(
    () => this.requests().filter((r) => r.status === "Pending").length,
  );
  readonly inReviewCount = computed(
    () => this.requests().filter((r) => r.status === "In Review").length,
  );
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / this.pageSize)),
  );
  readonly pageData = computed(() =>
    this.filtered().slice(
      (this.page() - 1) * this.pageSize,
      this.page() * this.pageSize,
    ),
  );

  onSearchChange(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
    this.page.set(1);
  }

  onSearchValueChange(value: string): void {
    this.search.set(value);
    this.page.set(1);
  }

  onStatusChange(event: Event): void {
    this.statusFilter.set(
      (event.target as HTMLSelectElement).value as ChangeRequest["status"] | "",
    );
    this.page.set(1);
  }

  onStatusValueChange(value: string): void {
    this.statusFilter.set(value as ChangeRequest["status"] | "");
    this.page.set(1);
  }

  clearFilters(): void {
    this.search.set("");
    this.statusFilter.set("");
    this.page.set(1);
  }

  prevPage(): void {
    this.page.update((p) => Math.max(1, p - 1));
  }

  nextPage(): void {
    this.page.update((p) => Math.min(this.totalPages(), p + 1));
  }

  goToPage(target: number): void {
    this.page.set(target);
  }

  onPageNumberChange(pageNumber: number): void {
    this.page.set(pageNumber);
  }

  pageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.page();
    const start = Math.max(1, Math.min(current - 2, total - 4));
    const end = Math.min(total, start + 4);
    return Array.from(
      { length: Math.max(0, end - start + 1) },
      (_, i) => start + i,
    );
  }

  openOrder(orderId: string): void {
    this.navigationService.navigate("viewOrder", { orderId });
  }

  approve(requestId: string): void {
    this.changeRequestService.updateStatus(requestId, "Approved");
  }

  reject(requestId: string): void {
    this.changeRequestService.updateStatus(requestId, "Rejected");
  }

  getIconSvg(name: string): string {
    const icons: Record<string, string> = {
      search:
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>',
      refresh:
        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.23 4.27A9 9 0 0 1 3.51 15"/></svg>',
      "refresh-lg":
        '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.23 4.27A9 9 0 0 1 3.51 15"/></svg>',
      "chevron-left":
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
      "chevron-right":
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
    };
    return icons[name] || "";
  }

  isActionable(status: ChangeRequest["status"]): boolean {
    return status === "Pending" || status === "In Review";
  }

  statusClasses(status: ChangeRequest["status"]): string {
    if (status === "Pending") return "enterprise-status-pending";
    if (status === "In Review") return "enterprise-status-in-review";
    if (status === "Approved") return "enterprise-status-approved";
    if (status === "Rejected") return "enterprise-status-rejected";
    return "enterprise-status-completed";
  }
}
