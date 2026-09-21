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

/** Order statuses mapped onto the six React workflow stages. */
const WORKFLOW_STAGES: { name: string; color: string; statuses: string[] }[] = [
  { name: 'New', color: '#94A3B8', statuses: ['New'] },
  { name: 'Review', color: '#F59E0B', statuses: ['Review'] },
  { name: 'Design', color: '#06B6D4', statuses: ['Design'] },
  { name: 'Production', color: '#2563EB', statuses: ['Production'] },
  { name: 'QC', color: '#8B5CF6', statuses: ['Quality Check'] },
  { name: 'Ready', color: '#10B981', statuses: ['Ready', 'Completed'] },
];

/** React DashboardPage workflowData — fallback while orders load. */
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
    EmptyStateComponent
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

  /** Activity feed is driven by the shared notification store (React parity). */
  readonly activity = computed(() => this.notificationService.notifications().slice(0, 10));

  /** Order Volume chart data comes from dashboard-volume.json (no hardcoded arrays). */
  readonly weeklyData = this.volumeService.currentDays;

  /** Nice-rounded axis maximum for the volume chart (recharts-style ticks). */
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

  /** Workflow distribution is derived live from order statuses (React stages). */
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

  /** Hovered day for the volume-chart tooltip (recharts Tooltip parity). */
  readonly hoveredDay = signal<string | null>(null);

  readonly today = new Date();

  constructor() {
    // Root cause fix: stat cards were only computed once in ngOnInit, so they
    // stayed at 0 when orders/cases arrived asynchronously after first render.
    // This effect re-syncs the card values whenever the underlying signals change.
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
    const icons: Record<string, string> = {
      'clipboard-list': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>',
      'folder-open': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"></path></svg>',
      'clock': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
      'check-circle-2': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
      'trending-up': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>',
      'alert-triangle': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
      'alert-triangle-sm': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
      'plus': '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>',
      'chevron-right': '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>',
      'chevron-right-lg': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>',
      'arrow-right': '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>',
      'activity': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>'
    };
    return icons[name] || '';
  }

  getWorkflowBarWidth(count: number): number {
    // Root cause fix: bars were scaled against a hardcoded 20 while the real
    // max count is 12, capping every bar at 60%. Scale against the data max.
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
