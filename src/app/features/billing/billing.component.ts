import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { BillingDataService } from '@core/services/billing-data.service';
import { NavigationService } from '@core/services/navigation.service';
import { FormatUtils } from '@core/services/format-utils.service';
import { BillingRecord } from '@core/models';
import { ButtonComponent } from '@shared/components/button/button.component';

type BillingSortColumn = 'orderNumber' | 'patientName' | 'amount' | 'dueDate' | 'invoiceDate';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonComponent],
  templateUrl: './billing.component.html',
  styleUrl: './billing.component.scss'
})
export class BillingComponent {
  private readonly billingService = inject(BillingDataService);
  protected readonly navigationService = inject(NavigationService);
  protected readonly formatUtils = inject(FormatUtils);

  readonly records = this.billingService.records;
  readonly search = signal('');
  readonly statusFilter = signal<BillingRecord['status'] | ''>('');
  readonly page = signal(1);
  readonly pageSize = 15;
  readonly sortColumn = signal<BillingSortColumn>('dueDate');
  readonly sortDirection = signal<'asc' | 'desc'>('desc');

  readonly statusOptions: (BillingRecord['status'] | '')[] = ['', 'Pending', 'Invoiced', 'Paid', 'Overdue', 'Cancelled'];

  readonly filtered = computed(() => {
    let result = [...this.records()];
    const query = this.search().trim().toLowerCase();
    if (query) {
      result = result.filter(r =>
        r.orderNumber.toLowerCase().includes(query) ||
        r.patientName.toLowerCase().includes(query) ||
        r.clinicName.toLowerCase().includes(query) ||
        (r.invoiceNumber ?? '').toLowerCase().includes(query)
      );
    }
    if (this.statusFilter()) result = result.filter(r => r.status === this.statusFilter());
    const column = this.sortColumn();
    const direction = this.sortDirection() === 'asc' ? 1 : -1;
    result.sort((a, b) => String(a[column] ?? '').localeCompare(String(b[column] ?? '')) * direction);
    return result;
  });

  readonly totalValue = computed(() => this.records().reduce((sum, r) => sum + r.amount, 0));
  readonly collectedValue = computed(() => this.records().filter(r => r.status === 'Paid').reduce((sum, r) => sum + r.amount, 0));
  readonly pendingValue = computed(() => this.records().filter(r => r.status === 'Pending').reduce((sum, r) => sum + r.amount, 0));
  readonly overdueCount = computed(() => this.records().filter(r => r.status === 'Overdue').length);

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));
  readonly pageData = computed(() => this.filtered().slice((this.page() - 1) * this.pageSize, this.page() * this.pageSize));

  toggleSort(column: BillingSortColumn): void {
    if (this.sortColumn() === column) this.sortDirection.update(d => (d === 'asc' ? 'desc' : 'asc'));
    else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  sortIcon(column: BillingSortColumn): string {
    if (this.sortColumn() !== column) return '↕';
    return this.sortDirection() === 'asc' ? '↑' : '↓';
  }

  onSearchChange(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
    this.page.set(1);
  }

  onStatusChange(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value as BillingRecord['status'] | '');
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

  rangeStart(): number {
    return this.filtered().length === 0 ? 0 : (this.page() - 1) * this.pageSize + 1;
  }

  rangeEnd(): number {
    return Math.min(this.page() * this.pageSize, this.filtered().length);
  }

  openOrder(orderId: string): void {
    this.navigationService.navigate('viewOrder', { orderId });
  }

  exportRecords(): void {
    // Static prototype: export affordance only.
  }

  statusClasses(status: BillingRecord['status']): string {
    if (status === 'Paid') return 'bg-emerald-50 text-emerald-700';
    if (status === 'Overdue') return 'bg-red-50 text-red-700';
    if (status === 'Invoiced') return 'bg-blue-50 text-blue-700';
    if (status === 'Cancelled') return 'bg-muted text-muted-foreground';
    return 'bg-amber-50 text-amber-700';
  }
}
