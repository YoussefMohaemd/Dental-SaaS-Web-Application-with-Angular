import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientDataService } from '@core/services/patient-data.service';
import { DoctorDataService } from '@core/services/doctor-data.service';
import { ClinicDataService } from '@core/services/clinic-data.service';
import { NavigationService } from '@core/services/navigation.service';
import { Patient, Doctor, Clinic } from '@core/models';
import { ButtonComponent } from '@shared/components/button/button.component';
import { InputComponent } from '@shared/components/input/input.component';
import { SelectComponent } from '@shared/components/select/select.component';

interface Service {
  id: string;
  name: string;
  description: string;
  icon: string;
  scanRequirements: string[];
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

@Component({
  selector: 'app-create-order',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, InputComponent, SelectComponent],
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

  readonly selectedPatient = computed(() => this.patients().find(p => p.id === this.form().patientId));
  readonly selectedDoctor = computed(() => this.doctors().find(d => d.id === this.form().doctorId));
  readonly selectedClinic = computed(() => this.clinics().find(c => c.id === this.form().clinicId));
  readonly selectedServiceObjects = computed(() => SERVICES.filter(s => this.selectedServices().includes(s.id)));
  readonly steps = STEPS;
  readonly services: Service[] = SERVICES;
  readonly doctorsForClinic = computed(() => {
    const clinicId = this.form().clinicId;
    if (!clinicId) return this.doctors();
    return this.doctors().filter(d => d.clinicId === clinicId);
  });

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
    const active = this.activeServiceForTeeth();
    return active ? (this.serviceTeeth()[active] || []) : this.selectedTeeth();
  }

  canProceed(): boolean {
    const step = this.step();
    if (step === 1) return !!this.form().patientId && !!this.form().doctorId && !!this.form().clinicId;
    if (step === 2) return this.selectedServices().length > 0;
    return true;
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
    this.navigationService.navigate('orders');
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
      check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"></polyline></svg>',
      'chevron-right': '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>',
      'chevron-left': '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>',
      plus: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
      'file-up': '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line></svg>'
    };
    return icons[name] || '';
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
