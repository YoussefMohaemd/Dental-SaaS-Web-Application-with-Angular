import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ChangeRequestDataService } from '@core/services/change-request-data.service';
import { NavigationService } from '@core/services/navigation.service';
import { FormatUtils } from '@core/services/format-utils.service';
import { ChangeRequest } from '@core/models';

@Component({
  selector: 'app-change-requests',
  standalone: true,
  imports: [CommonModule, TableModule],
  templateUrl: './change-requests.component.html',
  styleUrl: './change-requests.component.scss'
})
export class ChangeRequestsComponent {
  private readonly changeRequestService = inject(ChangeRequestDataService);
  protected readonly navigationService = inject(NavigationService);
  protected readonly formatUtils = inject(FormatUtils);

  readonly requests = this.changeRequestService.changeRequests;
  readonly search = signal('');
  readonly statusFilter = signal<ChangeRequest['status'] | ''>('');
  readonly page = signal(1);
  readonly pageSize = 10;

  readonly filtered = computed(() => {
    let result = [...this.requests()];
    const query = this.search().trim().toLowerCase();
    if (query) {
      result = result.filter(r =>
        r.requestNumber.toLowerCase().includes(query) ||
        r.orderNumber.toLowerCase().includes(query) ||
        r.patientName.toLowerCase().includes(query) ||
        r.requester.toLowerCase().includes(query)
      );
    }
    if (this.statusFilter()) result = result.filter(r => r.status === this.statusFilter());
    return result;
  });

  readonly pendingCount = computed(() => this.requests().filter(r => r.status === 'Pending').length);
  readonly inReviewCount = computed(() => this.requests().filter(r => r.status === 'In Review').length);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));
  readonly pageData = computed(() => this.filtered().slice((this.page() - 1) * this.pageSize, this.page() * this.pageSize));

  onSearchChange(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
    this.page.set(1);
  }

  onStatusChange(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value as ChangeRequest['status'] | '');
    this.page.set(1);
  }

  prevPage(): void {
    this.page.update(p => Math.max(1, p - 1));
  }

  nextPage(): void {
    this.page.update(p => Math.min(this.totalPages(), p + 1));
  }

  goToPage(target: number): void {
    this.page.set(target);
  }

  pageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.page();
    const start = Math.max(1, Math.min(current - 2, total - 4));
    const end = Math.min(total, start + 4);
    return Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i);
  }

  openOrder(orderId: string): void {
    this.navigationService.navigate('viewOrder', { orderId });
  }

  isActionable(status: ChangeRequest['status']): boolean {
    return status === 'Pending' || status === 'In Review';
  }

  priorityClasses(priority: ChangeRequest['priority']): string {
    if (priority === 'Urgent') return 'bg-red-500';
    if (priority === 'High') return 'bg-amber-500';
    if (priority === 'Normal') return 'bg-blue-500';
    return 'bg-slate-400';
  }

  statusClasses(status: ChangeRequest['status']): string {
    if (status === 'Pending') return 'bg-amber-50 text-amber-700';
    if (status === 'In Review') return 'bg-blue-50 text-blue-700';
    if (status === 'Rejected') return 'bg-red-50 text-red-700';
    return 'bg-emerald-50 text-emerald-700';
  }
}
