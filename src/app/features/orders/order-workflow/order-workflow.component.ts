import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { OrderDataService } from '@core/services/order-data.service';
import { NavigationService } from '@core/services/navigation.service';
import { FormatUtils } from '@core/services/format-utils.service';
import { OrderStatus } from '@core/models';
import { ButtonComponent } from '@shared/components/button/button.component';

interface WorkflowStage {
  status: OrderStatus;
  label: string;
  owner: string;
  description: string;
  actions: string[];
}

const STAGE_ORDER: OrderStatus[] = ['New', 'Review', 'Design', 'Production', 'Quality Check', 'Ready', 'Completed'];

const STAGES: WorkflowStage[] = [
  { status: 'New', label: 'Order Received', owner: 'Reception', description: 'Order intake and initial verification.', actions: ['Verify scan files', 'Confirm patient details', 'Set priority'] },
  { status: 'Review', label: 'Technical Review', owner: 'Lead Technician', description: 'Validate scan quality and prescription.', actions: ['Review STL quality', 'Validate occlusal data', 'Confirm shade selection'] },
  { status: 'Design', label: 'CAD Design', owner: 'T. Anderson', description: 'Digital design and margin placement.', actions: ['Create initial design', 'Margin placement', 'Patient approval (if needed)'] },
  { status: 'Production', label: 'Milling / Fabrication', owner: 'M. Rivera', description: 'Manufacturing and post-processing.', actions: ['Queue milling job', 'Monitor production', 'Post-process'] },
  { status: 'Quality Check', label: 'Quality Control', owner: 'QC Team', description: 'Final inspection before dispatch.', actions: ['Occlusal check', 'Shade verification', 'Surface finish inspection'] },
  { status: 'Ready', label: 'Ready for Pickup', owner: 'Dispatch', description: 'Packaging and clinic notification.', actions: ['Package order', 'Notify clinic', 'Arrange delivery'] },
  { status: 'Completed', label: 'Delivered', owner: 'Completed', description: 'Order delivered and closed.', actions: [] }
];

@Component({
  selector: 'app-order-workflow',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './order-workflow.component.html',
  styleUrl: './order-workflow.component.scss'
})
export class OrderWorkflowComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderDataService);
  protected readonly navigationService = inject(NavigationService);
  protected readonly formatUtils = inject(FormatUtils);

  readonly advancing = signal(false);
  readonly stages: WorkflowStage[] = STAGES;

  readonly order = computed(() => {
    const orderId = this.route.snapshot.paramMap.get('orderId');
    return this.orderService.getOrderById(orderId ?? '') ?? this.orderService.orders()[0];
  });

  readonly currentIndex = computed(() => {
    const current = this.order();
    if (!current) return 0;
    const idx = STAGE_ORDER.indexOf(current.status);
    return idx >= 0 ? idx : 0;
  });

  readonly nextStage = computed(() => {
    const idx = this.currentIndex();
    return idx < STAGES.length - 1 ? STAGES[idx + 1] : null;
  });

  readonly completedCount = computed(() => this.currentIndex() + 1);

  goBack(): void {
    const current = this.order();
    if (current) this.navigationService.navigate('viewOrder', { orderId: current.id });
    else this.navigationService.navigate('orders');
  }

  isStageDone(index: number): boolean {
    return index < this.currentIndex();
  }

  isStageCurrent(index: number): boolean {
    return index === this.currentIndex();
  }

  advanceStage(): void {
    const next = this.nextStage();
    const current = this.order();
    if (!next || !current || this.advancing()) return;
    this.advancing.set(true);
    window.setTimeout(() => {
      this.orderService.updateOrder(current.id, { status: next.status });
      this.advancing.set(false);
    }, 600);
  }
}
