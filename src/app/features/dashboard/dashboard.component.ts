import { CommonModule } from "@angular/common";
import { Component, computed, inject, OnInit } from "@angular/core";
import { CaseDataService } from "@core/services/case-data.service";
import { FormatUtils } from "@core/services/format-utils.service";
import { NavigationService } from "@core/services/navigation.service";
import { OrderDataService } from "@core/services/order-data.service";
import { ButtonComponent } from "@shared/components/button/button.component";
import { EmptyStateComponent } from "@shared/components/empty-state/empty-state.component";
import { LoadingStateComponent } from "@shared/components/loading-state/loading-state.component";
import { PriorityBadgeComponent } from "@shared/components/priority-badge/priority-badge.component";
import { StatusBadgeComponent } from "@shared/components/status-badge/status-badge.component";

interface WeeklyDataPoint {
  day: string;
  orders: number;
  completed: number;
}

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

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
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
  readonly formatUtils = inject(FormatUtils);

  readonly orders = this.orderService.orders;
  readonly cases = this.caseService.cases;
  readonly loading = this.orderService.loading;
  readonly urgentOrdersCount = this.orderService.urgentOrdersCount;
  readonly completedTodayCount = this.orderService.completedTodayCount;

  readonly totalOrders = computed(() => this.orders().length);
  readonly activeCases = computed(() => this.cases().filter(c => c.status !== 'Closed').length);
  readonly pendingReview = computed(() => this.orders().filter(o => o.status === 'Review').length);
  readonly completedToday = this.completedTodayCount;

  readonly recentOrders = computed(() =>
    [...this.orders()].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 7)
  );

  readonly notifications = [
    { id: 'n1', type: 'order', title: 'New Order Received', message: 'Order DL-024023 from Dr. Sophia Lin has been received and is awaiting review.', read: false, createdAt: '2024-12-16T10:00:00Z' },
    { id: 'n2', type: 'workflow', title: 'Order Ready for Pickup', message: 'Order DL-024017 for Alice Johnson is now Ready and awaiting clinic collection.', read: false, createdAt: '2024-12-16T14:30:00Z' },
    { id: 'n3', type: 'file', title: 'Files Uploaded', message: '3 new scan files were uploaded for Order DL-024011.', read: false, createdAt: '2024-12-15T09:00:00Z' },
    { id: 'n4', type: 'request', title: 'Change Request Submitted', message: 'CR-03005 submitted by Dr. Marcus Webb — shade modification requested.', read: false, createdAt: '2024-12-15T16:00:00Z' },
    { id: 'n5', type: 'billing', title: 'Invoice Overdue', message: 'Invoice INV-010008 for Pacific Dental Group is 5 days overdue.', read: true, createdAt: '2024-12-14T11:00:00Z' },
    { id: 'n6', type: 'order', title: 'Order Completed', message: 'Order DL-024009 — Crown for Benjamin Clarke — has been completed.', read: true, createdAt: '2024-12-14T15:00:00Z' },
    { id: 'n7', type: 'workflow', title: 'Production Delayed', message: 'Order DL-024031 has been flagged for review — minor occlusal adjustment required.', read: true, createdAt: '2024-12-13T10:00:00Z' },
    { id: 'n8', type: 'system', title: 'Maintenance Window', message: 'Scheduled maintenance on Dec 20 from 02:00–04:00 AM PST. No downtime expected.', read: true, createdAt: '2024-12-12T08:00:00Z' },
    { id: 'n9', type: 'order', title: 'Rush Order Created', message: 'Urgent order DL-024045 has been flagged for priority production.', read: true, createdAt: '2024-12-12T14:00:00Z' },
    { id: 'n10', type: 'file', title: 'Scan Approval Required', message: 'Scan files for Order DL-024038 require technician approval before production.', read: true, createdAt: '2024-12-11T16:00:00Z' }
  ];

  readonly weeklyData: WeeklyDataPoint[] = [
    { day: 'Mon', orders: 14, completed: 11 },
    { day: 'Tue', orders: 18, completed: 15 },
    { day: 'Wed', orders: 12, completed: 10 },
    { day: 'Thu', orders: 21, completed: 18 },
    { day: 'Fri', orders: 16, completed: 13 },
    { day: 'Sat', orders: 8, completed: 7 },
    { day: 'Sun', orders: 5, completed: 5 }
  ];

  readonly workflowData: WorkflowDataPoint[] = [
    { name: 'New', count: 8, color: '#94A3B8' },
    { name: 'Review', count: 5, color: '#F59E0B' },
    { name: 'Design', count: 7, color: '#06B6D4' },
    { name: 'Production', count: 12, color: '#2563EB' },
    { name: 'QC', count: 4, color: '#8B5CF6' },
    { name: 'Ready', count: 6, color: '#10B981' }
  ];

  readonly statCards: StatCardData[] = [
    { label: 'Total Orders', value: 0, sub: 'This month', icon: 'clipboard-list', color: 'bg-primary', route: 'orders' },
    { label: 'Active Cases', value: 0, sub: '0 in progress', icon: 'folder-open', color: 'bg-accent', route: 'cases' },
    { label: 'Pending Review', value: 0, sub: 'Awaiting approval', icon: 'clock', color: 'bg-warning', route: 'orders' },
    { label: 'Completed Today', value: 0, sub: 'Orders delivered', icon: 'check-circle-2', color: 'bg-success', route: 'orders' }
  ];

  readonly quickStats = [
    { label: 'Revenue This Month', value: '$0', sub: '+12% vs last month', icon: 'trending-up', color: 'text-success' },
    { label: 'Avg Turnaround', value: '2.4 days', sub: 'Crown & Bridge', icon: 'clock', color: 'text-primary' },
    { label: 'Change Requests', value: '4 open', sub: '2 require action today', icon: 'alert-triangle', color: 'text-warning' }
  ];

  readonly today = new Date();

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
    const total = this.orders().reduce((sum, o) => sum + o.amount, 0);
    return this.formatUtils.formatCurrency(total);
  }

  getIconSvg(name: string): string {
    const icons: Record<string, string> = {
      'clipboard-list': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>',
      'folder-open': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"></path></svg>',
      'clock': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
      'check-circle-2': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
      'trending-up': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>',
      'alert-triangle': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'
    };
    return icons[name] || '';
  }

  getWorkflowBarWidth(count: number): number {
    return (count / 20) * 100;
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