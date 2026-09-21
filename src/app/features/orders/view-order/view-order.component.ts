import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { OrderDataService } from '@core/services/order-data.service';
import { PatientDataService } from '@core/services/patient-data.service';
import { DoctorDataService } from '@core/services/doctor-data.service';
import { ClinicDataService } from '@core/services/clinic-data.service';
import { NavigationService } from '@core/services/navigation.service';
import { FormatUtils } from '@core/services/format-utils.service';
import { Order, Patient, Doctor, Clinic } from '@core/models';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { ButtonComponent } from '@shared/components/button/button.component';

interface SubOrder {
  id: string;
  service: string;
  icon: string;
  status: 'completed' | 'in-progress' | 'pending' | 'blocked';
  formsComplete: number;
  formsTotal: number;
  scansComplete: number;
  scansTotal: number;
  teeth: number[];
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  dueDate: string;
  notes: string;
}

const SUB_ORDERS: SubOrder[] = [
  {
    id: 'so-1', service: 'Surgical Guide', icon: '🦷',
    status: 'completed', formsComplete: 3, formsTotal: 3, scansComplete: 3, scansTotal: 3,
    teeth: [14, 15, 24, 25], priority: 'High', dueDate: '2024-03-15',
    notes: 'Standard surgical guide for dual implant placement.',
  },
  {
    id: 'so-2', service: 'GFMR', icon: '⚙️',
    status: 'in-progress', formsComplete: 2, formsTotal: 3, scansComplete: 1, scansTotal: 3,
    teeth: [11, 12, 13, 21, 22, 23], priority: 'High', dueDate: '2024-03-20',
    notes: 'Full mouth rehabilitation, occlusal vertical dimension to be confirmed.',
  },
  {
    id: 'so-3', service: 'Final Restoration', icon: '✨',
    status: 'pending', formsComplete: 0, formsTotal: 2, scansComplete: 0, scansTotal: 2,
    teeth: [16, 17, 26, 27], priority: 'Normal', dueDate: '2024-04-01',
    notes: 'Posterior zirconia crowns — shade A2 with characterization.',
  },
  {
    id: 'so-4', service: 'Treatment Plan', icon: '📋',
    status: 'pending', formsComplete: 1, formsTotal: 2, scansComplete: 0, scansTotal: 1,
    teeth: [], priority: 'Normal', dueDate: '2024-03-10',
    notes: 'Comprehensive treatment plan review with the clinic team.',
  },
];

const STAGES = ['Received', 'Scanning', 'Design', 'Fabrication', 'QC', 'Dispatch', 'Delivered'];

/**
 * Scale an inline icon SVG to an explicit pixel size (React parity: lucide
 * icons take a `size` prop). Replaces the declared width/height so one shape
 * definition serves every usage size without wrapper-span hacks (which do
 * not scale inner SVGs).
 */
function withIconSize(svg: string, size?: number): string {
  if (!svg || size == null) return svg;
  return svg
    .replace(/width="\d+"/, `width="${size}"`)
    .replace(/height="\d+"/, `height="${size}"`);
}

@Component({
  selector: 'app-view-order',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    AvatarComponent,
    ButtonComponent
  ],
  templateUrl: './view-order.component.html',
  styleUrl: './view-order.component.scss'
})
export class ViewOrderComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderDataService);
  private readonly patientService = inject(PatientDataService);
  private readonly doctorService = inject(DoctorDataService);
  private readonly clinicService = inject(ClinicDataService);
  protected readonly navigationService = inject(NavigationService);
  protected readonly formatUtils = inject(FormatUtils);

  private readonly paramMap = toSignal(this.route.paramMap, { initialValue: null });
  private readonly orderId = computed(() => this.paramMap()?.get('orderId') ?? '');

  // Dialog / menu / note state (Signals)
  readonly moreMenuOpen = signal(false);
  readonly noteDialogVisible = signal(false);
  readonly noteText = signal('');
  readonly noteSaving = signal(false);
  readonly noteSaved = signal(false);
  readonly notes = signal<{ text: string; at: string }[]>([]);
  readonly confirmDeleteVisible = signal(false);
  readonly actionMessage = signal<string | null>(null);

  readonly order = computed(() => {
    const id = this.orderId();
    return this.orderService.getOrderById(id) || this.orderService.orders()[0];
  });

  readonly patient = computed(() => {
    const order = this.order();
    return this.patientService.getPatientById(order.patientId);
  });

  readonly doctor = computed(() => {
    const order = this.order();
    return this.doctorService.getDoctorById(order.doctorId);
  });

  readonly clinic = computed(() => {
    const order = this.order();
    return this.clinicService.getClinicById(order.clinicId);
  });

  readonly completedServices = computed(() => SUB_ORDERS.filter(s => s.status === 'completed').length);
  readonly totalServices = SUB_ORDERS.length;
  readonly overallProgress = computed(() => Math.round((this.completedServices() / this.totalServices) * 100));
  readonly currentStage = 3;
  readonly stages: string[] = STAGES;
  readonly subOrders: SubOrder[] = SUB_ORDERS;

  ngOnInit(): void {}

  openMoreMenu(): void {
    this.moreMenuOpen.update(v => !v);
  }

  closeMoreMenu(): void {
    this.moreMenuOpen.set(false);
  }

  openNoteDialog(): void {
    this.noteDialogVisible.set(true);
    this.noteSaved.set(false);
    this.closeMoreMenu();
  }

  closeNoteDialog(): void {
    if (this.noteSaving()) return;
    this.noteDialogVisible.set(false);
  }

  /** ngModelChange may be inferred as Event by the template type-checker;
   * normalize to string before writing the signal. */
  onNoteTextChange(value: string | Event): void {
    const next = typeof value === 'string' ? value : ((value.target as HTMLTextAreaElement | null)?.value ?? '');
    this.noteText.set(next);
  }

  saveNote(): void {
    const text = this.noteText().trim();
    if (!text) return;
    this.noteSaving.set(true);
    window.setTimeout(() => {
      this.notes.update(current => [...current, { text, at: new Date().toISOString() }]);
      this.noteText.set('');
      this.noteSaving.set(false);
      this.noteSaved.set(true);
      window.setTimeout(() => {
        this.noteDialogVisible.set(false);
        this.noteSaved.set(false);
      }, 900);
    }, 600);
  }

  exportOrder(): void {
    const current = this.order();
    if (!current) return;
    const blob = new Blob([JSON.stringify(current, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${current.orderNumber}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    this.flashAction('Order exported as JSON.');
    this.closeMoreMenu();
  }

  askDelete(): void {
    this.confirmDeleteVisible.set(true);
    this.closeMoreMenu();
  }

  cancelDelete(): void {
    this.confirmDeleteVisible.set(false);
  }

  confirmDelete(): void {
    const current = this.order();
    if (current) this.orderService.deleteOrder(current.id);
    this.confirmDeleteVisible.set(false);
    this.navigationService.navigate('orders');
  }

  private flashAction(message: string): void {
    this.actionMessage.set(message);
    window.setTimeout(() => {
      if (this.actionMessage() === message) this.actionMessage.set(null);
    }, 2600);
  }

  formatSubOrderId(index: number): string {
    return `SO-${String(index + 1).padStart(2, '0')}`;
  }

  subOrderProgress(sub: SubOrder): number {
    const forms = sub.formsTotal === 0 ? 1 : sub.formsComplete / sub.formsTotal;
    const scans = sub.scansTotal === 0 ? 1 : sub.scansComplete / sub.scansTotal;
    return Math.round(((forms + scans) / 2) * 100);
  }

  navigateToCreateOrder(): void {
    this.navigationService.navigate('createOrder');
  }

  navigateToEditOrder(): void {
    this.navigationService.navigate('editOrder', { orderId: this.order().id });
  }

  navigateToWorkflow(): void {
    this.navigationService.navigate('orderWorkflow', { orderId: this.order().id });
  }

  navigateToFiles(): void {
    this.navigationService.navigate('orderFiles', { orderId: this.order().id });
  }

  navigateToPatient(): void {
    this.navigationService.navigate('patientDetails', { patientId: this.order().patientId });
  }

  navigateToDoctor(): void {
    this.navigationService.navigate('doctorDetails', { doctorId: this.order().doctorId });
  }

  navigateToClinic(): void {
    this.navigationService.navigate('clinicDetails', { clinicId: this.order().clinicId });
  }

  navigateToSubOrder(subOrderId: string): void {
    this.navigationService.navigate('subOrder', { orderId: this.order().id, subOrderId });
  }

  getStatusConfig(status: string) {
    const configs: Record<string, { label: string; color: string; bg: string; icon: string }> = {
      completed: { label: 'Completed', color: 'text-success', bg: 'bg-success/10', icon: 'check-circle-2' },
      'in-progress': { label: 'In Progress', color: 'text-primary', bg: 'bg-primary/10', icon: 'clock' },
      pending: { label: 'Pending', color: 'text-muted-foreground', bg: 'bg-muted', icon: 'circle' },
      blocked: { label: 'Blocked', color: 'text-danger', bg: 'bg-danger/10', icon: 'alert-triangle' }
    };
    return configs[status] || configs['pending'];
  }

  getStatusIconSvg(name: string, size = 12): string {
    const icons: Record<string, string> = {
      'check-circle-2': '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
      clock: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
      circle: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle></svg>',
      'alert-triangle': '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'
    };
    // React parity: sub-order status badges use 9px icons while the stage
    // rail uses 12px — scale the same shapes instead of duplicating them.
    return withIconSize(icons[name] || '', size);
  }

  getStageSvg(name: string, size?: number): string {
    const icons: Record<string, string> = {
      'chevron-right': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>',
      'chevron-left': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>',
      // React parity: ViewOrderPage back button uses ArrowLeft (←), not a chevron.
      'arrow-left': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>',
      'layers': '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>',
      'scan-line': '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path><path d="M7 12h10"></path></svg>',
      'message-square': '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
      'edit': '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
      'download': '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
      // React parity: MoreHorizontal size={16} on the header action.
      'more-horizontal': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>',
      'file-text': '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>'
    };
    return withIconSize(icons[name] || '', size);
  }

  getProgressRingSvg(value: number, size = 48): string {
    const r = (size - 6) / 2;
    const circ = 2 * Math.PI * r;
    const dash = (value / 100) * circ;
    return `
      <svg width="${size}" height="${size}" class="shrink-0 -rotate-90">
        <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--color-border)" stroke-width="4" />
        <circle
          cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none"
          stroke="${value === 100 ? 'var(--color-success)' : 'var(--color-primary)'}"
          stroke-width="4" stroke-linecap="round"
          stroke-dasharray="${dash} ${circ}"
        />
      </svg>
    `;
  }
}
