import { Component, computed, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CaseDataService } from "@core/services/case-data.service";
import { NavigationService } from "@core/services/navigation.service";
import { FormatUtils } from "@core/services/format-utils.service";
import { Case, CaseStatus, Priority } from "@core/models";
import { StatusBadgeComponent } from "@shared/components/status-badge/status-badge.component";
import { PriorityBadgeComponent } from "@shared/components/priority-badge/priority-badge.component";
import { ButtonComponent } from "@shared/components/button/button.component";
import { SafeHtmlPipe } from "../../shared/pipes/safe-html.pipe";

type ViewMode = "table" | "grid";

@Component({
  selector: "app-cases",
  standalone: true,
  imports: [
    CommonModule,
    StatusBadgeComponent,
    PriorityBadgeComponent,
    ButtonComponent,
    SafeHtmlPipe,
  ],
  templateUrl: "./cases.component.html",
  styleUrl: "./cases.component.scss",
})
export class CasesComponent {
  private readonly caseService = inject(CaseDataService);
  protected readonly navigationService = inject(NavigationService);
  protected readonly formatUtils = inject(FormatUtils);

  readonly cases = this.caseService.cases;
  readonly loading = this.caseService.loading;

  readonly STATUS_OPTIONS: CaseStatus[] = [
    "Open",
    "In Progress",
    "Review",
    "Closed",
  ];
  readonly PRIORITY_OPTIONS: Priority[] = ["Low", "Normal", "High", "Urgent"];

  readonly view = signal<ViewMode>("table");
  readonly search = signal("");
  readonly statusFilter = signal<CaseStatus | "">("");
  readonly page = signal(1);
  readonly pageSize = 12;

  readonly filtered = computed(() => {
    let result = [...this.cases()];
    const search = this.search();
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.patientName.toLowerCase().includes(q) ||
          c.caseNumber.toLowerCase().includes(q),
      );
    }
    if (this.statusFilter())
      result = result.filter((c) => c.status === this.statusFilter());
    return result;
  });

  readonly totalPages = computed(() =>
    Math.ceil(this.filtered().length / this.pageSize),
  );
  readonly pageData = computed(() =>
    this.filtered().slice(
      (this.page() - 1) * this.pageSize,
      this.page() * this.pageSize,
    ),
  );

  setView(mode: ViewMode): void {
    this.view.set(mode);
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.search.set(target.value);
    this.page.set(1);
  }

  onStatusFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.statusFilter.set(target.value as CaseStatus | "");
    this.page.set(1);
  }

  prevPage(): void {
    this.page.update((p) => Math.max(1, p - 1));
  }

  nextPage(): void {
    this.page.update((p) => Math.min(this.totalPages(), p + 1));
  }

  goToPage(pg: number): void {
    this.page.set(pg);
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.page();
    const maxPages = 5;
    let start = Math.max(1, current - Math.floor(maxPages / 2));
    let end = Math.min(total, start + maxPages - 1);
    if (end - start + 1 < maxPages) {
      start = Math.max(1, end - maxPages + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  navigateToCreateOrder(): void {
    this.navigationService.navigate("createOrder");
  }

  navigateToCase(caseId: string): void {
    this.navigationService.navigate("caseDetails", { caseId });
  }

  getIconSvg(name: string): string {
    const icons: Record<string, string> = {
      plus: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
      search:
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35"></path></svg>',
      list: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>',
      "grid-3x3":
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect></svg>',
      "chevron-left":
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>',
      "chevron-right":
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>',
      "folder-open":
        '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"></path></svg>',
    };
    return icons[name] || "";
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }
}
