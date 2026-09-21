import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { OrderDataService } from '@core/services/order-data.service';
import { NavigationService } from '@core/services/navigation.service';
import { FormatUtils } from '@core/services/format-utils.service';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { ButtonComponent } from '@shared/components/button/button.component';

interface SubOrderDetail {
  id: string;
  service: string;
  icon: string;
  status: 'completed' | 'in-progress' | 'pending';
  statusLabel: string;
  formsComplete: number;
  formsTotal: number;
  scansComplete: number;
  scansTotal: number;
  teeth: number[];
  priority: string;
  dueDate: string;
  notes: string;
}

const SUB_ORDERS: SubOrderDetail[] = [
  { id: 'so-1', service: 'Surgical Guide', icon: '🦷', status: 'completed', statusLabel: 'Completed', formsComplete: 3, formsTotal: 3, scansComplete: 3, scansTotal: 3, teeth: [14, 15, 24, 25], priority: 'High', dueDate: '2024-03-15', notes: 'Standard surgical guide for dual implant placement.' },
  { id: 'so-2', service: 'GFMR', icon: '⚙️', status: 'in-progress', statusLabel: 'In Progress', formsComplete: 2, formsTotal: 3, scansComplete: 1, scansTotal: 3, teeth: [11, 12, 13, 21, 22, 23], priority: 'High', dueDate: '2024-03-20', notes: 'Full mouth rehabilitation, occlusal vertical dimension to be confirmed.' },
  { id: 'so-3', service: 'Final Restoration', icon: '✨', status: 'pending', statusLabel: 'Pending', formsComplete: 0, formsTotal: 2, scansComplete: 0, scansTotal: 2, teeth: [16, 17, 26, 27], priority: 'Normal', dueDate: '2024-04-01', notes: 'Posterior zirconia crowns — shade A2 with characterization.' },
  { id: 'so-4', service: 'Treatment Plan', icon: '📋', status: 'pending', statusLabel: 'Pending', formsComplete: 1, formsTotal: 2, scansComplete: 0, scansTotal: 1, teeth: [], priority: 'Normal', dueDate: '2024-03-10', notes: 'Comprehensive treatment plan review with the clinic team.' }
];

@Component({
  selector: 'app-sub-order',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './sub-order.component.html',
  styleUrl: './sub-order.component.scss'
})
export class SubOrderComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderDataService);
  protected readonly navigationService = inject(NavigationService);
  protected readonly formatUtils = inject(FormatUtils);

  readonly order = computed(() => {
    const orderId = this.route.snapshot.paramMap.get('orderId');
    return this.orderService.getOrderById(orderId ?? '') ?? this.orderService.orders()[0];
  });

  readonly subOrder = computed(() => {
    const subOrderId = this.route.snapshot.paramMap.get('subOrderId');
    return SUB_ORDERS.find(s => s.id === subOrderId) ?? SUB_ORDERS[0];
  });

  readonly progress = computed(() => {
    const sub = this.subOrder();
    const forms = sub.formsTotal === 0 ? 1 : sub.formsComplete / sub.formsTotal;
    const scans = sub.scansTotal === 0 ? 1 : sub.scansComplete / sub.scansTotal;
    return Math.round(((forms + scans) / 2) * 100);
  });

  goBack(): void {
    const current = this.order();
    if (current) this.navigationService.navigate('viewOrder', { orderId: current.id });
    else this.navigationService.navigate('orders');
  }

  goToWorkflow(): void {
    const current = this.order();
    if (current) this.navigationService.navigate('orderWorkflow', { orderId: current.id });
  }

  goToFiles(): void {
    const current = this.order();
    if (current) this.navigationService.navigate('orderFiles', { orderId: current.id });
  }

  statusClasses(status: SubOrderDetail['status']): string {
    if (status === 'completed') return 'bg-success/10 text-success';
    if (status === 'in-progress') return 'bg-primary/10 text-primary';
    return 'bg-muted text-muted-foreground';
  }
}
