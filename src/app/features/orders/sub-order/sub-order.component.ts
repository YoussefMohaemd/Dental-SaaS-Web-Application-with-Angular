import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { OrderDataService } from '@core/services/order-data.service';
import { SubOrderDataService } from '@core/services/sub-order-data.service';
import { NavigationService } from '@core/services/navigation.service';
import { SubOrderTab } from '@core/models/sub-order.model';
import { TeethChartComponent } from '@shared/components/teeth-chart/teeth-chart.component';

const TABS: SubOrderTab[] = ['overview', 'forms', 'scans', 'activity'];

/**
 * Sub-order detail page (React parity: SubOrderPage.tsx).
 * Root cause of the previous mismatch: this page rendered a bespoke
 * workflow-tracker + reactive clinical form + CDK upload manager that do not
 * exist in React. React is a read-oriented detail view: header with
 * back-navigation, status + priority, overall progress card, tab bar
 * (Overview / Forms / Scans / Activity), per-tab content, a read-only tooth
 * chart and a note composer. This rewrite restores that structure 1:1.
 * State uses Signals; detail data comes from SubOrderDataService.
 */
@Component({
  selector: 'app-sub-order',
  standalone: true,
  imports: [CommonModule, FormsModule, TeethChartComponent],
  templateUrl: './sub-order.component.html',
  styleUrl: './sub-order.component.scss',
})
export class SubOrderComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderDataService);
  private readonly subOrderService = inject(SubOrderDataService);
  protected readonly navigationService = inject(NavigationService);

  private readonly paramMap = toSignal(this.route.paramMap, { initialValue: null });
  private readonly queryParamMap = toSignal(this.route.queryParamMap, { initialValue: null });

  readonly orderId = computed(() => this.paramMap()?.get('orderId') ?? '');
  readonly subOrderId = computed(() => this.paramMap()?.get('subOrderId') ?? 'so-2');

  readonly order = computed(
    () => this.orderService.getOrderById(this.orderId()) ?? this.orderService.orders()[0],
  );
  readonly subOrder = computed(
    () => this.subOrderService.getById(this.subOrderId()) ?? this.subOrderService.subOrders()[0],
  );
  readonly detail = computed(() => {
    const sub = this.subOrder();
    return this.subOrderService.getDetailById(sub?.id ?? this.subOrderId());
  });

  /** Initial tab honors ?tab= (React parity: params.subOrderTab). */
  readonly tab = signal<SubOrderTab>(
    (this.queryParamMap()?.get('tab') as SubOrderTab | null) ?? 'overview',
  );
  readonly note = signal('');

  readonly tabs: SubOrderTab[] = TABS;

  readonly formsComplete = computed(
    () => this.detail().forms.filter(f => f.status === 'complete').length,
  );
  readonly scansUploaded = computed(
    () => this.detail().scans.filter(s => s.status === 'uploaded').length,
  );

  /** React parity: progress = done / required over required forms + scans. */
  readonly progress = computed(() => {
    const d = this.detail();
    const totalRequired =
      d.forms.filter(f => f.required).length + d.scans.filter(s => s.status !== 'optional').length;
    const totalDone =
      d.forms.filter(f => f.status === 'complete').length +
      d.scans.filter(s => s.status === 'uploaded').length;
    return totalRequired > 0 ? Math.round((totalDone / totalRequired) * 100) : 0;
  });

  /** `#ORD-1`-style parent order tag (React parity: param slice). */
  readonly orderTag = computed(() => {
    const id = this.orderId();
    return `#${id ? id.slice(-6).toUpperCase() : 'ORDER'}`;
  });

  setTab(tab: SubOrderTab): void {
    this.tab.set(tab);
  }

  /** ngModelChange may be inferred as Event by the template type-checker;
   * normalize to string before writing the signal. */
  onNoteChange(value: string | Event): void {
    const next = typeof value === 'string' ? value : ((value.target as HTMLTextAreaElement | null)?.value ?? '');
    this.note.set(next);
  }

  goBack(): void {
    const current = this.order();
    if (current) this.navigationService.navigate('viewOrder', { orderId: current.id });
    else this.navigationService.navigate('orders');
  }

  goToParentOrder(): void {
    this.goBack();
  }

  priorityPillClasses(): string {
    return this.subOrder()?.priority === 'High'
      ? 'border-warning/40 text-warning'
      : 'border-border text-muted-foreground';
  }

  statusBadgeClasses(): string {
    const status = this.subOrder()?.status;
    if (status === 'completed') return 'bg-success/10 text-success';
    if (status === 'in-progress') return 'bg-primary/10 text-primary';
    return 'bg-muted text-muted-foreground';
  }

  statusLabel(): string {
    const status = this.subOrder()?.status;
    if (status === 'completed') return 'Completed';
    if (status === 'in-progress') return 'In Progress';
    if (status === 'blocked') return 'Blocked';
    return 'Pending';
  }

  getStatusIconSvg(size = 10): string {
    const status = this.subOrder()?.status;
    const common = `width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
    if (status === 'completed') {
      return `<svg ${common}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    }
    if (status === 'in-progress') {
      return `<svg ${common}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
    }
    return `<svg ${common}><circle cx="12" cy="12" r="10"/></svg>`;
  }

  getIconSvg(name: string): string {
    const icons: Record<string, string> = {
      'arrow-left': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
      'file-text': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
      'file-text-sm': '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
      'scan-line': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/></svg>',
      check: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
      'check-circle': '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      'check-circle-lg': '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      'alert-circle': '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
      circle: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>',
      upload: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
      'upload-lg': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
    };
    return icons[name] || '';
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}
