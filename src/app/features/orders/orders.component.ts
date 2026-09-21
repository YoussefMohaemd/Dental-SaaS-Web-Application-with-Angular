import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { OrderDataService } from '@core/services/order-data.service';
import { NavigationService } from '@core/services/navigation.service';
import { FormatUtils } from '@core/services/format-utils.service';
import { Order, OrderStatus, Priority } from '@core/models';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { PriorityBadgeComponent } from '@shared/components/priority-badge/priority-badge.component';
import { ArchBadgeComponent } from '@shared/components/arch-badge/arch-badge.component';
import { ButtonComponent } from '@shared/components/button/button.component';

export type OrdersViewState = 'normal' | 'loading' | 'empty' | 'error';

const PAGE_SIZES = [10, 25, 50];
const STATUS_OPTIONS: OrderStatus[] = ['New', 'Review', 'Design', 'Production', 'Quality Check', 'Ready', 'Completed', 'Cancelled'];
const PRIORITY_OPTIONS: Priority[] = ['Low', 'Normal', 'High', 'Urgent'];

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, TableModule, StatusBadgeComponent, ArchBadgeComponent, ButtonComponent],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss'
})
export class OrdersComponent {
  private readonly orderService = inject(OrderDataService);
  protected readonly navigationService = inject(NavigationService);
  protected readonly formatUtils = inject(FormatUtils);

  readonly orders = this.orderService.orders;

  readonly search = signal('');
  readonly statusFilter = signal<OrderStatus[]>([]);
  readonly priorityFilter = signal<Priority | ''>('');
  readonly selectedIds = signal<Set<string>>(new Set());
  readonly page = signal(1);
  readonly pageSize = signal(25);
  readonly sortColumn = signal<keyof Order | ''>('receivedAt');
  readonly sortDirection = signal<'asc' | 'desc'>('desc');
  readonly viewState = signal<OrdersViewState>('normal');
  readonly advancedFilters = signal(false);

  readonly pageSizes = PAGE_SIZES;
  readonly statusOptions = STATUS_OPTIONS;
  readonly priorityOptions = PRIORITY_OPTIONS;

  readonly filtered = computed(() => {
    let result = [...this.orders()];
    const query = this.search().trim().toLowerCase();
    if (query) {
      result = result.filter(order =>
        order.orderNumber.toLowerCase().includes(query) ||
        order.patientName.toLowerCase().includes(query) ||
        order.doctorName.toLowerCase().includes(query) ||
        order.clinicName.toLowerCase().includes(query)
      );
    }
    if (this.statusFilter().length > 0) result = result.filter(order => this.statusFilter().includes(order.status));
    if (this.priorityFilter()) result = result.filter(order => order.priority === this.priorityFilter());
    const column = this.sortColumn();
    if (column) {
      const direction = this.sortDirection() === 'asc' ? 1 : -1;
      result.sort((a, b) => String(a[column] ?? '').localeCompare(String(b[column] ?? '')) * direction);
    }
    return result;
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize())));
  readonly pageData = computed(() => {
    if (this.viewState() !== 'normal') return [];
    return this.filtered().slice((this.page() - 1) * this.pageSize(), this.page() * this.pageSize());
  });

  readonly activeFilters = computed(() => [
    ...this.statusFilter().map(status => ({ type: 'status' as const, label: status })),
    ...(this.priorityFilter() ? [{ type: 'priority' as const, label: this.priorityFilter() as string }] : [])
  ]);

  readonly allPageSelected = computed(() => {
    const pageIds = this.pageData().map(order => order.id);
    return pageIds.length > 0 && pageIds.every(id => this.selectedIds().has(id));
  });

  toggleSort(column: keyof Order): void {
    if (this.sortColumn() === column) this.sortDirection.update(direction => (direction === 'asc' ? 'desc' : 'asc'));
    else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  sortIcon(column: keyof Order): string {
    if (this.sortColumn() !== column) return '↕';
    return this.sortDirection() === 'asc' ? '↑' : '↓';
  }

  onSearchChange(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
    this.page.set(1);
  }

  clearSearch(): void {
    this.search.set('');
    this.page.set(1);
  }

  addStatusFilter(status: OrderStatus): void {
    if (!status || this.statusFilter().includes(status)) return;
    this.statusFilter.update(current => [...current, status]);
    this.page.set(1);
  }

  onPriorityChange(event: Event): void {
    this.priorityFilter.set((event.target as HTMLSelectElement).value as Priority | '');
    this.page.set(1);
  }

  onPageSizeChange(event: Event): void {
    this.pageSize.set(Number((event.target as HTMLSelectElement).value));
    this.page.set(1);
  }

  removeFilter(type: 'status' | 'priority', label?: string): void {
    if (type === 'status' && label) this.statusFilter.update(current => current.filter(status => status !== label));
    if (type === 'priority') this.priorityFilter.set('');
    this.page.set(1);
  }

  clearAllFilters(): void {
    this.search.set('');
    this.statusFilter.set([]);
    this.priorityFilter.set('');
    this.page.set(1);
  }

  toggleSelect(orderId: string): void {
    this.selectedIds.update(current => {
      const next = new Set(current);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  }

  toggleSelectAll(): void {
    const pageIds = this.pageData().map(order => order.id);
    const allSelected = pageIds.every(id => this.selectedIds().has(id));
    this.selectedIds.update(current => {
      const next = new Set(current);
      if (allSelected) pageIds.forEach(id => next.delete(id));
      else pageIds.forEach(id => next.add(id));
      return next;
    });
  }

  isSelected(orderId: string): boolean {
    return this.selectedIds().has(orderId);
  }

  toggleAdvancedFilters(): void {
    this.advancedFilters.update(value => !value);
  }

  setViewState(state: OrdersViewState): void {
    this.viewState.set(state);
  }

  simulateRefresh(): void {
    this.viewState.set('loading');
    window.setTimeout(() => this.viewState.set('normal'), 1200);
  }

  retryLoad(): void {
    this.viewState.set('normal');
  }

  prevPage(): void {
    this.page.update(current => Math.max(1, current - 1));
  }

  nextPage(): void {
    this.page.update(current => Math.min(this.totalPages(), current + 1));
  }

  goToPage(target: number): void {
    this.page.set(target);
  }

  visiblePageNumbers(): number[] {
    const total = this.totalPages();
    const count = Math.min(total, 7);
    return Array.from({ length: count }, (_, index) => index + 1);
  }

  rangeStart(): number {
    return this.filtered().length === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1;
  }

  rangeEnd(): number {
    return Math.min(this.page() * this.pageSize(), this.filtered().length);
  }

  openOrder(orderId: string): void {
    this.navigationService.navigate('viewOrder', { orderId });
  }

  openPatient(patientId: string): void {
    this.navigationService.navigate('patientDetails', { patientId });
  }

  openDoctor(doctorId: string): void {
    this.navigationService.navigate('doctorDetails', { doctorId });
  }

  editOrder(orderId: string): void {
    this.navigationService.navigate('editOrder', { orderId });
  }

  createOrder(): void {
    this.navigationService.navigate('createOrder');
  }

  shorten(value: string, maxLength: number): string {
    return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;
  }

  changeRequestClasses(changeRequest: string): string {
    if (changeRequest === 'Pending Review') return 'bg-amber-50 text-amber-700';
    if (changeRequest === 'In Progress') return 'bg-blue-50 text-blue-700';
    return 'bg-emerald-50 text-emerald-700';
  }
}
