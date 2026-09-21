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

@Component({
  selector: 'app-edit-order',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent],
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
    return found ?? this.orderService.orders()[0];
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
}
