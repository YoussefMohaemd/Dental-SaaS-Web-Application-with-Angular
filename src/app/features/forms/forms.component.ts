import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonComponent } from '@shared/components/button/button.component';

export type FormStatus = 'Complete' | 'In Progress' | 'Not Started';
export type FormCategory = 'Clinical' | 'Consent' | 'Lab' | 'Billing';

export interface ClinicalForm {
  id: string;
  name: string;
  category: FormCategory;
  service: string;
  status: FormStatus;
  updatedAt: string;
  fieldsTotal: number;
  fieldsComplete: number;
}

const SEED_FORMS: ClinicalForm[] = [
  { id: 'form-1', name: 'Treatment Plan Approval', category: 'Clinical', service: 'Treatment Plan', status: 'Complete', updatedAt: '2024-03-02', fieldsTotal: 8, fieldsComplete: 8 },
  { id: 'form-2', name: 'Surgical Guide Checklist', category: 'Clinical', service: 'Surgical Guide', status: 'Complete', updatedAt: '2024-03-03', fieldsTotal: 10, fieldsComplete: 10 },
  { id: 'form-3', name: 'GFMR Occlusal Record', category: 'Clinical', service: 'GFMR', status: 'In Progress', updatedAt: '2024-03-05', fieldsTotal: 12, fieldsComplete: 7 },
  { id: 'form-4', name: 'Shade & Material Selection', category: 'Lab', service: 'Final Restoration', status: 'In Progress', updatedAt: '2024-03-06', fieldsTotal: 6, fieldsComplete: 3 },
  { id: 'form-5', name: 'Patient Consent — Implants', category: 'Consent', service: 'Surgical Guide', status: 'Not Started', updatedAt: '2024-03-01', fieldsTotal: 5, fieldsComplete: 0 },
  { id: 'form-6', name: 'Financial Agreement', category: 'Billing', service: 'Final Restoration', status: 'Not Started', updatedAt: '2024-03-04', fieldsTotal: 4, fieldsComplete: 0 }
];

@Component({
  selector: 'app-forms',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonComponent],
  templateUrl: './forms.component.html',
  styleUrl: './forms.component.scss'
})
export class FormsComponent {
  readonly forms = signal<ClinicalForm[]>(SEED_FORMS);
  readonly search = signal('');
  readonly category = signal<'All' | FormCategory>('All');
  readonly categories: ('All' | FormCategory)[] = ['All', 'Clinical', 'Consent', 'Lab', 'Billing'];

  readonly filtered = computed(() => {
    const query = this.search().trim().toLowerCase();
    return this.forms().filter(form => {
      const matchesCategory = this.category() === 'All' || form.category === this.category();
      const matchesQuery = !query || form.name.toLowerCase().includes(query) || form.service.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  });

  readonly completeCount = computed(() => this.forms().filter(f => f.status === 'Complete').length);
  readonly inProgressCount = computed(() => this.forms().filter(f => f.status === 'In Progress').length);

  onSearchChange(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  setCategory(next: 'All' | FormCategory): void {
    this.category.set(next);
  }

  formProgress(form: ClinicalForm): number {
    if (form.fieldsTotal === 0) return 0;
    return Math.round((form.fieldsComplete / form.fieldsTotal) * 100);
  }

  statusClasses(status: FormStatus): string {
    if (status === 'Complete') return 'bg-emerald-50 text-emerald-700';
    if (status === 'In Progress') return 'bg-blue-50 text-blue-700';
    return 'bg-muted text-muted-foreground';
  }
}
