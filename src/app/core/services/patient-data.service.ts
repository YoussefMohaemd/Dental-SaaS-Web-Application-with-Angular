import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { Patient, PatientFilters } from '../models';
import { filterTableRows, sortTableRows } from '@shared/utils/table-state';

@Injectable({ providedIn: 'root' })
export class PatientDataService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = '/data/patients.json';

  private readonly _patients = signal<Patient[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly patients = this._patients.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly totalPatients = computed(() => this._patients().length);
  readonly activePatients = computed(() => this._patients().filter(p => p.status === 'Active').length);

  constructor() {
    this.loadPatients();
  }

  loadPatients(): void {
    this._loading.set(true);
    this._error.set(null);

    this.http.get<Patient[]>(this.API_URL).pipe(
      catchError(err => {
        this._error.set('Failed to load patients');
        console.error('Error loading patients:', err);
        return of([] as Patient[]);
      })
    ).subscribe({
      next: (patients: Patient[]) => {
        this._patients.set(patients);
        this._loading.set(false);
      },
      error: () => {
        this._loading.set(false);
      }
    });
  }

  getPatientById(id: string): Patient | undefined {
    return this._patients().find(p => p.id === id);
  }

  getPatientsByDoctor(doctorId: string): Patient[] {
    return this._patients().filter(p => p.doctorId === doctorId);
  }

  getPatientsByClinic(clinicId: string): Patient[] {
    return this._patients().filter(p => p.clinicId === clinicId);
  }

  addPatient(patient: Patient): void {
    this._patients.update(current => [patient, ...current]);
  }

  applyFilters(filters: PatientFilters): Patient[] {
    let result = filterTableRows(this._patients(), filters.search ?? '', [
      patient => patient.name,
      patient => patient.email,
      patient => patient.clinicName,
    ]);

    if (filters.statusFilter) {
      result = result.filter(p => p.status === filters.statusFilter);
    }

    if (filters.sortColumn) {
      result = sortTableRows(result, filters.sortColumn, filters.sortDirection ?? 'asc');
    }

    return result;
  }
}