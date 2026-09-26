import { Component, computed, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { TableModule } from "primeng/table";
import { BillingDataService } from "@core/services/billing-data.service";
import { NavigationService } from "@core/services/navigation.service";
import { FormatUtils } from "@core/services/format-utils.service";
import { BillingRecord } from "@core/models";
import { AppButtonComponent } from "@shared/components/button/button.component";
import { EnterprisePaginatorComponent } from "@shared/components/enterprise-paginator/enterprise-paginator.component";
import { DataTableToolbarComponent } from "@shared/components/data-table-toolbar/data-table-toolbar.component";
import { SearchFilterToolbarComponent } from "@shared/components/search-filter-toolbar/search-filter-toolbar.component";
import { TableFeedbackComponent } from "@shared/components/table-feedback/table-feedback.component";
import { SafeHtmlPipe } from "../../shared/pipes/safe-html.pipe";
import {
  buildSortAriaLabel,
  sortAriaValue,
  SortAriaValue,
} from "@shared/utils/sort-a11y";

type BillingSortColumn =
  "orderNumber" | "patientName" | "amount" | "dueDate" | "invoiceDate";

@Component({
  selector: "app-billing",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    AppButtonComponent,
    EnterprisePaginatorComponent,
    DataTableToolbarComponent,
    SearchFilterToolbarComponent,
    TableFeedbackComponent,
    SafeHtmlPipe,
  ],
  templateUrl: "./billing.component.html",
  styleUrl: "./billing.component.scss",
})
export class BillingComponent {
  private readonly billingService = inject(BillingDataService);
  protected readonly navigationService = inject(NavigationService);
  protected readonly formatUtils = inject(FormatUtils);

  readonly records = this.billingService.records;
  readonly loading = this.billingService.loading;
  readonly search = signal("");
  readonly statusFilter = signal<BillingRecord["status"] | "">("");
  readonly page = signal(1);
  readonly pageSize = 15;
  readonly sortColumn = signal<BillingSortColumn>("dueDate");
  readonly sortDirection = signal<"asc" | "desc">("desc");

  readonly statusOptions: (BillingRecord["status"] | "")[] = [
    "",
    "Pending",
    "Invoiced",
    "Paid",
    "Overdue",
    "Cancelled",
  ];

  readonly filtered = computed(() => {
    let result = [...this.records()];
    const query = this.search().trim().toLowerCase();
    if (query) {
      result = result.filter(
        (r) =>
          r.orderNumber.toLowerCase().includes(query) ||
          r.patientName.toLowerCase().includes(query) ||
          r.clinicName.toLowerCase().includes(query) ||
          (r.invoiceNumber ?? "").toLowerCase().includes(query),
      );
    }
    if (this.statusFilter())
      result = result.filter((r) => r.status === this.statusFilter());
    const column = this.sortColumn();
    const direction = this.sortDirection() === "asc" ? 1 : -1;
    result.sort(
      (a, b) =>
        String(a[column] ?? "").localeCompare(String(b[column] ?? "")) *
        direction,
    );
    return result;
  });

  readonly totalValue = computed(() =>
    this.records().reduce((sum, r) => sum + r.amount, 0),
  );
  readonly collectedValue = computed(() =>
    this.records()
      .filter((r) => r.status === "Paid")
      .reduce((sum, r) => sum + r.amount, 0),
  );
  readonly pendingValue = computed(() =>
    this.records()
      .filter((r) => r.status === "Pending")
      .reduce((sum, r) => sum + r.amount, 0),
  );
  readonly overdueCount = computed(
    () => this.records().filter((r) => r.status === "Overdue").length,
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

  toggleSort(column: BillingSortColumn): void {
    if (this.sortColumn() === column)
      this.sortDirection.update((d) => (d === "asc" ? "desc" : "asc"));
    else {
      this.sortColumn.set(column);
      this.sortDirection.set("asc");
    }
  }

  sortAriaSort(column: BillingSortColumn): SortAriaValue {
    return sortAriaValue(this.sortColumn() === column, this.sortDirection());
  }

  sortAriaLabel(column: BillingSortColumn, label: string): string {
    return buildSortAriaLabel(
      label,
      this.sortColumn() === column,
      this.sortDirection(),
    );
  }

  sortIcon(column: BillingSortColumn): string {
    const active = this.sortColumn() === column;
    const dir = this.sortDirection();
    const common =
      'width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"';
    if (!active) {
      return `<svg ${common}><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>`;
    }
    if (dir === "asc") {
      return `<svg ${common}><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>`;
    }
    return `<svg ${common}><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>`;
  }

  sortIconActive(column: BillingSortColumn): boolean {
    return this.sortColumn() === column;
  }

  getIconSvg(name: string): string {
    const icons: Record<string, string> = {
      search:
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>',
      download:
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
      "chevron-left":
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
      "chevron-right":
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
      receipt:
        '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M8 15h5"/></svg>',
      loader:
        '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.22-8.56"/></svg>',
    };
    return icons[name] || "";
  }

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
      (event.target as HTMLSelectElement).value as BillingRecord["status"] | "",
    );
    this.page.set(1);
  }

  onStatusValueChange(value: string): void {
    this.statusFilter.set(value as BillingRecord["status"] | "");
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

  rangeStart(): number {
    return this.filtered().length === 0
      ? 0
      : (this.page() - 1) * this.pageSize + 1;
  }

  rangeEnd(): number {
    return Math.min(this.page() * this.pageSize, this.filtered().length);
  }

  openOrder(orderId: string): void {
    this.navigationService.navigate("viewOrder", { orderId });
  }

  exportRecords(): void {
    const rows = this.filtered();
    const header = [
      "Order #",
      "Patient",
      "Doctor",
      "Clinic",
      "Invoice #",
      "Amount",
      "Status",
      "Due Date",
    ];
    const escape = (value: unknown): string => {
      const text = String(value ?? "");
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    const lines = [
      header.join(","),
      ...rows.map((r) =>
        [
          escape(r.orderNumber),
          escape(r.patientName),
          escape(r.doctorName),
          escape(r.clinicName),
          escape(r.invoiceNumber),
          escape(r.amount),
          escape(r.status),
          escape(r.dueDate),
        ].join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "billing.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  statusClasses(status: BillingRecord["status"]): string {
    if (status === "Paid") return "enterprise-status-approved";
    if (status === "Overdue") return "enterprise-status-rejected";
    if (status === "Invoiced") return "enterprise-status-invoiced";
    if (status === "Cancelled") return "enterprise-status-cancelled";
    return "enterprise-status-pending";
  }
}
