import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { ChangeRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class ChangeRequestDataService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = '/data/change-requests.json';

  private readonly _changeRequests = signal<ChangeRequest[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly changeRequests = this._changeRequests.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly totalChangeRequests = computed(() => this._changeRequests().length);
  readonly pendingChangeRequests = computed(() => this._changeRequests().filter(c => c.status === 'Pending').length);
  readonly inReviewChangeRequests = computed(() => this._changeRequests().filter(c => c.status === 'In Review').length);

  constructor() {
    this.loadChangeRequests();
  }

  loadChangeRequests(): void {
    this._loading.set(true);
    this._error.set(null);

    this.http.get<ChangeRequest[]>(this.API_URL).pipe(
      catchError(err => {
        this._error.set('Failed to load change requests');
        console.error('Error loading change requests:', err);
        return of([] as ChangeRequest[]);
      })
    ).subscribe({
      next: (changeRequests: ChangeRequest[]) => {
        this._changeRequests.set(changeRequests);
        this._loading.set(false);
      },
      error: () => {
        this._loading.set(false);
      }
    });
  }

  getChangeRequestById(id: string): ChangeRequest | undefined {
    return this._changeRequests().find(c => c.id === id);
  }

  getChangeRequestsByOrder(orderId: string): ChangeRequest[] {
    return this._changeRequests().filter(c => c.orderId === orderId);
  }

  updateStatus(requestId: string, status: ChangeRequest['status']): void {
    this._changeRequests.update(current =>
      current.map(r => (r.id === requestId ? { ...r, status } : r))
    );
  }
}