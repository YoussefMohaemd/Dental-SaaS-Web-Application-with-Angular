import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';
import {
  SubOrder,
  SubOrderContextSnapshot,
  SubOrderDetail,
  SubOrderFormDraftValue,
  SubOrderFormItemStatus,
  SubOrderFormItemValue,
  SubOrderScanLocalFile,
  SubOrderScanItemStatus,
  SubOrderCreationData,
} from '../models/sub-order.model';

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
  forms?: SubOrderDetail['forms'];
  scans?: SubOrderDetail['scans'];
  activity?: SubOrderDetail['activity'];
}

function cloneDetail(detail: SubOrderDetail): SubOrderDetail {
  return {
    id: detail.id,
    forms: detail.forms.map(form => ({ ...form })),
    scans: detail.scans.map(scan => ({ ...scan })),
    activity: detail.activity.map(item => ({ ...item })),
  };
}

function toDetailFromJson(row: SubOrderJson): SubOrderDetail | null {
  if (!row.forms && !row.scans && !row.activity) return null;
  return {
    id: row.id,
    forms: row.forms?.map(form => ({ ...form })) ?? [],
    scans: row.scans?.map(scan => ({ ...scan })) ?? [],
    activity: row.activity?.map(item => ({ ...item })) ?? [],
  };
}

function buildDetailFromSummary(
  row: Pick<SubOrderJson, 'id' | 'service' | 'formsComplete' | 'formsTotal' | 'scansComplete' | 'scansTotal'>,
): SubOrderDetail {
  const forms: SubOrderDetail['forms'] = Array.from({ length: row.formsTotal }, (_, index) => ({
    id: `${row.id}-form-${index + 1}`,
    label: row.formsTotal === 1 ? `${row.service} Form` : `${row.service} Form ${index + 1}`,
    required: true,
    status: index < row.formsComplete ? 'complete' : 'incomplete',
  }));

  const scans: SubOrderDetail['scans'] = Array.from({ length: row.scansTotal }, (_, index) => ({
    id: `${row.id}-scan-${index + 1}`,
    label: row.scansTotal === 1 ? `${row.service} Scan` : `${row.service} Scan ${index + 1}`,
    format: 'Linked record',
    status: index < row.scansComplete ? 'uploaded' : 'missing',
  }));

  return { id: row.id, forms, scans, activity: [] };
}

const FALLBACK_SUB_ORDERS: SubOrder[] = [
  { id: 'so-1', orderId: 'ord-1', service: 'Surgical Guide', icon: '🦷', status: 'done', formsComplete: 3, formsTotal: 3, scansComplete: 3, scansTotal: 3, teeth: [14, 15, 24, 25], priority: 'High', dueDate: '2024-03-15', notes: 'Standard surgical guide for dual implant placement at sites 14, 15, 24, 25. Straumann BLT Ø4.1mm.' },
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

const DEFAULT_FORM_VALUES: SubOrderFormDraftValue = {
  clinicalNotes: '',
  occlusalContact: 'Light contact',
  marginType: 'Chamfer',
  material: 'Zirconia (Multilayer)',
  shade: 'A2',
  specialInstructions: '',
};

export interface CreateSubOrderInput {
  serviceId: string;
  service: string;
  icon: string;
  priority: SubOrder['priority'];
  dueDate: string;
  notes: string;
  teeth: number[];
  scanRequirements: string[];
  creationData: SubOrderCreationData;
}

/**
 * Sub-order data flow: RxJS (HttpClient + delay/catchError) feeds
 * Signals state. Falls back to sanitized local data when JSON is missing.
 */
@Injectable({ providedIn: 'root' })
export class SubOrderDataService {
  private readonly http = inject(HttpClient);
  private readonly URL = '/data/sub-orders.json';

  private readonly _subOrders = signal<SubOrder[]>(FALLBACK_SUB_ORDERS);
  private readonly _details = signal<Record<string, SubOrderDetail>>(structuredClone(SUB_ORDER_DETAILS));
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly subOrders = this._subOrders.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly details = this._details.asReadonly();

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
          const nextDetails = structuredClone(SUB_ORDER_DETAILS);
          rows.forEach(row => {
            if (!(row.id in nextDetails)) {
              nextDetails[row.id] = toDetailFromJson(row) ?? buildDetailFromSummary(row);
            }
          });
          this._details.set(nextDetails);
          this._loading.set(false);
        },
        error: () => this._loading.set(false),
      });
  }

  getById(id: string): SubOrder | undefined {
    return this._subOrders().find(s => s.id === id);
  }

  getDetailById(id: string): SubOrderDetail | undefined {
    return this._details()[id];
  }

  getDetailByContext(orderId: string, subOrderId: string): SubOrderDetail | undefined {
    if (!orderId || !subOrderId) return undefined;
    const subOrder = this.getById(subOrderId);
    if (!subOrder || subOrder.orderId !== orderId) return undefined;
    return this._details()[subOrderId];
  }

  createForOrder(orderId: string, rows: CreateSubOrderInput[]): SubOrder[] {
    if (!orderId || rows.length === 0) return [];

    const created: SubOrder[] = [];
    const details: Record<string, SubOrderDetail> = {};
    let nextId = this.nextSequenceId();

    for (const row of rows) {
      const id = `so-${nextId++}`;
      const detailForms = [
        { id: `${id}-form-clinical`, label: `${row.service} Clinical Form`, required: true, status: 'incomplete' as const },
      ];
      const detailScans = row.scanRequirements.map((label, index) => ({
        id: `${id}-scan-${index + 1}`,
        label,
        format: 'Any file type',
        status: 'missing' as const,
      }));

      const subOrder: SubOrder = {
        id,
        orderId,
        service: row.service,
        icon: row.icon,
        status: 'pending',
        formsComplete: 0,
        formsTotal: detailForms.length,
        scansComplete: 0,
        scansTotal: detailScans.length,
        teeth: [...row.teeth],
        priority: row.priority,
        dueDate: row.dueDate,
        notes: row.notes,
        creationData: structuredClone(row.creationData),
      };

      created.push(subOrder);
      details[id] = {
        id,
        forms: detailForms,
        scans: detailScans,
        activity: [
          { time: 'just now', user: 'System', text: `${row.service} sub-order created from order ${orderId}.` },
        ],
      };
    }

    this._subOrders.update(current => [...created, ...current]);
    this._details.update(current => ({ ...details, ...current }));
    this.refreshSubOrderCounts(created.map(item => item.id));
    return created;
  }

  saveFormItem(
    subOrderId: string,
    formId: string,
    payload: { values: Partial<SubOrderFormDraftValue>; context: SubOrderContextSnapshot; required: boolean },
  ): void {
    const detail = this._details()[subOrderId];
    if (!detail) return;
    const now = new Date().toISOString();
    const mergedValues: SubOrderFormDraftValue = {
      ...DEFAULT_FORM_VALUES,
      ...payload.values,
    };

    const value: SubOrderFormItemValue = {
      values: mergedValues,
      context: payload.context,
      updatedAt: now,
    };

    const updatedForms = detail.forms.map(form => {
      if (form.id !== formId) return form;
      const hasMinimumRequired = mergedValues.clinicalNotes.trim().length > 0;
      const nextStatus: SubOrderFormItemStatus = form.required || payload.required
        ? (hasMinimumRequired ? 'complete' : 'incomplete')
        : (hasMinimumRequired ? 'complete' : 'optional');
      return {
        ...form,
        value,
        status: nextStatus,
      };
    });

    this._details.update(current => ({
      ...current,
      [subOrderId]: {
        ...detail,
        forms: updatedForms,
      },
    }));
    this.refreshSubOrderCounts([subOrderId]);
  }

  saveScanFiles(subOrderId: string, scanId: string, files: SubOrderScanLocalFile[]): void {
    const detail = this._details()[subOrderId];
    if (!detail) return;
    const now = new Date().toISOString();
    const updatedScans = detail.scans.map(scan => {
      if (scan.id !== scanId) return scan;
      const nextStatus: SubOrderScanItemStatus = files.length > 0 ? 'selected-local' : 'missing';
      return {
        ...scan,
        localFiles: files,
        status: nextStatus,
        updatedAt: now,
      };
    });

    this._details.update(current => ({
      ...current,
      [subOrderId]: {
        ...detail,
        scans: updatedScans,
      },
    }));
    this.refreshSubOrderCounts([subOrderId]);
  }

  addActivityNote(subOrderId: string, user: string, text: string): void {
    const detail = this._details()[subOrderId];
    if (!detail) return;
    const nextText = text.trim();
    if (!nextText) return;

    this._details.update(current => ({
      ...current,
      [subOrderId]: {
        ...detail,
        activity: [
          { time: 'just now', user, text: nextText },
          ...detail.activity,
        ],
      },
    }));
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

  private refreshSubOrderCounts(subOrderIds: string[]): void {
    const idSet = new Set(subOrderIds);
    const details = this._details();

    this._subOrders.update(rows => rows.map(row => {
      if (!idSet.has(row.id)) return row;
      const detail = details[row.id];
      if (!detail) return row;

      const formsTotal = detail.forms.length;
      const formsComplete = detail.forms.filter(form => form.status === 'complete').length;
      const scansTotal = detail.scans.length;
      const scansComplete = detail.scans.filter(scan => scan.status === 'uploaded' || scan.status === 'selected-local').length;
      const status = this.deriveStatus(formsTotal, formsComplete, scansTotal, scansComplete);

      return {
        ...row,
        formsTotal,
        formsComplete,
        scansTotal,
        scansComplete,
        status,
      };
    }));
  }

  private deriveStatus(formsTotal: number, formsComplete: number, scansTotal: number, scansComplete: number): SubOrder['status'] {
    const total = formsTotal + scansTotal;
    const done = formsComplete + scansComplete;
    if (total > 0 && done >= total) return 'done';
    if (done > 0) return 'in-progress';
    return 'pending';
  }

  private nextSequenceId(): number {
    const numericIds = this._subOrders()
      .map(subOrder => Number(subOrder.id.replace('so-', '')))
      .filter(value => Number.isFinite(value));
    const max = numericIds.length > 0 ? Math.max(...numericIds) : 0;
    return max + 1;
  }
}
