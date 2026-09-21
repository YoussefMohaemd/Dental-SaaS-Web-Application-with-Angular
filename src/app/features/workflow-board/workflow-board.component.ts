import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { OrderDataService } from '@core/services/order-data.service';
import { NavigationService } from '@core/services/navigation.service';
import { FormatUtils } from '@core/services/format-utils.service';
import { Order, OrderStatus } from '@core/models';
import { PriorityBadgeComponent } from '@shared/components/priority-badge/priority-badge.component';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';

interface ColumnConfig {
  id: OrderStatus;
  label: string;
  dotColor: string;
  badgeColor: string;
}

@Component({
  selector: 'app-workflow-board',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    PriorityBadgeComponent,
  ],
  templateUrl: './workflow-board.component.html',
  styleUrl: './workflow-board.component.scss'
})
export class WorkflowBoardComponent implements OnInit {
  private readonly orderService = inject(OrderDataService);
  protected readonly navigationService = inject(NavigationService);
  protected readonly formatUtils = inject(FormatUtils);

  readonly orders = this.orderService.orders;

  readonly boardOrders = signal<Order[]>([]);
  readonly dragId = signal<string | null>(null);

  readonly columns: ColumnConfig[] = [
    { id: 'New', label: 'New', dotColor: 'bg-slate-400', badgeColor: 'bg-slate-100 text-slate-700' },
    { id: 'Review', label: 'Review', dotColor: 'bg-amber-500', badgeColor: 'bg-amber-50 text-amber-700' },
    { id: 'Design', label: 'Design', dotColor: 'bg-cyan-500', badgeColor: 'bg-cyan-50 text-cyan-700' },
    { id: 'Production', label: 'Production', dotColor: 'bg-blue-500', badgeColor: 'bg-blue-50 text-blue-700' },
    { id: 'Quality Check', label: 'QC', dotColor: 'bg-violet-500', badgeColor: 'bg-violet-50 text-violet-700' },
    { id: 'Ready', label: 'Ready', dotColor: 'bg-emerald-500', badgeColor: 'bg-emerald-50 text-emerald-700' },
    { id: 'Completed', label: 'Done', dotColor: 'bg-emerald-600', badgeColor: 'bg-emerald-100 text-emerald-800' }
  ];

  readonly columnOrders = computed(() => {
    const result: Record<string, Order[]> = {};
    for (const col of this.columns) {
      result[col.id] = this.boardOrders().filter(o => o.status === col.id);
    }
    return result;
  });

  ngOnInit(): void {
    // Load first 32 orders for the board
    this.boardOrders.set(this.orders().slice(0, 32));
  }

  getColumnOrders(colId: string): Order[] {
    return this.columnOrders()[colId] || [];
  }

  onDragStart(id: string): void {
    this.dragId.set(id);
  }

  onDragEnd(): void {
    this.dragId.set(null);
  }

  drop(event: CdkDragDrop<Order[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      // Update the order status in the signal
      const movedOrder = event.container.data[event.currentIndex];
      const newStatus = this.getStatusFromContainer(event.container.id);
      if (movedOrder && newStatus) {
        this.orderService.updateOrder(movedOrder.id, { status: newStatus as OrderStatus });
      }
    }
    this.dragId.set(null);
  }

  private getStatusFromContainer(containerId: string): OrderStatus | null {
    const col = this.columns.find(c => c.id === containerId);
    return col?.id || null;
  }

  isDraggedInColumn(colId: string): boolean {
    const id = this.dragId();
    if (!id) return false;
    return this.getColumnOrders(colId).some(o => o.id === id);
  }

  trackByOrderId(index: number, order: Order): string {
    return order.id;
  }

  navigateToOrder(orderId: string): void {
    this.navigationService.navigate('viewOrder', { orderId });
  }

  getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      'Low': 'text-slate-400',
      'Normal': 'text-blue-500',
      'High': 'text-amber-500',
      'Urgent': 'text-red-500'
    };
    return colors[priority] || 'text-slate-400';
  }

  getIconSvg(name: string): string {
    const icons: Record<string, string> = {
      lock: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>',
      'alert-triangle': '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
      'refresh-ccw': '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"></polyline><polyline points="23 20 23 14 17 14"></polyline><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4L1 10m-1.49 4.36A9 9 0 0 1 18.36 18.36"></path></svg>'
    };
    return icons[name] || '';
  }
}
