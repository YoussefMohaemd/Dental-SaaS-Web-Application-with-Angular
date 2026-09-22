import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { OrderDataService } from '@core/services/order-data.service';
import { PatientDataService } from '@core/services/patient-data.service';
import { DoctorDataService } from '@core/services/doctor-data.service';
import { ClinicDataService } from '@core/services/clinic-data.service';
import { NavigationService } from '@core/services/navigation.service';
import { ButtonComponent } from '@shared/components/button/button.component';
import { SafeHtmlPipe } from '@shared/pipes/safe-html.pipe';

@Component({
  selector: 'app-edit-order',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, SafeHtmlPipe],
  templateUrl: './edit-order.component.html',
  styleUrl: './edit-order.component.scss'
})
export class EditOrderComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly orderService = inject(OrderDataService);
  private readonly patientService = inject(PatientDataService);
  private readonly doctorService = inject(DoctorDataService);
  private readonly clinicService = inject(ClinicDataService);
  protected readonly navigationService = inject(NavigationService);

  readonly patients = this.patientService.patients;
  readonly doctors = this.doctorService.doctors;
  readonly clinics = this.clinicService.clinics;
  readonly saved = signal(false);
  readonly isLocked = signal(false);

  readonly order = computed(() => {
    const orderId = this.route.snapshot.paramMap.get('orderId');
    const found = this.orderService.getOrderById(orderId ?? '');
    return found;
  });

  readonly editForm = this.fb.nonNullable.group({
    patientId: ['', Validators.required],
    doctorId: ['', Validators.required],
    clinicId: ['', Validators.required],
    restoration: ['Crown', Validators.required],
    arch: ['Maxilla', Validators.required],
    shade: ['A2', Validators.required],
    format: ['STL', Validators.required],
    units: [1, [Validators.required, Validators.min(1), Validators.max(32)]],
    status: ['New', Validators.required],
    priority: ['Normal' as string, Validators.required],
    dueDate: [''],
    billTo: [''],
    notes: ['']
  });

  readonly restorationOptions = ['Crown', 'Bridge', 'Veneer', 'Implant Crown', 'Full Arch', 'Night Guard', 'Inlay', 'Onlay'];
  readonly archOptions = ['Maxilla', 'Mandible', 'Both'];
  readonly shadeOptions = ['A1', 'A2', 'A3', 'A3.5', 'B1', 'B2', 'C2', 'D3', 'BL1', 'BL2'];
  readonly formatOptions = ['STL', 'PLY', 'OBJ', 'DICOM', 'STL+OBJ'];
  readonly statusOptions = ['New', 'Review', 'Design', 'Production', 'Quality Check', 'Ready', 'Completed', 'Cancelled'];
  readonly priorityOptions = ['Low', 'Normal', 'High', 'Urgent'];

  constructor() {
    const current = this.order();
    if (current) {
      this.editForm.patchValue({
        patientId: current.patientId,
        doctorId: current.doctorId,
        clinicId: current.clinicId,
        restoration: current.restoration,
        arch: current.arch,
        shade: current.shade,
        format: current.format,
        units: current.units,
        status: current.status,
        priority: current.priority,
        dueDate: current.dueDate?.slice(0, 10) ?? '',
        billTo: current.billTo,
        notes: current.notes
      });
      this.isLocked.set(current.isLocked);
    }
  }

  toggleLock(): void {
    this.isLocked.update(v => !v);
  }

  fieldInvalid(controlName: string): boolean {
    const control = this.editForm.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  discard(): void {
    const current = this.order();
    if (current) this.navigationService.navigate('viewOrder', { orderId: current.id });
    else this.navigationService.navigate('orders');
  }

  saveChanges(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const current = this.order();
    const raw = this.editForm.getRawValue();
    if (current) {
      this.orderService.updateOrder(current.id, {
        patientId: raw.patientId,
        doctorId: raw.doctorId,
        clinicId: raw.clinicId,
        restoration: raw.restoration as typeof current.restoration,
        arch: raw.arch as typeof current.arch,
        shade: raw.shade,
        format: raw.format,
        units: raw.units,
        status: raw.status as typeof current.status,
        priority: raw.priority as typeof current.priority,
        dueDate: raw.dueDate,
        billTo: raw.billTo,
        notes: raw.notes,
        isLocked: this.isLocked()
      });
    }
    this.saved.set(true);
    window.setTimeout(() => {
      if (current) this.navigationService.navigate('viewOrder', { orderId: current.id });
    }, 800);
  }

  goBack(): void {
    this.discard();
  }

  /**
   * Lucide-equivalent inline SVGs (React parity: lucide `X` + `Save`
   * at size 13 on the Discard / Save Changes actions).
   */
  getIconSvg(name: string): string {
    const icons: Record<string, string> = {
      x: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
      save: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>'
    };
    return icons[name] || '';
  }
}
