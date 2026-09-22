import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';
import { SubOrder, SubOrderDetail } from '../models/sub-order.model';

interface SubOrderJson {
  id: string;
  orderId?: string;
  service: string;
  icon: string;
  status: SubOrder['status'];
  formsComplete: number;
  formsTotal: number;
  scansComplete: number;
  scansTotal: number;
  teeth: number[];
  priority: SubOrder['priority'];
  dueDate: string;
  notes: string;
}

const FALLBACK_SUB_ORDERS: SubOrder[] = [
  { id: 'so-1', orderId: 'ord-1', service: 'Surgical Guide', icon: '🦷', status: 'completed', formsComplete: 3, formsTotal: 3, scansComplete: 3, scansTotal: 3, teeth: [14, 15, 24, 25], priority: 'High', dueDate: '2024-03-15', notes: 'Standard surgical guide for dual implant placement at sites 14, 15, 24, 25. Straumann BLT Ø4.1mm.' },
  { id: 'so-2', orderId: 'ord-1', service: 'GFMR', icon: '⚙️', status: 'in-progress', formsComplete: 2, formsTotal: 3, scansComplete: 1, scansTotal: 3, teeth: [11, 12, 13, 21, 22, 23], priority: 'High', dueDate: '2024-03-20', notes: 'Full mouth rehabilitation. Occlusal vertical dimension (OVD) increase of 3mm confirmed by Dr. Kim. Mutually protected occlusion concept.' },
  { id: 'so-3', orderId: 'ord-1', service: 'Final Restoration', icon: '✨', status: 'pending', formsComplete: 0, formsTotal: 2, scansComplete: 0, scansTotal: 2, teeth: [16, 17, 26, 27], priority: 'Normal', dueDate: '2024-04-01', notes: 'Posterior zirconia crowns with shade A2 and internal characterization. Confirm margin type with Dr. Kim before fabrication.' },
  { id: 'so-4', orderId: 'ord-1', service: 'Treatment Plan', icon: '📋', status: 'pending', formsComplete: 1, formsTotal: 2, scansComplete: 0, scansTotal: 1, teeth: [], priority: 'Normal', dueDate: '2024-03-10', notes: 'Full treatment plan document to be reviewed by lab and clinic team jointly before proceeding.' },
];

/**
 * React parity (SubOrderPage.tsx SUB_ORDERS_MAP): per-sub-order clinical
 * detail — forms, scans and activity feed. Lives in the data service (not
 * the component) so JSON/service loading stays the single data path.
 */
const SUB_ORDER_DETAILS: Record<string, SubOrderDetail> = {
  'so-1': {
    id: 'so-1',
    forms: [
      { id: 'f1', label: 'Implant System & Diameter', required: true, status: 'complete' },
      { id: 'f2', label: 'Bone Quality Assessment', required: true, status: 'complete' },
      { id: 'f3', label: 'Surgical Protocol Notes', required: true, status: 'complete' },
    ],
    scans: [
      { id: 's1', label: 'CBCT / CT Scan', format: 'DICOM', status: 'uploaded' },
      { id: 's2', label: 'Full Arch STL', format: 'STL', status: 'uploaded' },
      { id: 's3', label: 'Supporting Reference Files', format: 'PDF / JPG', status: 'uploaded' },
    ],
    activity: [
      { time: '2 hours ago', user: 'Jessica R.', text: 'Surgical guide approved and sent to fabrication.' },
      { time: '1 day ago', user: 'Tom K.', text: 'CBCT scan uploaded and reviewed.' },
      { time: '3 days ago', user: 'Jessica R.', text: 'Sub-order created from parent order.' },
    ],
  },
  'so-2': {
    id: 'so-2',
    forms: [
      { id: 'f1', label: 'Occlusal Concept Form', required: true, status: 'complete' },
      { id: 'f2', label: 'VDO Change Documentation', required: true, status: 'complete' },
      { id: 'f3', label: 'Clinical Notes & Photos', required: true, status: 'incomplete' },
    ],
    scans: [
      { id: 's1', label: 'Upper Arch Scan', format: 'STL', status: 'uploaded' },
      { id: 's2', label: 'Lower Arch Scan', format: 'STL', status: 'uploaded' },
      { id: 's3', label: 'Bite Scan', format: 'STL', status: 'missing' },
    ],
    activity: [
      { time: '30 min ago', user: 'Jessica R.', text: 'Bite scan still pending from clinic. Sent reminder to Dr. Kim.' },
      { time: '2 days ago', user: 'Tom K.', text: 'Upper and lower arch scans uploaded successfully.' },
      { time: '4 days ago', user: 'Jessica R.', text: 'GFMR sub-order created.' },
    ],
  },
  'so-3': {
    id: 'so-3',
    forms: [
      { id: 'f1', label: 'Shade & Material Selection', required: true, status: 'incomplete' },
      { id: 'f2', label: 'Margin & Occlusion Specs', required: true, status: 'incomplete' },
    ],
    scans: [
      { id: 's1', label: 'Prep Scan', format: 'STL', status: 'missing' },
      { id: 's2', label: 'Antagonist Scan', format: 'STL', status: 'missing' },
    ],
    activity: [
      { time: '5 days ago', user: 'Jessica R.', text: 'Final Restoration sub-order created. Waiting for scans from clinic.' },
    ],
  },
  'so-4': {
    id: 'so-4',
    forms: [
      { id: 'f1', label: 'Patient History Summary', required: true, status: 'complete' },
      { id: 'f2', label: 'Proposed Treatment Outline', required: true, status: 'incomplete' },
    ],
    scans: [
      { id: 's1', label: 'Diagnostic Model Scan', format: 'STL', status: 'missing' },
    ],
    activity: [
      { time: '1 week ago', user: 'Jessica R.', text: 'Treatment Plan sub-order created.' },
    ],
  },
};

const ICON_MAP: Record<string, string> = {
  tooth: '🦷',
  settings: '⚙️',
  sparkles: '✨',
  clipboard: '📋',
};

/**
 * Sub-order data flow: RxJS (HttpClient + delay/catchError) feeds
 * Signals state. Falls back to sanitized local data when JSON is missing.
 */
@Injectable({ providedIn: 'root' })
export class SubOrderDataService {
  private readonly http = inject(HttpClient);
  private readonly URL = '/data/sub-orders.json';

  private readonly _subOrders = signal<SubOrder[]>(FALLBACK_SUB_ORDERS);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly subOrders = this._subOrders.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly count = computed(() => this._subOrders().length);

  constructor() {
    this.load();
  }

  load(): void {
    this._loading.set(true);
    this._error.set(null);
    this.http
      .get<SubOrderJson[]>(this.URL)
      .pipe(
        delay(150),
        map(rows =>
          rows.map(row => ({
            ...row,
            icon: ICON_MAP[row.icon] ?? row.icon ?? '🦷',
          }) as SubOrder),
        ),
        catchError(err => {
          console.error('Error loading sub-orders:', err);
          this._error.set('Failed to load sub-orders');
          return of(FALLBACK_SUB_ORDERS);
        }),
      )
      .subscribe({
        next: rows => {
          this._subOrders.set(rows.length > 0 ? rows : FALLBACK_SUB_ORDERS);
          this._loading.set(false);
        },
        error: () => this._loading.set(false),
      });
  }

  getById(id: string): SubOrder | undefined {
    return this._subOrders().find(s => s.id === id);
  }

  /** React parity: unknown ids fall back to the default 'so-2' detail set. */
  getDetailById(id: string): SubOrderDetail {
    return SUB_ORDER_DETAILS[id] ?? SUB_ORDER_DETAILS['so-2'];
  }

  /**
   * Strict data-driven child lookup — the JSON `orderId` field is the single
   * source of truth for the Order → Sub Order relationship.
   *
   * - Returns only sub-orders whose `orderId` exactly matches `orderId`.
   * - Returns `[]` when the Order has no children (leaf row: no expander,
   *   no fake children, no fallback to unrelated records).
   * - Never assumes a service type always/never has children.
   */
  getByOrderId(orderId: string): SubOrder[] {
    if (!orderId) return [];
    return this._subOrders().filter(s => s.orderId === orderId);
  }
}
