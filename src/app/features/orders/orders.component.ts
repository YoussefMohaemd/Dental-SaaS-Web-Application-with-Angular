import { Component, computed, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TreeTableModule } from "primeng/treetable";
import { TreeNode } from "primeng/api";
import { OrderDataService } from "@core/services/order-data.service";
import { SubOrderDataService } from "@core/services/sub-order-data.service";
import { SubOrderColorService } from "@core/services/sub-order-color.service";
import { NavigationService } from "@core/services/navigation.service";
import { FormatUtils } from "@core/services/format-utils.service";
import {
  Order,
  OrdersViewState,
  OrderStatus,
  Priority,
  SubOrder,
} from "@core/models";
import { ArchBadgeComponent } from "@shared/components/arch-badge/arch-badge.component";
import { AppButtonComponent } from "@shared/components/button/button.component";
import { DataTableToolbarComponent } from "@shared/components/data-table-toolbar/data-table-toolbar.component";
import { EmptyStateComponent } from "@shared/components/empty-state/empty-state.component";
import { EnterprisePaginatorComponent } from "@shared/components/enterprise-paginator/enterprise-paginator.component";
import { EntityDialogComponent } from "@shared/components/entity-dialog/entity-dialog.component";
import { IconActionButtonComponent } from "@shared/components/icon-action-button/icon-action-button.component";
import { SearchInputComponent } from "@shared/components/search-input/search-input.component";
import { AppSelectComponent } from "@shared/components/select/select.component";
import { StatusBadgeComponent } from "@shared/components/status-badge/status-badge.component";
import { SafeHtmlPipe } from "../../shared/pipes/safe-html.pipe";
import { lucideSvg } from "@shared/icons/lucide-icons";
import { buildSortAriaLabel, sortAriaValue } from "@shared/utils/sort-a11y";
import { statusDisplayLabel } from "@shared/utils/status-label";
import { filterTableRows } from "@shared/utils/table-state";

export interface OrderTreeRowData {
  kind: "order" | "service";
  order: Order;
  subOrder?: SubOrder;
}

type OrderFilterType =
  | "status"
  | "priority"
  | "patient"
  | "doctor"
  | "service";

interface ActiveOrderFilter {
  type: OrderFilterType;
  value: string;
  label: string;
}

export function mapSubOrderToTreeNode(
  order: Order,
  subOrder: SubOrder,
): TreeNode<OrderTreeRowData> {
  return {
    key: `${order.id}-${subOrder.id}`,
    data: { kind: "service", order, subOrder },
    leaf: true,
  };
}

export function mapOrderToTreeNode(
  order: Order,
  children: SubOrder[],
  expanded: boolean,
): TreeNode<OrderTreeRowData> {
  const hasKids = children.length > 0;
  return {
    key: order.id,
    data: { kind: "order", order },
    leaf: !hasKids,
    expanded: hasKids && expanded,
    children: hasKids
      ? children.map((so) => mapSubOrderToTreeNode(order, so))
      : undefined,
  };
}

const PAGE_SIZES = [10, 20, 30, 40, 50];

const COLLAPSE_ANIMATION_MS = 220;
const STATUS_OPTIONS: OrderStatus[] = [
  "New",
  "Review",
  "Design",
  "Production",
  "Quality Check",
  "Ready",
  "Completed",
  "Cancelled",
];
const PRIORITY_OPTIONS: Priority[] = ["Low", "Normal", "High", "Urgent"];

const SORT_COLUMN_LABELS: Partial<Record<keyof Order, string>> = {
  orderNumber: "Order number",
  patientName: "Patient",
  doctorName: "Doctor",
  scanCenterName: "Scan center",
  billTo: "Bill to",
  arch: "Maxilla/Mandible",
  restoration: "Format and restoration",
  amount: "Amount",
  status: "Status",
  archiveDate: "Archive date",
  receivedAt: "Received date",
  sentAt: "Sent date",
  updatedAt: "Updated date",
  chargedAt: "Charged date",
};

export function compareOrderValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  const aNum = typeof a === "string" && a.trim() !== "" ? Number(a) : NaN;
  const bNum = typeof b === "string" && b.trim() !== "" ? Number(b) : NaN;
  if (!Number.isNaN(aNum) && !Number.isNaN(bNum) && typeof a === typeof b)
    return aNum - bNum;
  const aTime = Date.parse(String(a));
  const bTime = Date.parse(String(b));
  if (!Number.isNaN(aTime) && !Number.isNaN(bTime)) return aTime - bTime;
  return String(a).localeCompare(String(b));
}

@Component({
  selector: "app-orders",
  standalone: true,
  imports: [
    CommonModule,
    TreeTableModule,
    ArchBadgeComponent,
    AppButtonComponent,
    DataTableToolbarComponent,
    EmptyStateComponent,
    EnterprisePaginatorComponent,
    EntityDialogComponent,
    IconActionButtonComponent,
    SearchInputComponent,
    AppSelectComponent,
    StatusBadgeComponent,
    SafeHtmlPipe,
  ],
  templateUrl: "./orders.component.html",
  styleUrl: "./orders.component.scss",
})
export class OrdersComponent {
  private readonly orderService = inject(OrderDataService);
  private readonly subOrderService = inject(SubOrderDataService);
  private readonly subOrderColorService = inject(SubOrderColorService);
  protected readonly navigationService = inject(NavigationService);
  protected readonly formatUtils = inject(FormatUtils);

  readonly orders = this.orderService.orders;
  readonly subOrders = this.subOrderService.subOrders;

  readonly search = signal("");
  readonly statusFilter = signal<OrderStatus[]>([]);
  readonly priorityFilter = signal<Priority | "">("");
  readonly patientFilter = signal("");
  readonly doctorFilter = signal("");
  readonly serviceFilter = signal("");
  readonly selectedIds = signal<Set<string>>(new Set());
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly sortColumn = signal<keyof Order | "">("receivedAt");
  readonly sortDirection = signal<"asc" | "desc">("desc");
  readonly viewState = computed<OrdersViewState>(() => {
    if (this.orderService.loading()) return "loading";
    if (this.orderService.error()) return "error";
    if (this.orders().length === 0) return "empty";
    return "normal";
  });
  readonly advancedFilters = signal(false);
  readonly draftStatusFilter = signal<OrderStatus[]>([]);
  readonly draftPriorityFilter = signal<Priority | "">("");
  readonly draftPatientFilter = signal("");
  readonly draftDoctorFilter = signal("");
  readonly draftServiceFilter = signal("");

  readonly pageSizes = PAGE_SIZES;
  readonly statusOptions = STATUS_OPTIONS;
  readonly priorityOptions = PRIORITY_OPTIONS;
  readonly pageSizeSelectOptions = PAGE_SIZES.map((size) => ({
    value: String(size),
    label: `${size} / page`,
  }));
  readonly patientOptions = computed(() =>
    this.uniqueSorted(this.orders().map((order) => order.patientName)),
  );
  readonly doctorOptions = computed(() =>
    this.uniqueSorted(this.orders().map((order) => order.doctorName)),
  );
  readonly subOrderServiceOptions = computed(() =>
    this.uniqueSorted(this.subOrders().map((subOrder) => subOrder.service)),
  );
  readonly subOrderServicesByOrderId = computed(() => {
    const byOrderId = new Map<string, Set<string>>();
    for (const subOrder of this.subOrders()) {
      const orderId = subOrder.orderId;
      const service = subOrder.service.trim();
      if (!orderId || !service) continue;
      const current = byOrderId.get(orderId) ?? new Set<string>();
      current.add(service);
      byOrderId.set(orderId, current);
    }
    return byOrderId;
  });

  readonly filtered = computed(() => {
    let result = filterTableRows(this.orders(), this.search().trim(), [
      (order) => order.orderNumber,
      (order) => order.patientName,
      (order) => order.doctorName,
      (order) => order.clinicName,
    ]);
    if (this.statusFilter().length > 0)
      result = result.filter((order) =>
        this.statusFilter().includes(order.status),
      );
    if (this.priorityFilter())
      result = result.filter(
        (order) => order.priority === this.priorityFilter(),
      );
    if (this.patientFilter())
      result = result.filter(
        (order) => order.patientName === this.patientFilter(),
      );
    if (this.doctorFilter())
      result = result.filter((order) => order.doctorName === this.doctorFilter());
    if (this.serviceFilter())
      result = result.filter((order) =>
        this.subOrderServicesByOrderId().get(order.id)?.has(this.serviceFilter()) ??
        false,
      );
    const column = this.sortColumn();
    if (column) {
      const direction = this.sortDirection() === "asc" ? 1 : -1;
      result.sort(
        (a, b) => compareOrderValues(a[column], b[column]) * direction,
      );
    }
    return result;
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / this.pageSize())),
  );
  readonly pageData = computed(() => {
    return this.filtered().slice(
      (this.page() - 1) * this.pageSize(),
      this.page() * this.pageSize(),
    );
  });

  readonly expandedIds = signal<Set<string>>(new Set());

  readonly collapsingIds = signal<Set<string>>(new Set());
  private readonly collapseTimers = new Map<string, number>();

  isExpanded(orderId: string): boolean {
    return this.expandedIds().has(orderId);
  }

  isCollapsing(orderId: string): boolean {
    return this.collapsingIds().has(orderId);
  }

  toggleNodeExpand(orderId: string): void {
    if (!orderId) return;
    const pending = this.collapseTimers.get(orderId);
    if (pending !== undefined) {
      window.clearTimeout(pending);
      this.collapseTimers.delete(orderId);
      this.collapsingIds.update((current) => {
        const next = new Set(current);
        next.delete(orderId);
        return next;
      });
      return;
    }
    if (this.expandedIds().has(orderId)) {
      if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
        this.expandedIds.update((current) => {
          const next = new Set(current);
          next.delete(orderId);
          return next;
        });
        return;
      }
      this.collapsingIds.update((current) => new Set(current).add(orderId));
      const timer = window.setTimeout(() => {
        this.collapseTimers.delete(orderId);
        this.collapsingIds.update((current) => {
          const next = new Set(current);
          next.delete(orderId);
          return next;
        });
        this.expandedIds.update((current) => {
          const next = new Set(current);
          next.delete(orderId);
          return next;
        });
      }, COLLAPSE_ANIMATION_MS);
      this.collapseTimers.set(orderId, timer);
    } else {
      this.expandedIds.update((current) => new Set(current).add(orderId));
    }
  }

  readonly treeNodes = computed<TreeNode<OrderTreeRowData>[]>(() => {
    const expanded = this.expandedIds();

    const allSubs = this.subOrders();
    void allSubs;
    return this.pageData().map((order) =>
      mapOrderToTreeNode(
        order,
        this.subOrdersFor(order.id),
        expanded.has(order.id),
      ),
    );
  });

  readonly activeFilters = computed<ActiveOrderFilter[]>(() => [
    ...this.statusFilter().map((status) => ({
      type: "status" as const,
      value: status,
      label: `Status: ${statusDisplayLabel(status)}`,
    })),
    ...(this.priorityFilter()
      ? [
          {
            type: "priority" as const,
            value: this.priorityFilter() as string,
            label: `Priority: ${this.priorityFilter()}`,
          },
        ]
      : []),
    ...(this.patientFilter()
      ? [
          {
            type: "patient" as const,
            value: this.patientFilter(),
            label: `Patient: ${this.patientFilter()}`,
          },
        ]
      : []),
    ...(this.doctorFilter()
      ? [
          {
            type: "doctor" as const,
            value: this.doctorFilter(),
            label: `Doctor: ${this.doctorFilter()}`,
          },
        ]
      : []),
    ...(this.serviceFilter()
      ? [
          {
            type: "service" as const,
            value: this.serviceFilter(),
            label: `Service: ${this.serviceFilter()}`,
          },
        ]
      : []),
  ]);
  readonly activeFilterCount = computed(
    () => this.activeFilters().length + (this.search().trim() ? 1 : 0),
  );

  readonly allPageSelected = computed(() => {
    const pageIds = this.pageData().map((order) => order.id);
    return (
      pageIds.length > 0 && pageIds.every((id) => this.selectedIds().has(id))
    );
  });

  readonly statusDisplayLabel = statusDisplayLabel;

  toggleSort(column: keyof Order): void {
    if (this.sortColumn() === column)
      this.sortDirection.update((direction) =>
        direction === "asc" ? "desc" : "asc",
      );
    else {
      this.sortColumn.set(column);
      this.sortDirection.set("asc");
    }
  }

  sortIconSvg(column: keyof Order): string {
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

  sortAriaSort(column: keyof Order): "ascending" | "descending" | "none" {
    return sortAriaValue(this.sortColumn() === column, this.sortDirection());
  }

  sortAriaLabel(column: keyof Order): string {
    const label = SORT_COLUMN_LABELS[column] ?? column;
    return buildSortAriaLabel(
      label,
      this.sortColumn() === column,
      this.sortDirection(),
    );
  }

  onSearchInput(value: string | Event): void {
    const next =
      typeof value === "string"
        ? value
        : ((value.target as HTMLInputElement | null)?.value ?? "");
    this.search.set(next);
    this.page.set(1);
  }

  onDebouncedSearch(value: string | Event): void {
    const next =
      typeof value === "string"
        ? value
        : ((value.target as HTMLInputElement | null)?.value ?? "");
    this.search.set(next);
    this.page.set(1);
  }

  clearSearch(): void {
    this.search.set("");
    this.page.set(1);
  }

  addStatusFilter(status: OrderStatus): void {
    if (!status || this.statusFilter().includes(status)) return;
    this.statusFilter.update((current) => [...current, status]);
    this.page.set(1);
  }

  onPageSizeValueChange(value: string): void {
    this.pageSize.set(Number(value));
    this.page.set(1);
  }

  onPageNumberChange(pageNumber: number): void {
    this.page.set(Math.max(1, Math.min(this.totalPages(), pageNumber)));
  }

  removeFilter(type: OrderFilterType, value?: string): void {
    if (type === "status" && value)
      this.statusFilter.update((current) =>
        current.filter((status) => status !== value),
      );
    if (type === "priority") this.priorityFilter.set("");
    if (type === "patient") this.patientFilter.set("");
    if (type === "doctor") this.doctorFilter.set("");
    if (type === "service") this.serviceFilter.set("");
    this.page.set(1);
  }

  clearAllFilters(): void {
    this.search.set("");
    this.statusFilter.set([]);
    this.priorityFilter.set("");
    this.patientFilter.set("");
    this.doctorFilter.set("");
    this.serviceFilter.set("");
    this.page.set(1);
  }

  toggleSelect(orderId: string): void {
    this.selectedIds.update((current) => {
      const next = new Set(current);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  }

  toggleSelectAll(): void {
    const pageIds = this.pageData().map((order) => order.id);
    const allSelected = pageIds.every((id) => this.selectedIds().has(id));
    this.selectedIds.update((current) => {
      const next = new Set(current);
      if (allSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  }

  isSelected(orderId: string): boolean {
    return this.selectedIds().has(orderId);
  }

  openAdvancedFilters(): void {
    this.resetDraftFiltersFromCurrent();
    this.advancedFilters.set(true);
  }

  onAdvancedFiltersVisibleChange(next: boolean): void {
    this.advancedFilters.set(next);
    if (!next) this.resetDraftFiltersFromCurrent();
  }

  closeAdvancedFiltersDialog(): void {
    this.advancedFilters.set(false);
    this.resetDraftFiltersFromCurrent();
  }

  toggleDraftStatus(status: OrderStatus): void {
    if (this.draftStatusFilter().includes(status)) {
      this.draftStatusFilter.update((current) =>
        current.filter((item) => item !== status),
      );
      return;
    }
    this.draftStatusFilter.update((current) => [...current, status]);
  }

  isDraftStatusSelected(status: OrderStatus): boolean {
    return this.draftStatusFilter().includes(status);
  }

  onDraftPriorityValueChange(value: string): void {
    this.draftPriorityFilter.set(value as Priority | "");
  }

  onDraftPatientValueChange(value: string): void {
    this.draftPatientFilter.set(value);
  }

  onDraftDoctorValueChange(value: string): void {
    this.draftDoctorFilter.set(value);
  }

  onDraftServiceValueChange(value: string): void {
    this.draftServiceFilter.set(value);
  }

  clearAdvancedFiltersDraft(): void {
    this.draftStatusFilter.set([]);
    this.draftPriorityFilter.set("");
    this.draftPatientFilter.set("");
    this.draftDoctorFilter.set("");
    this.draftServiceFilter.set("");
  }

  applyAdvancedFilters(): void {
    this.statusFilter.set([...this.draftStatusFilter()]);
    this.priorityFilter.set(this.draftPriorityFilter());
    this.patientFilter.set(this.draftPatientFilter());
    this.doctorFilter.set(this.draftDoctorFilter());
    this.serviceFilter.set(this.draftServiceFilter());
    this.page.set(1);
    this.advancedFilters.set(false);
  }

  setViewState(state: OrdersViewState): void {
    this.orderService.previewState(state);
  }

  simulateRefresh(): void {
    this.orderService.reload();
  }

  retryLoad(): void {
    this.orderService.reload();
  }

  exportCsv(): void {
    const rows = this.filtered();
    const header = [
      "Order #",
      "Patient",
      "Doctor",
      "Clinic",
      "Status",
      "Priority",
      "Restoration",
      "Amount",
      "Received",
    ];
    const escape = (value: unknown): string => {
      const text = String(value ?? "");
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    const lines = [
      header.join(","),
      ...rows.map((o) =>
        [
          escape(o.orderNumber),
          escape(o.patientName),
          escape(o.doctorName),
          escape(o.clinicName),
          escape(o.status),
          escape(o.priority),
          escape(o.restoration),
          escape(o.amount),
          escape(o.receivedAt),
        ].join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "orders.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  goToPage(target: number): void {
    this.page.set(Math.max(1, Math.min(this.totalPages(), target)));
  }

  openOrder(orderId: string): void {
    this.navigationService.navigate("viewOrder", { orderId });
  }

  openSubOrder(orderId: string, subOrderId: string): void {
    this.navigationService.navigate("subOrder", { orderId, subOrderId });
  }

  openPatient(patientId: string): void {
    this.navigationService.navigate("patientDetails", { patientId });
  }

  openDoctor(doctorId: string): void {
    this.navigationService.navigate("doctorDetails", { doctorId });
  }

  createOrder(): void {
    this.navigationService.navigate("createOrder");
  }

  subOrdersFor(orderId: string): SubOrder[] {
    return this.subOrders().filter((s) => s.orderId === orderId);
  }

  subOrderStatusLabel(status: SubOrder["status"]): string {
    if (status === "done") return "Done";
    if (status === "in-progress") return "In Progress";
    if (status === "blocked") return "Blocked";
    return "Pending";
  }

  subOrderServiceBlockStyle(subOrder: SubOrder): Record<string, string> {
    const background = this.subOrderColorService.colorForServiceLabel(
      subOrder.service,
    );
    return {
      "background-color": background,
      color: this.contrastText(background),
    };
  }

  subOrderProgress(sub: SubOrder): number {
    const forms = sub.formsTotal === 0 ? 1 : sub.formsComplete / sub.formsTotal;
    const scans = sub.scansTotal === 0 ? 1 : sub.scansComplete / sub.scansTotal;
    return Math.round(((forms + scans) / 2) * 100);
  }

  shorten(value: string, maxLength: number): string {
    return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;
  }

  private contrastText(hex: string): string {
    const parsed = this.parseHex(hex);
    if (!parsed) return "#0F172A";
    const { r, g, b } = parsed;
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return luminance > 0.62 ? "#0F172A" : "#FFFFFF";
  }

  private parseHex(hex: string): { r: number; g: number; b: number } | null {
    const raw = hex.replace("#", "").trim();
    if (raw.length !== 6) return null;
    const r = Number.parseInt(raw.slice(0, 2), 16);
    const g = Number.parseInt(raw.slice(2, 4), 16);
    const b = Number.parseInt(raw.slice(4, 6), 16);
    if (![r, g, b].every(Number.isFinite)) return null;
    return { r, g, b };
  }

  changeRequestClasses(changeRequest: string): string {
    if (changeRequest === "Pending Review") return "bg-amber-50 text-amber-700";
    if (changeRequest === "In Progress") return "bg-blue-50 text-blue-700";
    return "bg-emerald-50 text-emerald-700";
  }

  getIconSvg(name: string): string {
    const sizes: Record<string, { icon: string; size: number }> = {
      plus: { icon: "plus", size: 13 },
      download: { icon: "download", size: 15 },
      refresh: { icon: "refresh-cw", size: 15 },
      sliders: { icon: "sliders-horizontal", size: 12 },
      x: { icon: "x", size: 12 },
      "chevron-left": { icon: "chevron-left", size: 14 },
      "chevron-right": { icon: "chevron-right", size: 14 },
      "chevron-down": { icon: "chevron-down", size: 10 },
      lock: { icon: "lock", size: 12 },
      unlock: { icon: "lock-open", size: 12 },
      "file-text": { icon: "file-text", size: 12 },
      search: { icon: "search", size: 13 },
      "check-square": { icon: "square-check-big", size: 14 },
      square: { icon: "square", size: 14 },
      "check-square-sm": { icon: "square-check-big", size: 13 },
      "square-sm": { icon: "square", size: 13 },
    };
    const entry = sizes[name];
    if (!entry) return "";
    return lucideSvg(entry.icon, entry.size);
  }

  private uniqueSorted(values: string[]): string[] {
    return Array.from(
      new Set(values.map((value) => value.trim()).filter((value) => !!value)),
    ).sort((a, b) => a.localeCompare(b));
  }

  private resetDraftFiltersFromCurrent(): void {
    this.draftStatusFilter.set([...this.statusFilter()]);
    this.draftPriorityFilter.set(this.priorityFilter());
    this.draftPatientFilter.set(this.patientFilter());
    this.draftDoctorFilter.set(this.doctorFilter());
    this.draftServiceFilter.set(this.serviceFilter());
  }
}
