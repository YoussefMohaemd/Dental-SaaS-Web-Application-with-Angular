import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TreeTableModule } from 'primeng/treetable';
import { TreeNode } from 'primeng/api';
import { OrderDataService } from '@core/services/order-data.service';
import { SubOrderDataService } from '@core/services/sub-order-data.service';
import { NavigationService } from '@core/services/navigation.service';
import { FormatUtils } from '@core/services/format-utils.service';
import { Order, OrderStatus, Priority, SubOrder } from '@core/models';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { ArchBadgeComponent } from '@shared/components/arch-badge/arch-badge.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { SearchInputComponent } from '@shared/components/search-input/search-input.component';
import { SafeHtmlPipe } from '../../shared/pipes/safe-html.pipe';
import { lucideSvg } from '@shared/icons/lucide-icons';
import { filterTableRows } from '@shared/utils/table-state';

/**
 * TreeTable row payload — single source for the Order → Service hierarchy.
 * `kind: 'order'` renders the parent Order row; `kind: 'service'` renders a
 * child Service / Sub Order row. Transformation is strictly derived from the
 * existing Order + SubOrder services; no backend/API contract changes.
 *
 * Real business relationship: `SubOrder.orderId` → `Order.id`.
 * Only sub-orders whose `orderId` matches the parent are attached. Orders
 * without matches stay leaf rows (no expander, no fake children).
 */
export interface OrderTreeRowData {
  kind: 'order' | 'service';
  order: Order;
  subOrder?: SubOrder;
}

/** Leaf child node for one real Sub Order belonging to `order`. */
export function mapSubOrderToTreeNode(order: Order, subOrder: SubOrder): TreeNode<OrderTreeRowData> {
  return {
    key: `${order.id}-${subOrder.id}`,
    data: { kind: 'service', order, subOrder },
    leaf: true,
  };
}

/** Parent node for one Order with its real children (possibly none). */
export function mapOrderToTreeNode(
  order: Order,
  children: SubOrder[],
  expanded: boolean,
): TreeNode<OrderTreeRowData> {
  const hasKids = children.length > 0;
  return {
    key: order.id,
    data: { kind: 'order', order },
    leaf: !hasKids,
    expanded: hasKids && expanded,
    children: hasKids ? children.map(so => mapSubOrderToTreeNode(order, so)) : undefined,
  };
}

export type OrdersViewState = 'normal' | 'loading' | 'empty' | 'error';

const PAGE_SIZES = [10, 20, 30, 40, 50];

/** Must match the `treetable-row-out` CSS exit animation duration. */
const COLLAPSE_ANIMATION_MS = 220;
const STATUS_OPTIONS: OrderStatus[] = ['New', 'Review', 'Design', 'Production', 'Quality Check', 'Ready', 'Completed', 'Cancelled'];
const PRIORITY_OPTIONS: Priority[] = ['Low', 'Normal', 'High', 'Urgent'];

/** Human-readable column names for sort-button accessible labels. */
const SORT_COLUMN_LABELS: Partial<Record<keyof Order, string>> = {
  orderNumber: 'Order number',
  patientName: 'Patient',
  doctorName: 'Doctor',
  scanCenterName: 'Scan center',
  billTo: 'Bill to',
  arch: 'Maxilla/Mandible',
  restoration: 'Format and restoration',
  amount: 'Amount',
  status: 'Status',
  archiveDate: 'Archive date',
  receivedAt: 'Received date',
  sentAt: 'Sent date',
  updatedAt: 'Updated date',
  chargedAt: 'Charged date',
};

/**
 * Type-aware comparator matching React locale behavior:
 * numbers compare numerically, ISO dates compare chronologically,
 * everything else falls back to localeCompare.
 */
export function compareOrderValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  const aNum = typeof a === 'string' && a.trim() !== '' ? Number(a) : NaN;
  const bNum = typeof b === 'string' && b.trim() !== '' ? Number(b) : NaN;
  if (!Number.isNaN(aNum) && !Number.isNaN(bNum) && typeof a === typeof b) return aNum - bNum;
  const aTime = Date.parse(String(a));
  const bTime = Date.parse(String(b));
  if (!Number.isNaN(aTime) && !Number.isNaN(bTime)) return aTime - bTime;
  return String(a).localeCompare(String(b));
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, TreeTableModule, StatusBadgeComponent, ArchBadgeComponent, ButtonComponent, SearchInputComponent, SafeHtmlPipe],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss'
})
export class OrdersComponent {
  private readonly orderService = inject(OrderDataService);
  private readonly subOrderService = inject(SubOrderDataService);
  protected readonly navigationService = inject(NavigationService);
  protected readonly formatUtils = inject(FormatUtils);

  readonly orders = this.orderService.orders;
  readonly subOrders = this.subOrderService.subOrders;

  readonly search = signal('');
  readonly statusFilter = signal<OrderStatus[]>([]);
  readonly priorityFilter = signal<Priority | ''>('');
  readonly selectedIds = signal<Set<string>>(new Set());
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly sortColumn = signal<keyof Order | ''>('receivedAt');
  readonly sortDirection = signal<'asc' | 'desc'>('desc');
  readonly viewState = signal<OrdersViewState>('normal');
  readonly advancedFilters = signal(false);

  readonly pageSizes = PAGE_SIZES;
  readonly statusOptions = STATUS_OPTIONS;
  readonly priorityOptions = PRIORITY_OPTIONS;

  readonly filtered = computed(() => {
    let result = filterTableRows(this.orders(), this.search().trim(), [
      order => order.orderNumber,
      order => order.patientName,
      order => order.doctorName,
      order => order.clinicName,
    ]);
    if (this.statusFilter().length > 0) result = result.filter(order => this.statusFilter().includes(order.status));
    if (this.priorityFilter()) result = result.filter(order => order.priority === this.priorityFilter());
    const column = this.sortColumn();
    if (column) {
      const direction = this.sortDirection() === 'asc' ? 1 : -1;
      result.sort((a, b) => compareOrderValues(a[column], b[column]) * direction);
    }
    return result;
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize())));
  readonly pageData = computed(() => {
    if (this.viewState() !== 'normal') return [];
    return this.filtered().slice((this.page() - 1) * this.pageSize(), this.page() * this.pageSize());
  });

  /**
   * Expanded Order ids — the only TreeTable expansion state. Survives
   * filter/sort/page recomputations because treeNodes are rebuilt from it.
   */
  readonly expandedIds = signal<Set<string>>(new Set());

  /**
   * Orders currently playing their collapse (exit) animation. The id stays in
   * `expandedIds` until the animation finishes, so child rows remain rendered
   * with the `is-leaving` class instead of vanishing instantly (PrimeNG
   * removes collapsed rows from the DOM with no close transition of its own).
   */
  readonly collapsingIds = signal<Set<string>>(new Set());
  private readonly collapseTimers = new Map<string, number>();

  isExpanded(orderId: string): boolean {
    return this.expandedIds().has(orderId);
  }

  isCollapsing(orderId: string): boolean {
    return this.collapsingIds().has(orderId);
  }

  /**
   * Animated expand/collapse toggle (owns the TreeTable hierarchy motion).
   * Expand is instant (child rows play the CSS entrance animation on insert).
   * Collapse first flags the order as collapsing — child rows play the CSS
   * exit animation — then removes the id after COLLAPSE_ANIMATION_MS so the
   * rows unmount. Re-toggling mid-collapse cancels the pending collapse.
   * Honors prefers-reduced-motion by collapsing instantly.
   */
  toggleNodeExpand(orderId: string): void {
    if (!orderId) return;
    const pending = this.collapseTimers.get(orderId);
    if (pending !== undefined) {
      window.clearTimeout(pending);
      this.collapseTimers.delete(orderId);
      this.collapsingIds.update(current => {
        const next = new Set(current);
        next.delete(orderId);
        return next;
      });
      return;
    }
    if (this.expandedIds().has(orderId)) {
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
        this.expandedIds.update(current => {
          const next = new Set(current);
          next.delete(orderId);
          return next;
        });
        return;
      }
      this.collapsingIds.update(current => new Set(current).add(orderId));
      const timer = window.setTimeout(() => {
        this.collapseTimers.delete(orderId);
        this.collapsingIds.update(current => {
          const next = new Set(current);
          next.delete(orderId);
          return next;
        });
        this.expandedIds.update(current => {
          const next = new Set(current);
          next.delete(orderId);
          return next;
        });
      }, COLLAPSE_ANIMATION_MS);
      this.collapseTimers.set(orderId, timer);
    } else {
      this.expandedIds.update(current => new Set(current).add(orderId));
    }
  }

  /**
   * PrimeNG TreeTable value: Order (parent) → Services / Sub Orders (children).
   * Strict mapping — only sub-orders whose `orderId` matches the parent are
   * attached. Orders without children get `leaf: true` and no `children`, so
   * the toggler is hidden and no fake/empty level is created.
   */
  readonly treeNodes = computed<TreeNode<OrderTreeRowData>[]>(() => {
    const expanded = this.expandedIds();
    // Touch subOrders signal so nodes rebuild once async JSON arrives.
    const allSubs = this.subOrders();
    void allSubs;
    return this.pageData().map(order =>
      mapOrderToTreeNode(order, this.subOrdersFor(order.id), expanded.has(order.id)),
    );
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

  /**
   * React-parity sort indicator: inline SVG (Lucide ArrowUpDown / ArrowUp /
   * ArrowDown equivalents). Decorative only — always rendered with
   * aria-hidden="true"; the accessible name comes from sortAriaLabel().
   */
  sortIconSvg(column: keyof Order): string {
    const active = this.sortColumn() === column;
    const dir = this.sortDirection();
    const common = 'width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"';
    if (!active) {
      return `<svg ${common}><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>`;
    }
    if (dir === 'asc') {
      return `<svg ${common}><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>`;
    }
    return `<svg ${common}><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>`;
  }

  sortAriaSort(column: keyof Order): 'ascending' | 'descending' | 'none' {
    if (this.sortColumn() !== column) return 'none';
    return this.sortDirection() === 'asc' ? 'ascending' : 'descending';
  }

  sortAriaLabel(column: keyof Order): string {
    const label = SORT_COLUMN_LABELS[column] ?? column;
    const state = this.sortAriaSort(column);
    if (state === 'none') return `Sort by ${label}, currently unsorted`;
    return `Sort by ${label}, currently ${state}`;
  }

  onSearchChange(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
    this.page.set(1);
  }

  /** Immediate path (React parity: filter on each keystroke). Accepts the
   * emitted string or a native input Event (language-service may infer $event
   * as Event for signal outputs). */
  onSearchInput(value: string | Event): void {
    const next = typeof value === 'string' ? value : ((value.target as HTMLInputElement | null)?.value ?? '');
    this.search.set(next);
    this.page.set(1);
  }

  /** RxJS path: shared search-input emits debouncedSearch after 250ms of quiet. */
  onDebouncedSearch(value: string | Event): void {
    const next = typeof value === 'string' ? value : ((value.target as HTMLInputElement | null)?.value ?? '');
    this.search.set(next);
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

  exportCsv(): void {
    const rows = this.filtered();
    const header = ['Order #', 'Patient', 'Doctor', 'Clinic', 'Status', 'Priority', 'Restoration', 'Amount', 'Received'];
    const escape = (value: unknown): string => {
      const text = String(value ?? '');
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    const lines = [
      header.join(','),
      ...rows.map(o => [
        escape(o.orderNumber), escape(o.patientName), escape(o.doctorName),
        escape(o.clinicName), escape(o.status), escape(o.priority),
        escape(o.restoration), escape(o.amount), escape(o.receivedAt)
      ].join(','))
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'orders.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  firstPage(): void {
    this.page.set(1);
  }

  lastPage(): void {
    this.page.set(this.totalPages());
  }

  prevPage(): void {
    this.page.update(current => Math.max(1, current - 1));
  }

  nextPage(): void {
    this.page.update(current => Math.min(this.totalPages(), current + 1));
  }

  goToPage(target: number): void {
    this.page.set(Math.max(1, Math.min(this.totalPages(), target)));
  }

  visiblePageNumbers(): number[] {
    // React parity: always the first 7 page numbers (OrdersPage.tsx).
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

  openSubOrder(orderId: string, subOrderId: string): void {
    this.navigationService.navigate('subOrder', { orderId, subOrderId });
  }

  openPatient(patientId: string): void {
    this.navigationService.navigate('patientDetails', { patientId });
  }

  openDoctor(doctorId: string): void {
    this.navigationService.navigate('doctorDetails', { doctorId });
  }

  createOrder(): void {
    this.navigationService.navigate('createOrder');
  }

  /**
   * Strict child lookup — no fallback. Returns [] when the Order has no
   * Services / Sub Orders so the TreeTable renders a plain leaf row with no
   * expander and no fake children.
   */
  subOrdersFor(orderId: string): SubOrder[] {
    return this.subOrders().filter(s => s.orderId === orderId);
  }

  hasChildren(orderId: string): boolean {
    return this.subOrdersFor(orderId).length > 0;
  }

  onNodeExpand(event: { node: TreeNode<OrderTreeRowData> }): void {
    const id = event.node?.data?.order?.id ?? event.node?.key;
    if (!id) return;
    this.expandedIds.update(current => {
      const next = new Set(current);
      next.add(String(id));
      return next;
    });
  }

  onNodeCollapse(event: { node: TreeNode<OrderTreeRowData> }): void {
    const id = event.node?.data?.order?.id ?? event.node?.key;
    if (!id) return;
    this.expandedIds.update(current => {
      const next = new Set(current);
      next.delete(String(id));
      return next;
    });
  }

  subOrderStatusLabel(status: SubOrder['status']): string {
    if (status === 'completed') return 'Completed';
    if (status === 'in-progress') return 'In Progress';
    if (status === 'blocked') return 'Blocked';
    return 'Pending';
  }

  subOrderStatusClasses(status: SubOrder['status']): string {
    if (status === 'completed') return 'bg-emerald-50 text-emerald-700';
    if (status === 'in-progress') return 'bg-blue-50 text-blue-700';
    if (status === 'blocked') return 'bg-red-50 text-red-700';
    return 'bg-muted text-muted-foreground';
  }

  subOrderProgress(sub: SubOrder): number {
    const forms = sub.formsTotal === 0 ? 1 : sub.formsComplete / sub.formsTotal;
    const scans = sub.scansTotal === 0 ? 1 : sub.scansComplete / sub.scansTotal;
    return Math.round(((forms + scans) / 2) * 100);
  }

  shorten(value: string, maxLength: number): string {
    return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;
  }

  changeRequestClasses(changeRequest: string): string {
    if (changeRequest === 'Pending Review') return 'bg-amber-50 text-amber-700';
    if (changeRequest === 'In Progress') return 'bg-blue-50 text-blue-700';
    return 'bg-emerald-50 text-emerald-700';
  }

  /**
   * Exact React parity (OrdersPage.tsx lucide-react v1.47.0):
   * Plus 13, Download 15, RefreshCw 15, SlidersHorizontal, X 12,
   * ChevronLeft/Right 14, ChevronDown 10, Lock/Unlock 12, FileText 12,
   * ArrowUpDown 10, CheckSquare/Square 14/13, Search 13.
   */
  getIconSvg(name: string): string {
    const sizes: Record<string, { icon: string; size: number }> = {
      plus: { icon: 'plus', size: 13 },
      download: { icon: 'download', size: 15 },
      refresh: { icon: 'refresh-cw', size: 15 },
      sliders: { icon: 'sliders-horizontal', size: 12 },
      x: { icon: 'x', size: 12 },
      'chevron-left': { icon: 'chevron-left', size: 14 },
      'chevron-right': { icon: 'chevron-right', size: 14 },
      'chevron-down': { icon: 'chevron-down', size: 10 },
      lock: { icon: 'lock', size: 12 },
      unlock: { icon: 'lock-open', size: 12 },
      'file-text': { icon: 'file-text', size: 12 },
      search: { icon: 'search', size: 13 },
      'check-square': { icon: 'square-check-big', size: 14 },
      square: { icon: 'square', size: 14 },
      'check-square-sm': { icon: 'square-check-big', size: 13 },
      'square-sm': { icon: 'square', size: 13 },
    };
    const entry = sizes[name];
    if (!entry) return '';
    return lucideSvg(entry.icon, entry.size);
  }
}

