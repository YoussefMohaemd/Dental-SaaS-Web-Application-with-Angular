import { Component, computed, ElementRef, HostListener, inject, OnInit, signal } from '@angular/core';
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
import { SafeHtmlPipe } from '@shared/pipes/safe-html.pipe';
import { lucideSvg } from '@shared/icons/lucide-icons';

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
    ButtonComponent,
    SafeHtmlPipe
  ],
  templateUrl: './view-order.component.html',
  styleUrl: './view-order.component.scss'
})
export class ViewOrderComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly host = inject(ElementRef);
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

  /** React parity: clicking outside the overflow menu dismisses it. */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.moreMenuOpen()) return;
    const target = event.target as Node | null;
    if (target && !this.host.nativeElement.contains(target)) {
      this.moreMenuOpen.set(false);
    }
  }

  /** Dismiss the overflow menu with Escape for keyboard users. */
  @HostListener('document:keydown.escape')
  onEscape(): void {
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
    // Exact React parity: completed=CheckCircle2(12 white), in-progress=Clock,
    // pending=Circle, blocked=AlertTriangle. Sub-order badges use 9px.
    const map: Record<string, string> = {
      'check-circle-2': 'circle-check',
      clock: 'clock',
      circle: 'circle',
      'alert-triangle': 'triangle-alert',
    };
    return lucideSvg(map[name] ?? name, size);
  }

  getStageSvg(name: string, size?: number): string {
    // Exact React parity (ViewOrderPage.tsx): ArrowLeft 18, Edit2(pen) 13,
    // Download 13, MoreHorizontal(ellipsis) 16, Layers/FileText/ScanLine 11,
    // ChevronRight 14/12, MessageSquare 13.
    const defaults: Record<string, { icon: string; size: number }> = {
      'chevron-right': { icon: 'chevron-right', size: 14 },
      'chevron-left': { icon: 'chevron-left', size: 18 },
      'arrow-left': { icon: 'arrow-left', size: 18 },
      layers: { icon: 'layers', size: 13 },
      'scan-line': { icon: 'scan-line', size: 13 },
      'message-square': { icon: 'message-square', size: 13 },
      edit: { icon: 'pen', size: 13 },
      download: { icon: 'download', size: 13 },
      'more-horizontal': { icon: 'ellipsis', size: 16 },
      'file-text': { icon: 'file-text', size: 13 },
    };
    const entry = defaults[name];
    if (!entry) return '';
    return lucideSvg(entry.icon, size ?? entry.size);
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
