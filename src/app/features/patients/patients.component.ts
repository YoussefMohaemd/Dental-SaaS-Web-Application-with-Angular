import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientDataService } from '@core/services/patient-data.service';
import { NavigationService } from '@core/services/navigation.service';
import { FormatUtils } from '@core/services/format-utils.service';
import { Patient, PatientStatus } from '@core/models';
import { ButtonComponent } from '@shared/components/button/button.component';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { SafeHtmlPipe } from '../../shared/pipes/safe-html.pipe';
import { filterTableRows } from '@shared/utils/table-state';
import { paginateTableRows, sortTableRows, tableTotalPages, visibleTablePages } from '@shared/utils/table-state';

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    AvatarComponent,
    SafeHtmlPipe
  ],
  templateUrl: './patients.component.html',
  styleUrl: './patients.component.scss'
})
export class PatientsComponent {
  private readonly patientService = inject(PatientDataService);
  protected readonly navigationService = inject(NavigationService);
  protected readonly formatUtils = inject(FormatUtils);

  readonly patients = this.patientService.patients;
  readonly loading = this.patientService.loading;

  readonly STATUS_OPTIONS: PatientStatus[] = ['Active', 'Inactive'];

  readonly search = signal('');
  readonly statusFilter = signal<PatientStatus | ''>('');
  readonly page = signal(1);
  readonly sortCol = signal<keyof Patient>('name');
  readonly sortDir = signal<'asc' | 'desc'>('asc');
  readonly pageSize = 10;
  readonly showAddDialog = signal(false);
  readonly newName = signal('');
  readonly newEmail = signal('');
  readonly newPhone = signal('');
  readonly newClinic = signal('Bright Smile Dental');

  readonly filtered = computed(() => {
    let result = filterTableRows(this.patients(), this.search(), [
      patient => patient.name,
      patient => patient.email,
      patient => patient.clinicName,
    ]);
    if (this.statusFilter()) result = result.filter(p => p.status === this.statusFilter());

    return sortTableRows(result, this.sortCol(), this.sortDir());
  });

  readonly totalPages = computed(() => tableTotalPages(this.filtered().length, this.pageSize));
  readonly pageData = computed(() => paginateTableRows(this.filtered(), this.page(), this.pageSize));

  toggleSort(col: keyof Patient): void {
    if (this.sortCol() === col) this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    else { this.sortCol.set(col); this.sortDir.set('asc'); }
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.search.set(target.value);
    this.page.set(1);
  }

  onStatusFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.statusFilter.set(target.value as PatientStatus | '');
    this.page.set(1);
  }

  prevPage(): void {
    this.page.update(p => Math.max(1, p - 1));
  }

  nextPage(): void {
    this.page.update(p => Math.min(this.totalPages(), p + 1));
  }

  goToPage(pg: number): void {
    this.page.set(pg);
  }

  getPageNumbers(): number[] {
    return visibleTablePages(this.totalPages(), this.page());
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getGenderLabel(gender: string): string {
    return gender === 'M' ? 'Male' : 'Female';
  }

  getStatusClass(status: string): string {
    return status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-muted text-muted-foreground';
  }

  navigateToAddPatient(): void {
    this.newName.set('');
    this.newEmail.set('');
    this.newPhone.set('');
    this.newClinic.set('Bright Smile Dental');
    this.showAddDialog.set(true);
  }

  closeAddDialog(): void {
    this.showAddDialog.set(false);
  }

  savePatient(): void {
    const name = this.newName().trim() || 'New Patient';
    this.patientService.addPatient({
      id: `pt-${Date.now()}`,
      name,
      dob: '1990-01-01',
      gender: 'F',
      phone: this.newPhone().trim() || '+1 (555) 000-0000',
      email: this.newEmail().trim() || 'patient@email.com',
      clinicId: 'cl1',
      clinicName: this.newClinic(),
      doctorId: 'dr1',
      doctorName: 'Dr. Allison Park',
      status: 'Active',
      ordersCount: 0,
      lastVisit: new Date().toISOString().slice(0, 10)
    });
    this.showAddDialog.set(false);
  }

  getIconSvg(name: string): string {
    const icons: Record<string, string> = {
      plus: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
      search: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35"></path></svg>',
      'chevron-left': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>',
      'chevron-right': '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>',
      'arrow-up-down': '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 5 5 12"></polyline><polyline points="5 19 12 12 19 19"></polyline></svg>',
      users: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
      loader: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.22-8.56"/></svg>'
    };
    return icons[name] || '';
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }
}