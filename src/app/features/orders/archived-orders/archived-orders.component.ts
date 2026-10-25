import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { forkJoin, Observable } from "rxjs";
import { OrderDataService } from "@core/services/order-data.service";
import { NavigationService } from "@core/services/navigation.service";
import { Order } from "@core/interfaces";
import { AppButtonComponent } from "@shared/components/button/button.component";
import { DataTableToolbarComponent } from "@shared/components/data-table-toolbar/data-table-toolbar.component";
import { EmptyStateComponent } from "@shared/components/empty-state/empty-state.component";
import { EntityDialogComponent } from "@shared/components/entity-dialog/entity-dialog.component";
import { ArchBadgeComponent } from "@shared/components/arch-badge/arch-badge.component";
import { StatusBadgeComponent } from "@shared/components/status-badge/status-badge.component";
import { DisplayDatePipe } from "@shared/pipes/display-date.pipe";
import { DisplayCurrencyPipe } from "@shared/pipes/display-currency.pipe";
import { SafeHtmlPipe } from "@shared/pipes/safe-html.pipe";
import { getApiErrorMessage } from "@shared/utils/api-error";
import { buildSortAriaLabel, sortAriaValue } from "@shared/utils/sort-a11y";
import { lucideSvg } from "@shared/icons/lucide-icons";

@Component({
  selector: "app-archived-orders",
  standalone: true,
  imports: [
    CommonModule,
    AppButtonComponent,
    DataTableToolbarComponent,
    EmptyStateComponent,
    EntityDialogComponent,
    ArchBadgeComponent,
    StatusBadgeComponent,
    DisplayDatePipe,
    DisplayCurrencyPipe,
    SafeHtmlPipe,
  ],
  templateUrl: "./archived-orders.component.html",
  styleUrl: "./archived-orders.component.scss",
})
export class ArchivedOrdersComponent implements OnInit {
  private readonly orderService = inject(OrderDataService);
  protected readonly navigationService = inject(NavigationService);

  readonly search = signal("");
  readonly actionId = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly selectedIds = signal<Set<string>>(new Set());
  readonly confirmDeleteVisible = signal(false);
  readonly sortColumn = signal<keyof Order | "">("archiveDate");
  readonly sortDirection = signal<"asc" | "desc">("desc");
  readonly orders = computed(() => {
    const query = this.search().trim().toLowerCase();
    const result = this.orderService
      .orders()
      .filter((order) => !!order.archiveDate)
      .filter((order) => {
        if (!query) return true;
        return [order.orderNumber, order.patientName, order.doctorName].some(
          (value) => value.toLowerCase().includes(query),
        );
      });
    const column = this.sortColumn();
    if (column) {
      const direction = this.sortDirection() === "asc" ? 1 : -1;
      result.sort((a, b) => {
        const left = a[column];
        const right = b[column];
        if (left == null && right == null) return 0;
        if (left == null) return -1 * direction;
        if (right == null) return 1 * direction;
        if (typeof left === "number" && typeof right === "number") {
          return (left - right) * direction;
        }
        return String(left).localeCompare(String(right)) * direction;
      });
    }
    return result;
  });
  readonly selectableOrders = computed(() =>
    this.orders().filter((order) => !order.isLocked),
  );
  readonly allSelected = computed(() => {
    const rows = this.selectableOrders();
    return (
      rows.length > 0 && rows.every((order) => this.selectedIds().has(order.id))
    );
  });
  readonly selectedOrders = computed(() =>
    this.orders().filter((order) => this.selectedIds().has(order.id)),
  );

  ngOnInit(): void {
    this.orderService.loadOrders();
  }

  openOrder(order: Order): void {
    if (order.isLocked) {
      this.actionError.set(
        "This order is locked. Unlock it from the Orders page before opening it.",
      );
      return;
    }
    this.navigationService.navigate("viewOrder", {
      orderId: order.id,
      archived: true,
    });
  }

  unarchive(order: Order): void {
    if (this.actionId()) return;
    this.actionId.set(order.id);
    this.actionError.set(null);
    this.orderService.updateOrder$(order.id, { archiveDate: null }).subscribe({
      next: () => this.actionId.set(null),
      error: (error) => {
        this.actionId.set(null);
        this.actionError.set(
          getApiErrorMessage(error, "Unable to restore this order."),
        );
      },
    });
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
    const rows = this.selectableOrders();
    this.selectedIds.update((current) => {
      const next = new Set(current);
      if (this.allSelected()) rows.forEach((order) => next.delete(order.id));
      else rows.forEach((order) => next.add(order.id));
      return next;
    });
  }

  toggleSort(column: keyof Order): void {
    if (this.sortColumn() === column) {
      this.sortDirection.update((direction) =>
        direction === "asc" ? "desc" : "asc",
      );
      return;
    }
    this.sortColumn.set(column);
    this.sortDirection.set("asc");
  }

  sortIconSvg(column: keyof Order): string {
    const active = this.sortColumn() === column;
    const direction = this.sortDirection();
    const common =
      'width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"';
    if (!active) {
      return `<svg ${common}><path d="m8 9 4-4 4 4"/><path d="m16 15-4 4-4-4"/></svg>`;
    }
    return direction === "asc"
      ? `<svg ${common}><path d="m8 15 4-4 4 4"/></svg>`
      : `<svg ${common}><path d="m8 9 4 4 4-4"/></svg>`;
  }

  sortAriaSort(column: keyof Order): "ascending" | "descending" | "none" {
    return sortAriaValue(this.sortColumn() === column, this.sortDirection());
  }

  sortAriaLabel(column: keyof Order): string {
    return buildSortAriaLabel(
      column,
      this.sortColumn() === column,
      this.sortDirection(),
    );
  }

  isSelected(orderId: string): boolean {
    return this.selectedIds().has(orderId);
  }

  restoreSelected(): void {
    const selected = this.selectedOrders();
    if (selected.length === 0) return;
    if (selected.some((order) => order.isLocked)) {
      this.actionError.set("Unlock locked orders before restoring them.");
      return;
    }
    this.runBulkAction(
      selected.map((order) =>
        this.orderService.updateOrder$(order.id, { archiveDate: null }),
      ),
      "Unable to restore the selected orders.",
    );
  }

  requestDeleteSelected(): void {
    const selected = this.selectedOrders();
    if (selected.length === 0) return;
    if (selected.some((order) => order.isLocked)) {
      this.actionError.set("Unlock locked orders before deleting them.");
      return;
    }
    this.confirmDeleteVisible.set(true);
  }

  cancelDelete(): void {
    if (this.actionId()) return;
    this.confirmDeleteVisible.set(false);
  }

  onConfirmDeleteVisibleChange(next: boolean): void {
    if (next) this.confirmDeleteVisible.set(true);
    else this.cancelDelete();
  }

  confirmDelete(): void {
    const selected = this.selectedOrders();
    this.confirmDeleteVisible.set(false);
    if (selected.length === 0) return;
    this.runBulkAction(
      selected.map((order) => this.orderService.deleteOrder$(order.id)),
      "Unable to delete the selected orders.",
    );
  }

  unlock(order: Order): void {
    if (this.actionId()) return;
    this.actionId.set(order.id);
    this.actionError.set(null);
    this.orderService.updateOrder$(order.id, { isLocked: false }).subscribe({
      next: () => this.actionId.set(null),
      error: (error) => {
        this.actionId.set(null);
        this.actionError.set(
          getApiErrorMessage(error, "Unable to unlock this order."),
        );
      },
    });
  }

  onSearch(value: string | Event): void {
    this.search.set(
      typeof value === "string"
        ? value
        : ((value.target as HTMLInputElement | null)?.value ?? ""),
    );
  }

  getIconSvg(name: "archive" | "lock" | "unlock"): string {
    const icons = {
      archive: { icon: "archive", size: 13 },
      lock: { icon: "lock", size: 12 },
      unlock: { icon: "lock-open", size: 12 },
    } as const;
    const entry = icons[name];
    return lucideSvg(entry.icon, entry.size);
  }

  private runBulkAction(
    actions: Observable<unknown>[],
    fallbackMessage: string,
  ): void {
    if (this.actionId()) return;
    this.actionId.set("bulk");
    this.actionError.set(null);
    forkJoin(actions).subscribe({
      next: () => {
        this.selectedIds.set(new Set());
        this.actionId.set(null);
      },
      error: (error) => {
        this.actionId.set(null);
        this.actionError.set(getApiErrorMessage(error, fallbackMessage));
      },
    });
  }
}
