import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderDataService } from '@core/services/order-data.service';
import { NavigationService } from '@core/services/navigation.service';
import { FormatUtils } from '@core/services/format-utils.service';
import { Order, OrderStatus, Priority } from '@core/models';
import { ArchBadgeComponent } from '@shared/components/arch-badge/arch-badge.component';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    CommonModule,
    ArchBadgeComponent,
    StatusBadgeComponent
  ],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss'
})
export class OrdersComponent {
  private readonly orderService = inject(OrderDataService);
  protected readonly navigationService = inject(NavigationService);
  protected readonly formatUtils = inject(FormatUtils);

  readonly orders = this.orderService.orders;
  readonly loading = this.orderService.loading;
  readonly error = this.orderService.error;

  readonly STATUS_OPTIONS: OrderStatus[] = ['New', 'Review', 'Design', 'Production', 'Quality Check', 'Ready', 'Completed', 'Cancelled'];
  readonly PRIORITY_OPTIONS: Priority[] = ['Low', 'Normal', 'High', 'Urgent'];
  readonly PAGE_SIZES = [10, 25, 50];
  readonly tableStates = ['normal', 'loading', 'empty', 'error'] as const;

  readonly search = signal('');
  readonly statusFilter = signal<OrderStatus[]>([]);
  readonly priorityFilter = signal<Priority | ''>('');
  readonly selected = signal<Set<string>>(new Set());
  readonly page = signal(1);
  readonly pageSize = signal(25);
  readonly sortCol = signal<keyof Order | ''>('receivedAt');
  readonly sortDir = signal<'asc' | 'desc'>('desc');
  readonly showFilters = signal(false);
  readonly tableState = signal<'normal' | 'loading' | 'empty' | 'error'>('normal');

  readonly filtered = computed(() => {
    let result = [...this.orders()];
    const search = this.search();
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(o =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.patientName.toLowerCase().includes(q) ||
        o.doctorName.toLowerCase().includes(q) ||
        o.clinicName.toLowerCase().includes(q)
      );
    }
    if (this.statusFilter().length > 0) result = result.filter(o => this.statusFilter().includes(o.status));
    if (this.priorityFilter()) result = result.filter(o => o.priority === this.priorityFilter());
    if (this.sortCol()) {
      result.sort((a, b) => {
        const av = (a as any)[this.sortCol()!] ?? '';
        const bv = (b as any)[this.sortCol()!] ?? '';
        const cmp = String(av).localeCompare(String(bv));
        return this.sortDir() === 'asc' ? cmp : -cmp;
      });
    }
    return result;
  });

  readonly totalPages = computed(() => Math.ceil(this.filtered().length / this.pageSize()));
  readonly pageData = computed(() => this.filtered().slice((this.page() - 1) * this.pageSize(), this.page() * this.pageSize()));

  readonly activeFilters = computed(() => [
    ...this.statusFilter().map(s => ({ type: 'status' as const, label: s })),
    ...(this.priorityFilter() ? [{ type: 'priority' as const, label: this.priorityFilter() }] : []),
  ]);

  toggleSort(col: keyof Order): void {
    if (this.sortCol() === col) this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    else { this.sortCol.set(col); this.sortDir.set('asc'); }
  }

  toggleSelect(id: string): void {
    this.selected.update(current => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  toggleAll(): void {
    this.selected.update(current => {
      if (current.size === this.pageData().length) return new Set();
      return new Set(this.pageData().map(o => o.id));
    });
  }

  removeFilter(type: string, val?: string): void {
    if (type === 'status' && val) this.statusFilter.update(f => f.filter(s => s !== val));
    if (type === 'priority') this.priorityFilter.set('');
  }

  clearFilters(): void {
    this.statusFilter.set([]);
    this.priorityFilter.set('');
  }

  clearAllFilters(): void {
    this.search.set('');
    this.statusFilter.set([]);
    this.priorityFilter.set('');
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.search.set(target.value);
    this.page.set(1);
  }

  onStatusFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value as OrderStatus;
    if (value && !this.statusFilter().includes(value)) {
      this.statusFilter.update(f => [...f, value]);
    }
    this.page.set(1);
  }

  onPriorityFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.priorityFilter.set(target.value as Priority | '');
    this.page.set(1);
  }

  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.pageSize.set(Number(target.value));
    this.page.set(1);
  }

  onSelectClick(event: Event, id: string): void {
    event.stopPropagation();
    this.toggleSelect(id);
  }

  onShowFiltersToggle(): void {
    this.showFilters.update(v => !v);
  }

  prevPage(): void {
    this.page.update(p => Math.max(1, p - 1));
  }

  nextPage(): void {
    this.page.update(p => Math.min(this.totalPages(), p + 1));
  }

  goToPage(pg: number): void {
    this.page.set(pg);
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.page();
    const maxPages = 7;
    let start = Math.max(1, current - Math.floor(maxPages / 2));
    let end = Math.min(total, start + maxPages - 1);
    if (end - start + 1 < maxPages) {
      start = Math.max(1, end - maxPages + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  getSortIcon(col: keyof Order): string {
    if (this.sortCol() !== col) {
      return this.getIconSvg('arrow-up-down');
    }
    return this.sortDir() === 'asc' ? this.getIconSvg('arrow-up') : this.getIconSvg('arrow-down');
  }

  navigateToCreateOrder(): void {
    this.navigationService.navigate('createOrder');
  }

  navigateToOrder(orderId: string): void {
    this.navigationService.navigate('viewOrder', { orderId });
  }

  navigateToEditOrder(orderId: string): void {
    this.navigationService.navigate('editOrder', { orderId });
  }

  refresh(): void {
    this.orderService.loadOrders();
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }

  getIconSvg(name: string): string {
    const icons: Record<string, string> = {
      plus: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
      'refresh-cw': '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"></polyline><polyline points="23 20 23 14 17 14"></polyline><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4L1 10m-1.49 4.36A9 9 0 0 1 18.36 18.36"></path></svg>',
      search: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35"></path></svg>',
      x: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
      'chevron-down': '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>',
      'sliders-horizontal': '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>',
      'file-text': '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>',
      'arrow-up-down': '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 5 5 12"></polyline><polyline points="5 19 12 12 19 19"></polyline></svg>',
      'arrow-up': '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>',
      'arrow-down': '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>',
      'chevron-left': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>',
      'chevron-right': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>',
      lock: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>',
      unlock: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path><line x1="8" y1="11" x2="8" y2="18"></line><line x1="16" y1="11" x2="16" y2="18"></line></svg>',
      eye: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
      'edit-2': '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>',
      'more-horizontal': '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>',
      checkSquare: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>',
      square: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>'
    };
    return icons[name] || '';
  }
}