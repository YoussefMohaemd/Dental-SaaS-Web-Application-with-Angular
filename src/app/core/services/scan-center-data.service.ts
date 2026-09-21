import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { ScanCenter } from '../models';

@Injectable({ providedIn: 'root' })
export class ScanCenterDataService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = '/data/scan-centers.json';

  private readonly _centers = signal<ScanCenter[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly centers = this._centers.asReadonly();
  readonly scanCenters = this._centers.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly totalCenters = computed(() => this._centers().length);
  readonly operationalCenters = computed(() => this._centers().filter(c => c.status === 'Operational').length);

  constructor() {
    this.loadCenters();
  }

  loadCenters(): void {
    this._loading.set(true);
    this._error.set(null);

    this.http.get<ScanCenter[]>(this.API_URL).pipe(
      catchError(err => {
        this._error.set('Failed to load scan centers');
        console.error('Error loading scan centers:', err);
        return of([] as ScanCenter[]);
      })
    ).subscribe({
      next: (centers: ScanCenter[]) => {
        this._centers.set(centers);
        this._loading.set(false);
      },
      error: () => {
        this._loading.set(false);
      }
    });
  }

  getCenterById(id: string): ScanCenter | undefined {
    return this._centers().find(c => c.id === id);
  }
}