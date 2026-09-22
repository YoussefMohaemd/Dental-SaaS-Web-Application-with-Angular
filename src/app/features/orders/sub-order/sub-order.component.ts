import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { OrderDataService } from '@core/services/order-data.service';
import { SubOrderDataService } from '@core/services/sub-order-data.service';
import { NavigationService } from '@core/services/navigation.service';
import {
  SubOrderContextSnapshot,
  SubOrderFormDraftValue,
  SubOrderFormItem,
  SubOrderScanItem,
  SubOrderScanLocalFile,
  SubOrderTab,
} from '@core/models/sub-order.model';
import { TeethChartComponent } from '@shared/components/teeth-chart/teeth-chart.component';
import { SafeHtmlPipe } from '@shared/pipes/safe-html.pipe';

const TABS: SubOrderTab[] = ['overview', 'forms', 'scans', 'activity'];

const DEFAULT_FORM_VALUES: SubOrderFormDraftValue = {
  clinicalNotes: '',
  occlusalContact: 'Light contact',
  marginType: 'Chamfer',
  material: 'Zirconia (Multilayer)',
  shade: 'A2',
  specialInstructions: '',
};

const OCCLUSAL_CONTACT_OPTIONS = ['Light contact', 'Full contact', 'No contact'];
const MARGIN_TYPE_OPTIONS = ['Chamfer', 'Shoulder', 'Feather edge', 'Knife edge'];
const MATERIAL_OPTIONS = ['Zirconia (Multilayer)', 'PFM', 'E-max', 'PMMA', 'Titanium'];

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
  imports: [CommonModule, FormsModule, TeethChartComponent, SafeHtmlPipe],
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
  readonly activeFormId = signal<string | null>(null);
  readonly formDraft = signal<SubOrderFormDraftValue>(DEFAULT_FORM_VALUES);
  readonly formMessage = signal<string | null>(null);
  readonly scanMessage = signal<string | null>(null);
  readonly dragOver = signal(false);
  readonly selectedScanTarget = signal<string | null>(null);
  readonly maxLocalFileBytes = 100 * 1024 * 1024;
  readonly maxFilesPerScan = 10;

  readonly tabs: SubOrderTab[] = TABS;
  readonly occlusalContactOptions = OCCLUSAL_CONTACT_OPTIONS;
  readonly marginTypeOptions = MARGIN_TYPE_OPTIONS;
  readonly materialOptions = MATERIAL_OPTIONS;

  readonly formsComplete = computed(
    () => this.detail().forms.filter(f => f.status === 'complete').length,
  );
  readonly scansUploaded = computed(
    () => this.detail().scans.filter(s => s.status === 'uploaded' || s.status === 'selected-local').length,
  );

  readonly activeFormItem = computed(() => {
    const formId = this.activeFormId();
    if (!formId) return null;
    return this.detail().forms.find(form => form.id === formId) ?? null;
  });

  readonly activeContext = computed(() => this.buildFormContext());

  readonly scanTargetLabel = computed(() => {
    const targetId = this.selectedScanTarget();
    if (!targetId) return 'Select a requirement';
    const scan = this.detail().scans.find(item => item.id === targetId);
    return scan?.label ?? 'Select a requirement';
  });

  /** React parity: progress = done / required over required forms + scans. */
  readonly progress = computed(() => {
    const d = this.detail();
    const totalRequired =
      d.forms.filter(f => f.required).length + d.scans.filter(s => s.status !== 'optional').length;
    const totalDone =
      d.forms.filter(f => f.status === 'complete').length +
      d.scans.filter(s => s.status === 'uploaded' || s.status === 'selected-local').length;
    return totalRequired > 0 ? Math.round((totalDone / totalRequired) * 100) : 0;
  });

  /** `#ORD-1`-style parent order tag (React parity: param slice). */
  readonly orderTag = computed(() => {
    const id = this.orderId();
    return `#${id ? id.slice(-6).toUpperCase() : 'ORDER'}`;
  });

  setTab(tab: SubOrderTab): void {
    this.tab.set(tab);
    if (tab !== 'forms') {
      this.activeFormId.set(null);
      this.formMessage.set(null);
    }
  }

  /** ngModelChange may be inferred as Event by the template type-checker;
   * normalize to string before writing the signal. */
  onNoteChange(value: string | Event): void {
    const next = typeof value === 'string' ? value : ((value.target as HTMLTextAreaElement | null)?.value ?? '');
    this.note.set(next);
  }

  onPostNote(): void {
    const sub = this.subOrder();
    if (!sub) return;
    this.subOrderService.addActivityNote(sub.id, this.userDisplayName(), this.note());
    this.note.set('');
  }

  openForm(form: SubOrderFormItem): void {
    if (this.activeFormId() === form.id) {
      this.activeFormId.set(null);
      this.formMessage.set(null);
      return;
    }
    this.activeFormId.set(form.id);
    this.formMessage.set(null);
    const fromSaved = form.value?.values;
    this.formDraft.set({
      ...DEFAULT_FORM_VALUES,
      ...fromSaved,
      clinicalNotes: fromSaved?.clinicalNotes || this.subOrder()?.notes || '',
      shade: fromSaved?.shade || this.order()?.shade || 'A2',
    });
  }

  cancelForm(): void {
    this.activeFormId.set(null);
    this.formMessage.set(null);
  }

  setFormField(key: keyof SubOrderFormDraftValue, value: string): void {
    this.formDraft.update(current => ({ ...current, [key]: value }));
  }

  isFormOpen(formId: string): boolean {
    return this.activeFormId() === formId;
  }

  formStatusText(form: SubOrderFormItem): string {
    if (form.status === 'complete') return 'Completed';
    if (form.required) return 'Required';
    if (form.status === 'optional') return 'Optional';
    return 'Pending';
  }

  saveForm(): void {
    const sub = this.subOrder();
    const form = this.activeFormItem();
    if (!sub || !form) return;

    const payload = this.formDraft();
    if (form.required && payload.clinicalNotes.trim().length === 0) {
      this.formMessage.set('Clinical notes are required for this form.');
      return;
    }

    this.subOrderService.saveFormItem(sub.id, form.id, {
      values: payload,
      context: this.buildFormContext(),
      required: form.required,
    });
    this.formMessage.set('Form saved locally for this session.');
    this.activeFormId.set(null);
  }

  openFilePicker(scanId: string, input: HTMLInputElement): void {
    this.selectedScanTarget.set(scanId);
    input.value = '';
    input.click();
  }

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    const scanId = this.selectedScanTarget();
    if (!files || !scanId) return;
    this.handleScanFiles(scanId, Array.from(files));
  }

  onDropZoneSelect(input: HTMLInputElement): void {
    if (!this.selectedScanTarget()) {
      const first = this.detail().scans[0];
      if (first) this.selectedScanTarget.set(first.id);
    }
    input.value = '';
    input.click();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    const target = this.selectedScanTarget() ?? this.detail().scans[0]?.id;
    if (!target) {
      this.scanMessage.set('No scan requirement available to receive files.');
      return;
    }
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) {
      this.scanMessage.set('No files were dropped.');
      return;
    }
    this.handleScanFiles(target, Array.from(files));
  }

  removeLocalFile(scanId: string, fileId: string): void {
    const scan = this.detail().scans.find(item => item.id === scanId);
    if (!scan) return;
    const remaining = (scan.localFiles ?? []).filter(file => file.id !== fileId);
    this.subOrderService.saveScanFiles(this.subOrderId(), scanId, remaining);
  }

  scanStatusLabel(scan: SubOrderScanItem): string {
    if (scan.status === 'selected-local') return 'Selected locally (not uploaded to backend)';
    if (scan.status === 'uploaded') return 'Uploaded';
    if (scan.status === 'optional') return 'Optional';
    return 'Not yet uploaded';
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
      'chevron-right': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
      'chevron-down': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
      'alert-circle': '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
      circle: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>',
      upload: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
      'upload-lg': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
      trash: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>',
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

  private buildFormContext(): SubOrderContextSnapshot {
    const order = this.order();
    const subOrder = this.subOrder();
    return {
      orderId: order?.id ?? '',
      orderNumber: order?.orderNumber ?? '',
      subOrderId: subOrder?.id ?? '',
      service: subOrder?.service ?? '',
      patientName: order?.patientName ?? '',
      doctorName: order?.doctorName ?? '',
      clinicName: order?.clinicName ?? '',
      selectedTeeth: [...(subOrder?.teeth ?? [])],
      caseNotes: subOrder?.notes ?? order?.notes ?? '',
    };
  }

  private handleScanFiles(scanId: string, files: File[]): void {
    if (files.length === 0) {
      this.scanMessage.set('No files selected.');
      return;
    }

    const scan = this.detail().scans.find(item => item.id === scanId);
    if (!scan) {
      this.scanMessage.set('Selected scan requirement was not found.');
      return;
    }

    const currentFiles = scan.localFiles ?? [];
    const spaceLeft = this.maxFilesPerScan - currentFiles.length;
    if (spaceLeft <= 0) {
      this.scanMessage.set(`Maximum ${this.maxFilesPerScan} files allowed for this requirement.`);
      return;
    }

    const nextRows: SubOrderScanLocalFile[] = [...currentFiles];
    const duplicateKeys = new Set(currentFiles.map(file => `${file.name}::${file.sizeBytes}`));
    let oversizeCount = 0;
    let duplicateCount = 0;

    for (const file of files.slice(0, spaceLeft)) {
      if (file.size > this.maxLocalFileBytes) {
        oversizeCount += 1;
        continue;
      }
      const key = `${file.name}::${file.size}`;
      if (duplicateKeys.has(key)) {
        duplicateCount += 1;
        continue;
      }

      duplicateKeys.add(key);
      nextRows.push({
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        sizeBytes: file.size,
        sizeLabel: this.formatFileSize(file.size),
        type: file.type || 'application/octet-stream',
        lastModified: file.lastModified,
        selectedAt: new Date().toISOString(),
      });
    }

    this.subOrderService.saveScanFiles(this.subOrderId(), scanId, nextRows);
    if (oversizeCount === 0 && duplicateCount === 0) {
      this.scanMessage.set(`${nextRows.length - currentFiles.length} file(s) selected locally for ${scan.label}.`);
      return;
    }

    this.scanMessage.set(
      `Added ${nextRows.length - currentFiles.length} file(s). Skipped ${duplicateCount} duplicate and ${oversizeCount} oversized file(s).`,
    );
  }

  private formatFileSize(size: number): string {
    if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    if (size >= 1024) return `${Math.round(size / 1024)} KB`;
    return `${size} B`;
  }

  private userDisplayName(): string {
    return 'Jessica Ruiz';
  }
}
