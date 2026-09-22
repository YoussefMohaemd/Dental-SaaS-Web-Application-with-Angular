import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientDataService } from '@core/services/patient-data.service';
import { DoctorDataService } from '@core/services/doctor-data.service';
import { ClinicDataService } from '@core/services/clinic-data.service';
import { NavigationService } from '@core/services/navigation.service';
import { ButtonComponent } from '@shared/components/button/button.component';
import { TeethChartComponent } from '@shared/components/teeth-chart/teeth-chart.component';
import { SafeHtmlPipe } from '@shared/pipes/safe-html.pipe';

interface Service {
  id: string;
  name: string;
  description: string;
  icon: string;
  scanRequirements: string[];
}

export interface ServiceDetail {
  shade: string;
  arch: string;
  occlusalConcept: string;
  implantSystem: string;
  fileFormat: string;
  serviceNotes: string;
}

export interface ServiceClinicalForm {
  clinicalNotes: string;
  occlusalContact: string;
  marginType: string;
  material: string;
  specialInstructions: string;
}

const SERVICES: Service[] = [
  { id: 'treatment-plan', name: 'Treatment Plan', description: 'Comprehensive treatment planning with diagnostic data and clinical workflow.', icon: '📋', scanRequirements: ['Full arch STL', 'Bite registration'] },
  { id: 'surgical-guide', name: 'Surgical Guide', description: 'Precision-guided implant surgery using CT and digital planning.', icon: '🦷', scanRequirements: ['CBCT / CT scan', 'STL dental model', 'Supporting reference files'] },
  { id: 'gfmr', name: 'GFMR', description: 'Full-mouth rehabilitation with a guided functional occlusal approach.', icon: '⚙️', scanRequirements: ['Upper arch scan', 'Lower arch scan', 'Bite scan'] },
  { id: 'fmb', name: 'FMB / FMP', description: 'Full-mouth bridge or partial restoration fabricated to precision.', icon: '🔬', scanRequirements: ['Upper arch STL', 'Lower arch STL'] },
  { id: 'temp-restoration', name: 'Temporary Restoration', description: 'Interim restorations to protect and maintain occlusion during treatment.', icon: '🛡️', scanRequirements: ['Working model scan', 'Antagonist scan'] },
  { id: 'final-restoration', name: 'Final Restoration', description: 'Definitive crowns, bridges, veneers, or full-arch restorations.', icon: '✨', scanRequirements: ['Prep scan', 'Antagonist scan', 'Shade reference photo'] },
  { id: 'full-guide', name: 'Full Guide Case', description: 'End-to-end digital workflow with guided surgery and final prosthetics.', icon: '🔑', scanRequirements: ['CBCT / CT scan', 'Full arch STL', 'Diagnostic model', 'Bite registration'] },
  { id: 'other', name: 'Other Service', description: 'Custom lab service or specialized dental work not listed above.', icon: '➕', scanRequirements: ['As specified'] },
];

const STEPS = [
  { id: 1, label: 'Patient & Clinic', short: 'Patient' },
  { id: 2, label: 'Services', short: 'Services' },
  { id: 3, label: 'Teeth Selection', short: 'Teeth' },
  { id: 4, label: 'Service Details', short: 'Details' },
  { id: 5, label: 'Forms', short: 'Forms' },
  { id: 6, label: 'Scans & Files', short: 'Files' },
  { id: 7, label: 'Review', short: 'Review' },
];

const SHADES = ['A1', 'A2', 'A3', 'A3.5', 'B1', 'B2', 'C2', 'D3', 'BL1', 'BL2'];
const FILE_FORMATS = ['STL', 'PLY', 'OBJ', 'DICOM', 'STL+OBJ'];
const OCCLUSAL_CONCEPTS = ['Mutually Protected', 'Group Function', 'Full Balanced'];
const IMPLANT_SYSTEMS = ['Straumann', 'Nobel Biocare', 'Zimmer Biomet', 'Neodent', 'Other'];
const OCCLUSAL_CONTACTS = ['Light contact', 'Full contact', 'No contact'];
const MARGIN_TYPES = ['Chamfer', 'Shoulder', 'Feather edge', 'Knife edge'];
const MATERIALS = ['Zirconia (Multilayer)', 'PFM', 'E-max', 'PMMA', 'Titanium'];

function defaultDetail(): ServiceDetail {
  return {
    shade: 'A2',
    arch: 'Both',
    occlusalConcept: 'Mutually Protected',
    implantSystem: 'Straumann',
    fileFormat: 'STL',
    serviceNotes: '',
  };
}

function defaultClinicalForm(): ServiceClinicalForm {
  return {
    clinicalNotes: '',
    occlusalContact: 'Light contact',
    marginType: 'Chamfer',
    material: 'Zirconia (Multilayer)',
    specialInstructions: '',
  };
}

@Component({
  selector: 'app-create-order',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, TeethChartComponent, SafeHtmlPipe],
  templateUrl: './create-order.component.html',
  styleUrl: './create-order.component.scss'
})
export class CreateOrderComponent {
  private readonly patientService = inject(PatientDataService);
  private readonly doctorService = inject(DoctorDataService);
  private readonly clinicService = inject(ClinicDataService);
  protected readonly navigationService = inject(NavigationService);

  readonly patients = this.patientService.patients;
  readonly doctors = this.doctorService.doctors;
  readonly clinics = this.clinicService.clinics;

  readonly step = signal(1);
  readonly selectedServices = signal<string[]>([]);
  readonly selectedTeeth = signal<number[]>([]);
  readonly serviceTeeth = signal<Record<string, number[]>>({});
  readonly activeServiceForTeeth = signal<string | null>(null);

  readonly form = signal({
    patientId: '',
    doctorId: '',
    clinicId: '',
    priority: 'Normal',
    dueDate: '',
    notes: '',
    shade: 'A2',
    format: 'STL',
  });

  /** Per-service fabrication details (Step 4, React parity). */
  readonly serviceDetails = signal<Record<string, ServiceDetail>>({});
  /** Per-service clinical forms (Step 5, React parity). */
  readonly serviceForms = signal<Record<string, ServiceClinicalForm>>({});

  readonly selectedPatient = computed(() => this.patients().find(p => p.id === this.form().patientId));
  readonly selectedDoctor = computed(() => this.doctors().find(d => d.id === this.form().doctorId));
  readonly selectedClinic = computed(() => this.clinics().find(c => c.id === this.form().clinicId));
  readonly selectedServiceObjects = computed(() => SERVICES.filter(s => this.selectedServices().includes(s.id)));
  /** Service names for the tooth chart legend (React parity). */
  readonly serviceNames = computed(() => this.selectedServiceObjects().map(s => s.name));
  /** serviceTeeth keyed by service NAME for the chart (React maps id -> name). */
  readonly serviceTeethByName = computed(() => {
    const byId = this.serviceTeeth();
    const out: Record<string, number[]> = {};
    for (const [id, teeth] of Object.entries(byId)) {
      out[SERVICES.find(s => s.id === id)?.name ?? id] = teeth;
    }
    return out;
  });
  readonly steps = STEPS;
  readonly services: Service[] = SERVICES;
  readonly shades = SHADES;
  readonly fileFormats = FILE_FORMATS;
  readonly occlusalConcepts = OCCLUSAL_CONCEPTS;
  readonly implantSystems = IMPLANT_SYSTEMS;
  readonly occlusalContacts = OCCLUSAL_CONTACTS;
  readonly marginTypes = MARGIN_TYPES;
  readonly materials = MATERIALS;

  /** React parity: only Active clinics are offered in Step 1. */
  readonly activeClinics = computed(() => this.clinics().filter(c => c.status === 'Active'));

  readonly doctorsForClinic = computed(() => {
    const clinicId = this.form().clinicId;
    if (!clinicId) return this.doctors();
    return this.doctors().filter(d => d.clinicId === clinicId);
  });

  /** All teeth across general + per-service assignment (Review summary). */
  readonly allTeethCombined = computed(() => {
    const set = new Set<number>(this.selectedTeeth());
    for (const teeth of Object.values(this.serviceTeeth())) {
      for (const t of teeth) set.add(t);
    }
    return [...set].sort((a, b) => a - b);
  });

  readonly hasAnyTeeth = computed(
    () => this.selectedTeeth().length > 0 || Object.values(this.serviceTeeth()).some(v => v.length > 0)
  );

  setField(key: string, value: string): void {
    this.form.update(f => ({ ...f, [key]: value }));
  }

  setClinicAndResetDoctor(clinicId: string): void {
    this.setField('clinicId', clinicId);
    this.setField('doctorId', '');
  }

  toggleService(id: string): void {
    this.selectedServices.update(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
    // Lazily seed per-service detail + clinical form records (React parity:
    // each selected service gets dedicated Details/Forms/Files sections).
    if (!this.serviceDetails()[id]) {
      this.serviceDetails.update(prev => ({ ...prev, [id]: defaultDetail() }));
    }
    if (!this.serviceForms()[id]) {
      this.serviceForms.update(prev => ({ ...prev, [id]: defaultClinicalForm() }));
    }
  }

  setServiceDetail(serviceId: string, key: keyof ServiceDetail, value: string): void {
    this.serviceDetails.update(prev => ({
      ...prev,
      [serviceId]: { ...(prev[serviceId] ?? defaultDetail()), [key]: value },
    }));
  }

  getServiceDetail(serviceId: string): ServiceDetail {
    return this.serviceDetails()[serviceId] ?? defaultDetail();
  }

  setServiceForm(serviceId: string, key: keyof ServiceClinicalForm, value: string): void {
    this.serviceForms.update(prev => ({
      ...prev,
      [serviceId]: { ...(prev[serviceId] ?? defaultClinicalForm()), [key]: value },
    }));
  }

  getServiceForm(serviceId: string): ServiceClinicalForm {
    return this.serviceForms()[serviceId] ?? defaultClinicalForm();
  }

  /** Whether a restoration service shows Shade/Arch fields (React parity). */
  needsShadeArch(serviceId: string): boolean {
    return serviceId === 'fmb' || serviceId === 'final-restoration' || serviceId === 'temp-restoration';
  }

  toggleTooth(num: number): void {
    const active = this.activeServiceForTeeth();
    if (active) {
      this.serviceTeeth.update(prev => {
        const cur = prev[active] || [];
        return { ...prev, [active]: cur.includes(num) ? cur.filter(n => n !== num) : [...cur, num] };
      });
    } else {
      this.selectedTeeth.update(prev => prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]);
    }
  }

  allSelectedTeeth(): number[] {
    return this.visibleSelectedTeeth();
  }

  /**
   * Teeth visible in the step-3 chart (root cause fix: this was a plain method
   * reading signals during template evaluation, so change detection could not
   * track the dependency and the chart sometimes rendered a stale selection.
   * As a computed, the chart input updates reliably on every toggle).
   */
  readonly visibleSelectedTeeth = computed(() => {
    const active = this.activeServiceForTeeth();
    return active ? [...(this.serviceTeeth()[active] || [])] : [...this.selectedTeeth()];
  });

  teethForService(serviceId: string): number[] {
    return this.serviceTeeth()[serviceId] || [];
  }

  serviceName(serviceId: string): string {
    return SERVICES.find(s => s.id === serviceId)?.name ?? serviceId;
  }

  canProceed(): boolean {
    const step = this.step();
    if (step === 1) return !!this.form().patientId && !!this.form().doctorId && !!this.form().clinicId;
    if (step === 2) return this.selectedServices().length > 0;
    return true;
  }

  validationMessage(): string {
    if (this.step() === 1) return 'Select a patient, doctor and clinic to continue.';
    if (this.step() === 2) return 'Select at least one service to continue.';
    return '';
  }

  /**
   * Guarded step navigation (root cause fix: the stepper previously allowed
   * jumping to any step via step.set(), bypassing validation).
   * - Completed steps are always clickable (React-style sequential + back-nav).
   * - The immediate next step requires the current step to be valid.
   * - Future steps beyond next are blocked until prerequisites are met.
   */
  goToStep(target: number): void {
    const current = this.step();
    if (target === current) return;
    if (target < current) {
      this.step.set(target);
      return;
    }
    if (target === current + 1 && this.canProceed()) {
      this.step.set(target);
    }
  }

  canGoToStep(target: number): boolean {
    const current = this.step();
    if (target <= current) return true;
    if (target === current + 1) return this.canProceed();
    return false;
  }

  nextStep(): void {
    if (this.canProceed() && this.step() < STEPS.length) {
      this.step.update(s => s + 1);
    }
  }

  prevStep(): void {
    if (this.step() === 1) {
      this.navigationService.navigate('orders');
    } else {
      this.step.update(s => s - 1);
    }
  }

  submitOrder(): void {
    // React parity: final "Create Order" navigates to the created order view.
    this.navigationService.navigate('viewOrder', { orderId: 'ord-1' });
  }

  getStepConfig(stepId: number) {
    const current = this.step();
    const done = stepId < current;
    const active = stepId === current;
    return { done, active };
  }

  selectedServiceNames(): string {
    const names = this.selectedServiceObjects().map(service => service.name);
    return names.length > 0 ? names.join(', ') : '—';
  }

  getIconSvg(name: string): string {
    const icons: Record<string, string> = {
      check: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
      'check-lg': '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
      'chevron-right': '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
      'chevron-left': '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
      plus: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
      'file-up': '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 12 15 15"/></svg>',
      'file-up-lg': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 12 15 15"/></svg>'
    };
    return icons[name] || '';
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
