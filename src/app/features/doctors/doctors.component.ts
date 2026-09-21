import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DoctorDataService } from '@core/services/doctor-data.service';
import { NavigationService } from '@core/services/navigation.service';
import { FormatUtils } from '@core/services/format-utils.service';
import { Doctor, DoctorStatus } from '@core/models';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';

interface SortConfig {
  label: string;
  col: keyof Doctor;
}

@Component({
  selector: 'app-doctors',
  standalone: true,
  imports: [
    CommonModule,
    StatusBadgeComponent,
    ButtonComponent,
    AvatarComponent
  ],
  templateUrl: './doctors.component.html',
  styleUrl: './doctors.component.scss'
})
export class DoctorsComponent {
  private readonly doctorService = inject(DoctorDataService);
  protected readonly navigationService = inject(NavigationService);
  protected readonly formatUtils = inject(FormatUtils);

  readonly doctors = this.doctorService.doctors;
  readonly loading = this.doctorService.loading;

  readonly STATUS_OPTIONS: DoctorStatus[] = ['Active', 'Inactive'];

  readonly search = signal('');
  readonly statusFilter = signal<DoctorStatus | ''>('');
  readonly sortCol = signal<keyof Doctor>('name');
  readonly sortDir = signal<'asc' | 'desc'>('asc');

  readonly filtered = computed(() => {
    let result = [...this.doctors()];
    const search = this.search();
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.specialty.toLowerCase().includes(q) ||
        d.clinicName.toLowerCase().includes(q)
      );
    }
    if (this.statusFilter()) result = result.filter(d => d.status === this.statusFilter());

    result.sort((a, b) => {
      const av = (a as any)[this.sortCol()] ?? '';
      const bv = (b as any)[this.sortCol()] ?? '';
      return this.sortDir() === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return result;
  });

  readonly sortConfigs: SortConfig[] = [
    { label: 'Name', col: 'name' },
    { label: 'Specialty', col: 'specialty' },
    { label: 'Clinic', col: 'clinicName' },
    { label: 'Email', col: 'email' },
    { label: 'Phone', col: 'phone' },
    { label: 'Orders', col: 'ordersCount' },
    { label: 'Joined', col: 'joinedDate' },
    { label: 'Status', col: 'status' }
  ];

  toggleSort(col: keyof Doctor): void {
    if (this.sortCol() === col) this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    else { this.sortCol.set(col); this.sortDir.set('asc'); }
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.search.set(target.value);
  }

  onStatusFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.statusFilter.set(target.value as DoctorStatus | '');
  }

  getStatusClass(status: string): string {
    return status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-muted text-muted-foreground';
  }

  getIconSvg(name: string): string {
    const icons: Record<string, string> = {
      plus: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
      search: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35"></path></svg>',
      'arrow-up-down': '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 5 5 12"></polyline><polyline points="5 19 12 12 19 19"></polyline></svg>',
      'user-cog': '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="18" r="3"></circle><circle cx="9" cy="7" r="4"></circle><path d="M10 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path></svg>'
    };
    return icons[name] || '';
  }
}