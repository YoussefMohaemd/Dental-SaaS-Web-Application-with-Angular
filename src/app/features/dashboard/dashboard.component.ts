import { CommonModule } from "@angular/common";
import { Component, computed, effect, inject, OnInit, signal } from "@angular/core";
import { CaseDataService } from "@core/services/case-data.service";
import { ChangeRequestDataService } from "@core/services/change-request-data.service";
import { DashboardDataService } from "@core/services/dashboard-data.service";
import { FormatUtils } from "@core/services/format-utils.service";
import { NavigationService } from "@core/services/navigation.service";
import { NotificationDataService } from "@core/services/notification-data.service";
import { OrderDataService } from "@core/services/order-data.service";
import { EmptyStateComponent } from "@shared/components/empty-state/empty-state.component";
import { LoadingStateComponent } from "@shared/components/loading-state/loading-state.component";
import { PriorityBadgeComponent } from "@shared/components/priority-badge/priority-badge.component";
import { StatusBadgeComponent } from "@shared/components/status-badge/status-badge.component";
import { SafeHtmlPipe } from '@shared/pipes/safe-html.pipe';
import { lucideSvg } from '@shared/icons/lucide-icons';

interface WorkflowDataPoint {
  name: string;
  count: number;
  color: string;
}

interface StatCardData {
  label: string;
  value: number | string;
  sub: string;
  icon: string;
  color: string;
  route: string;
}

interface QuickStatData {
  label: string;
  value: string;
  sub: string;
  icon: string;
  color: string;
}


const WORKFLOW_STAGES: { name: string; color: string; statuses: string[] }[] = [
  { name: 'New', color: '#94A3B8', statuses: ['New'] },
  { name: 'Review', color: '#F59E0B', statuses: ['Review'] },
  { name: 'Design', color: '#06B6D4', statuses: ['Design'] },
  { name: 'Production', color: '#2563EB', statuses: ['Production'] },
  { name: 'QC', color: '#8B5CF6', statuses: ['Quality Check'] },
  { name: 'Ready', color: '#10B981', statuses: ['Ready', 'Completed'] },
];


const FALLBACK_WORKFLOW: WorkflowDataPoint[] = [
  { name: 'New', count: 8, color: '#94A3B8' },
  { name: 'Review', count: 5, color: '#F59E0B' },
  { name: 'Design', count: 7, color: '#06B6D4' },
  { name: 'Production', count: 12, color: '#2563EB' },
  { name: 'QC', count: 4, color: '#8B5CF6' },
  { name: 'Ready', count: 6, color: '#10B981' }
];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    StatusBadgeComponent,
    PriorityBadgeComponent,
    LoadingStateComponent,
    EmptyStateComponent,
    SafeHtmlPipe
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly orderService = inject(OrderDataService);
  private readonly caseService = inject(CaseDataService);
  private readonly navigationService = inject(NavigationService);
  private readonly volumeService = inject(DashboardDataService);
  private readonly notificationService = inject(NotificationDataService);
  private readonly changeRequestService = inject(ChangeRequestDataService);
  readonly formatUtils = inject(FormatUtils);

  readonly orders = this.orderService.orders;
  readonly cases = this.caseService.cases;
  readonly loading = this.orderService.loading;
  readonly urgentOrdersCount = this.orderService.urgentOrdersCount;
  readonly completedTodayCount = this.orderService.completedTodayCount;
  readonly volumeLoading = this.volumeService.loading;
  readonly activityLoading = this.notificationService.loading;

  readonly totalOrders = computed(() => this.orders().length);
  readonly activeCases = computed(() => this.cases().filter(c => c.status !== 'Closed').length);
  readonly pendingReview = computed(() => this.orders().filter(o => o.status === 'Review').length);
  readonly completedToday = this.completedTodayCount;

  readonly recentOrders = computed(() =>
    [...this.orders()].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 7)
  );

  
  readonly activity = computed(() => this.notificationService.notifications().slice(0, 10));

  
  readonly weeklyData = this.volumeService.currentDays;

  
  readonly volumeNiceMax = computed(() => {
    const max = this.volumeService.weekMax();
    if (max <= 0) return 5;
    const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
    const normalized = max / magnitude;
    const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
    return Math.max(5, nice * magnitude);
  });

  readonly volumeTicks = computed<number[]>(() => {
    const nice = this.volumeNiceMax();
    return [nice, nice * 0.75, nice * 0.5, nice * 0.25, 0].map((v) => Math.round(v));
  });

  
  readonly workflowData = computed<WorkflowDataPoint[]>(() => {
    if (this.orders().length === 0) return FALLBACK_WORKFLOW;
    return WORKFLOW_STAGES.map((stage) => ({
      name: stage.name,
      color: stage.color,
      count: this.orders().filter((o) => stage.statuses.includes(o.status)).length,
    }));
  });

  readonly revenue = computed(() =>
    this.formatUtils.formatCurrency(this.orders().reduce((sum, o) => sum + o.amount, 0))
  );

  readonly turnaround = computed(() => {
    const sent = this.orders().filter((o) => o.sentAt);
    if (sent.length === 0) return '2.4 days';
    const avg = sent.reduce(
      (sum, o) => sum + (Date.parse(o.sentAt as string) - Date.parse(o.receivedAt)) / 86400000,
      0
    ) / sent.length;
    return `${avg.toFixed(1)} days`;
  });

  readonly openChangeRequests = computed(() => {
    const all = this.changeRequestService.changeRequests();
    if (all.length === 0) return 4;
    return all.filter((c) => c.status === 'Pending' || c.status === 'In Review').length;
  });

  readonly quickStats = computed<QuickStatData[]>(() => [
    { label: 'Revenue This Month', value: this.revenue(), sub: '+12% vs last month', icon: 'trending-up', color: 'text-success' },
    { label: 'Avg Turnaround', value: this.turnaround(), sub: 'Crown & Bridge', icon: 'clock', color: 'text-primary' },
    { label: 'Change Requests', value: `${this.openChangeRequests()} open`, sub: '2 require action today', icon: 'alert-triangle', color: 'text-warning' }
  ]);

  readonly statCards: StatCardData[] = [
    { label: 'Total Orders', value: 0, sub: 'This month', icon: 'clipboard-list', color: 'bg-primary', route: 'orders' },
    { label: 'Active Cases', value: 0, sub: '0 in progress', icon: 'folder-open', color: 'bg-accent', route: 'cases' },
    { label: 'Pending Review', value: 0, sub: 'Awaiting approval', icon: 'clock', color: 'bg-warning', route: 'orders' },
    { label: 'Completed Today', value: 0, sub: 'Orders delivered', icon: 'check-circle-2', color: 'bg-success', route: 'orders' }
  ];

  
  readonly hoveredDay = signal<string | null>(null);

  readonly today = new Date();

  constructor() {
    
    
    
    effect(() => {
      this.statCards[0].value = this.totalOrders();
      this.statCards[1].value = this.activeCases();
      this.statCards[1].sub = `${this.cases().filter(c => c.status === 'In Progress').length} in progress`;
      this.statCards[2].value = this.pendingReview();
      this.statCards[3].value = this.completedToday();
    });
  }

  ngOnInit(): void {
    this.updateStatCards();
  }

  private updateStatCards(): void {
    this.statCards[0].value = this.totalOrders();
    this.statCards[1].value = this.activeCases();
    this.statCards[1].sub = `${this.cases().filter(c => c.status === 'In Progress').length} in progress`;
    this.statCards[2].value = this.pendingReview();
    this.statCards[3].value = this.completedToday();
  }

  getTotalRevenue(): string {
    return this.revenue();
  }

  getIconSvg(name: string): string {
    
    
    
    const sizes: Record<string, { icon: string; size: number }> = {
      'clipboard-list': { icon: 'clipboard-list', size: 18 },
      'folder-open': { icon: 'folder-open', size: 18 },
      clock: { icon: 'clock', size: 18 },
      'check-circle-2': { icon: 'circle-check', size: 18 },
      'trending-up': { icon: 'trending-up', size: 20 },
      'alert-triangle': { icon: 'triangle-alert', size: 20 },
      'alert-triangle-sm': { icon: 'triangle-alert', size: 16 },
      plus: { icon: 'plus', size: 15 },
      'chevron-right': { icon: 'chevron-right', size: 12 },
      'chevron-right-lg': { icon: 'chevron-right', size: 16 },
      'arrow-right': { icon: 'arrow-right', size: 12 },
      activity: { icon: 'activity', size: 16 },
    };
    const entry = sizes[name];
    if (!entry) return '';
    return lucideSvg(entry.icon, entry.size);
  }

  getWorkflowBarWidth(count: number): number {
    
    
    const max = Math.max(...this.workflowData().map(w => w.count), 1);
    return Math.max(0, Math.min(100, (count / max) * 100));
  }

  orderBarHeight(point: { orders: number }): number {
    return Math.max(0, Math.min(100, (point.orders / this.volumeNiceMax()) * 100));
  }

  completedBarHeight(point: { completed: number }): number {
    return Math.max(0, Math.min(100, (point.completed / this.volumeNiceMax()) * 100));
  }

  setHoveredDay(day: string): void {
    this.hoveredDay.set(day);
  }

  clearHoveredDay(): void {
    this.hoveredDay.set(null);
  }

  navigateTo(route: string): void {
    this.navigationService.navigate(route as any);
  }

  navigateToOrder(orderId: string): void {
    this.navigationService.navigate('viewOrder', { orderId });
  }

  getStatusStyles(status: string): { bg: string; fg: string } {
    return this.formatUtils.getStatusStyles(status);
  }
}
