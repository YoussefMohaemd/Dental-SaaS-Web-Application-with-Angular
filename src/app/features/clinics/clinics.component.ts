import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClinicDataService } from '@core/services/clinic-data.service';
import { NavigationService } from '@core/services/navigation.service';
import { FormatUtils } from '@core/services/format-utils.service';
import { Clinic, ClinicStatus } from '@core/models';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';

interface StatItem {
  label: string;
  value: number;
}

@Component({
  selector: 'app-clinics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    StatusBadgeComponent,
    ButtonComponent,
    AvatarComponent
  ],
  templateUrl: './clinics.component.html',
  styleUrl: './clinics.component.scss'
})
export class ClinicsComponent {
  private readonly clinicService = inject(ClinicDataService);
  protected readonly navigationService = inject(NavigationService);
  protected readonly formatUtils = inject(FormatUtils);

  readonly clinics = this.clinicService.clinics;
  readonly loading = this.clinicService.loading;

  readonly search = signal('');
  readonly showAddDialog = signal(false);
  readonly newName = signal('');
  readonly newCity = signal('');
  readonly newManager = signal('');

  readonly filtered = computed(() => {
    const search = this.search();
    if (!search) return this.clinics();
    const q = search.toLowerCase();
    return this.clinics().filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q)
    );
  });

  readonly statItems = signal<StatItem[]>([
    { label: 'Doctors', value: 0 },
    { label: 'Patients', value: 0 },
    { label: 'Orders', value: 0 }
  ]);

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.search.set(target.value);
  }

  openAddDialog(): void {
    this.newName.set('');
    this.newCity.set('');
    this.newManager.set('');
    this.showAddDialog.set(true);
  }

  closeAddDialog(): void {
    this.showAddDialog.set(false);
  }

  saveClinic(): void {
    const name = this.newName().trim() || 'New Clinic';
    this.clinicService.addClinic({
      id: `cl-${Date.now()}`,
      name,
      address: '1200 Innovation Drive',
      city: this.newCity().trim() || 'Los Angeles',
      phone: '+1 (555) 000-0000',
      email: 'info@clinic.com',
      doctorsCount: 0,
      patientsCount: 0,
      ordersCount: 0,
      status: 'Active',
      accountManager: this.newManager().trim() || 'Lab Manager'
    });
    this.showAddDialog.set(false);
  }

  getStatusClass(status: string): string {
    return status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-muted text-muted-foreground';
  }

  getIconSvg(name: string): string {
    const icons: Record<string, string> = {
      plus: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
      search: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35"></path></svg>',
      'building-2': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18"></path><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"></path><path d="M18 9v11a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-9"></path><path d="M10 6h4"></path><path d="M10 10h4"></path><path d="M10 14h4"></path></svg>'
    };
    return icons[name] || '';
  }
}