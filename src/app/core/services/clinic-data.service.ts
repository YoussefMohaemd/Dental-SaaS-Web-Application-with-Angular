import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { Clinic } from '../models';

@Injectable({ providedIn: 'root' })
export class ClinicDataService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = '/data/clinics.json';

  private readonly _clinics = signal<Clinic[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly clinics = this._clinics.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly totalClinics = computed(() => this._clinics().length);
  readonly activeClinics = computed(() => this._clinics().filter(c => c.status === 'Active').length);

  constructor() {
    this.loadClinics();
  }

  loadClinics(): void {
    this._loading.set(true);
    this._error.set(null);

    this.http.get<Clinic[]>(this.API_URL).pipe(
      catchError(err => {
        this._error.set('Failed to load clinics');
        console.error('Error loading clinics:', err);
        return of([] as Clinic[]);
      })
    ).subscribe({
      next: (clinics: Clinic[]) => {
        this._clinics.set(clinics);
        this._loading.set(false);
      },
      error: () => {
        this._loading.set(false);
      }
    });
  }

  getClinicById(id: string): Clinic | undefined {
    return this._clinics().find(c => c.id === id);
  }
}