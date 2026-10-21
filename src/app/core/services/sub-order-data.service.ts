import { Injectable, inject, signal, computed } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import {
  catchError,
  forkJoin,
  map,
  Observable,
  of,
  switchMap,
  tap,
  throwError,
} from "rxjs";
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
  SubOrderJson,
} from "../interfaces";
import { ApiEndpoint } from "@core/enum/api.endpoint";

function cloneDetail(detail: SubOrderDetail): SubOrderDetail {
  return {
    id: detail.id,
    forms: detail.forms.map((form) => ({ ...form })),
    scans: detail.scans.map((scan) => ({ ...scan })),
    activity: detail.activity.map((item) => ({ ...item })),
  };
}

function toDetailFromJson(row: SubOrderJson): SubOrderDetail | null {
  if (!row.forms && !row.scans && !row.activity) return null;
  return {
    id: row.id,
    forms: row.forms?.map((form) => ({ ...form })) ?? [],
    scans: row.scans?.map((scan) => ({ ...scan })) ?? [],
    activity: row.activity?.map((item) => ({ ...item })) ?? [],
  };
}

function buildDetailFromSummary(
  row: Pick<
    SubOrderJson,
    | "id"
    | "service"
    | "formsComplete"
    | "formsTotal"
    | "scansComplete"
    | "scansTotal"
    | "creationData"
  >,
): SubOrderDetail {
  const serviceFormEntries = Object.entries(row.creationData?.serviceForm ?? {});
  const formEntries =
    serviceFormEntries.length > 0
      ? serviceFormEntries
      : Array.from({ length: row.formsTotal }, (_, index) => [
          `form-${index + 1}`,
          "",
        ] as const);
  const forms: SubOrderDetail["forms"] = formEntries.map(
    ([key, value], index) => ({
      id: `${row.id}-form-${index + 1}`,
      label: serviceFormEntries.length > 0 ? humanizeFieldName(key) : (
        row.formsTotal === 1
          ? `${row.service} Form`
          : `${row.service} Form ${index + 1}`
      ),
      required: true,
      status:
        (typeof value === "string" && value.trim().length > 0) ||
        index < row.formsComplete
          ? "complete"
          : "incomplete",
    }),
  );

  const scanRequirements = row.creationData?.scanRequirements ?? [];
  const scanEntries =
    scanRequirements.length > 0
      ? scanRequirements
      : Array.from({ length: row.scansTotal }, (_, index) =>
          row.scansTotal === 1
            ? `${row.service} Scan`
            : `${row.service} Scan ${index + 1}`,
        );
  const scans: SubOrderDetail["scans"] = Array.from(
    { length: scanEntries.length },
    (_, index) => ({
      id: `${row.id}-scan-${index + 1}`,
      label: scanEntries[index],
      format: "Any file type",
      status: index < row.scansComplete ? "uploaded" : "missing",
    }),
  );

  return { id: row.id, forms, scans, activity: [] };
}

function humanizeFieldName(fieldName: string): string {
  return fieldName
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

const ICON_MAP: Record<string, string> = {
  tooth: "🦷",
  settings: "⚙️",
  sparkles: "✨",
  clipboard: "📋",
};

const DEFAULT_FORM_VALUES: SubOrderFormDraftValue = {
  clinicalNotes: "",
  occlusalContact: "Light contact",
  marginType: "Chamfer",
  material: "Zirconia (Multilayer)",
  shade: "A2",
  specialInstructions: "",
};

interface ServiceFormTemplate {
  label: string;
  required: boolean;
}

const SERVICE_FORM_TEMPLATES: Record<string, ServiceFormTemplate[]> = {
  "treatment-plan": [
    { label: "Diagnostic Findings Summary", required: true },
    { label: "Phased Treatment Roadmap", required: true },
    { label: "Risk & Consent Notes", required: false },
  ],
  "surgical-guide": [
    { label: "Implant Positioning Plan", required: true },
    { label: "Guide Support & Anchor Strategy", required: true },
    { label: "Drilling Sequence Checklist", required: true },
  ],
  gfmr: [
    { label: "OVD & Centric Relation Record", required: true },
    { label: "Occlusal Scheme Definition", required: true },
    { label: "Provisional-to-Final Transition Plan", required: true },
  ],
  fmb: [
    { label: "Span and Connector Design", required: true },
    { label: "Pontic Emergence & Tissue Profile", required: true },
    { label: "Delivery Sequencing", required: false },
  ],
  "temp-restoration": [
    { label: "Provisional Contour Requirements", required: true },
    { label: "Soft Tissue Conditioning Goals", required: true },
  ],
  "final-restoration": [
    { label: "Definitive Prep & Margin Mapping", required: true },
    { label: "Shade and Characterization Plan", required: true },
    { label: "Occlusal Finishing Notes", required: false },
  ],
  "full-guide": [
    { label: "Surgery-to-Prosthetic Workflow Plan", required: true },
    { label: "Immediate Loading Criteria", required: true },
    { label: "Cross-team Handoff Checklist", required: true },
  ],
  other: [
    { label: "Custom Service Scope", required: true },
    { label: "Acceptance Criteria", required: true },
  ],
};

export interface CreateSubOrderInput {
  serviceId: string;
  service: string;
  icon: string;
  priority: SubOrder["priority"];
  dueDate: string;
  notes: string;
  teeth: number[];
  scanRequirements: string[];
  creationData: SubOrderCreationData;
}

@Injectable({ providedIn: "root" })
export class SubOrderDataService {
  private readonly http = inject(HttpClient);
  private readonly URL = ApiEndpoint.ORDERS;

  private readonly _subOrders = signal<SubOrder[]>([]);
  private readonly _details = signal<Record<string, SubOrderDetail>>({});
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly subOrders = this._subOrders.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly details = this._details.asReadonly();

  readonly count = computed(() => this._subOrders().length);

  constructor() {
  }

  load(): void {
    this._loading.set(true);
    this._error.set(null);
    this.http
      .get<{ data: Array<{ id: string }> }>(this.URL)
      .pipe(
        map((response) => response.data ?? []),
        map((orders) => orders.map((order) => order.id).filter((id) => !!id)),
        switchMap((orderIds) => {
          if (orderIds.length === 0) return of([] as SubOrderJson[]);
          return forkJoin(
            orderIds.map((orderId) =>
              this.http
                .get<{ data: SubOrderJson[] }>(
                  ApiEndpoint.orderSubOrders(orderId),
                )
                .pipe(map((response) => response.data ?? [])),
            ),
          ).pipe(map((groups) => groups.flat()));
        }),
        map((rows) =>
          rows.map(
            (row) =>
              ({
                ...row,
                icon: ICON_MAP[row.icon] ?? row.icon ?? "🦷",
              }) as SubOrder,
          ),
        ),
        catchError((err) => {
          console.error("Error loading sub-orders:", err);
          this._error.set("Failed to load sub-orders");
          return throwError(() => err);
        }),
      )
      .subscribe({
        next: (rows) => {
          this._subOrders.set(rows);
          const nextDetails: Record<string, SubOrderDetail> = {};
          rows.forEach((row) => {
            nextDetails[row.id] =
              toDetailFromJson(row) ??
              this._details()[row.id] ??
              buildDetailFromSummary(row);
          });
          this._details.set(nextDetails);
          this._loading.set(false);
        },
        error: () => {
          this._subOrders.set([]);
          this._loading.set(false);
        },
      });
  }

  getById(id: string): SubOrder | undefined {
    return this._subOrders().find((s) => s.id === id);
  }

  getDetailById(id: string): SubOrderDetail | undefined {
    return this._details()[id];
  }

  getDetailByContext(
    orderId: string,
    subOrderId: string,
  ): SubOrderDetail | undefined {
    if (!orderId || !subOrderId) return undefined;
    const subOrder = this.getById(subOrderId);
    if (!subOrder || subOrder.orderId !== orderId) return undefined;
    return this._details()[subOrderId];
  }

  createForOrder$(
    orderId: string,
    rows: CreateSubOrderInput[],
  ): Observable<SubOrder[]> {
    return this.http
      .post<{ data: SubOrderJson[] }>(
        ApiEndpoint.orderSubOrders(orderId),
        rows.map((row) => this.toApiSubOrderPayload(row)),
      )
      .pipe(
        map((response) => response.data ?? []),
        map((created) => created.map((row) => this.toSubOrder(row))),
        tap((created) => {
          this._subOrders.update((current) => [...created, ...current]);
          this._details.update((current) => {
            const next = { ...current };
            created.forEach((row) => {
              next[row.id] = buildDetailFromSummary(row);
            });
            return next;
          });
        }),
      );
  }

  replaceForOrder$(
    orderId: string,
    rows: CreateSubOrderInput[],
  ): Observable<SubOrder[]> {
    return this.http
      .put<{ data: SubOrderJson[] }>(
        ApiEndpoint.orderSubOrders(orderId),
        rows.map((row) => this.toApiSubOrderPayload(row)),
      )
      .pipe(
        map((response) => response.data ?? []),
        map((replaced) => replaced.map((row) => this.toSubOrder(row))),
        tap((replaced) => {
          const replacedIds = new Set(
            this._subOrders()
              .filter((row) => row.orderId === orderId)
              .map((row) => row.id),
          );
          this._subOrders.update((current) => [
            ...replaced,
            ...current.filter((row) => !replacedIds.has(row.id)),
          ]);
          this._details.update((current) => {
            const next = { ...current };
            replacedIds.forEach((id) => delete next[id]);
            replaced.forEach((row) => {
              next[row.id] = buildDetailFromSummary(row);
            });
            return next;
          });
        }),
      );
  }

  createForOrder(orderId: string, rows: CreateSubOrderInput[]): SubOrder[] {
    if (!orderId || rows.length === 0) return [];

    const created: SubOrder[] = [];
    const details: Record<string, SubOrderDetail> = {};
    let nextId = this.nextSequenceId();

    for (const row of rows) {
      const id = `so-${nextId++}`;
      const detailForms = this.buildDetailFormsForService(id, row);
      const detailScans = row.scanRequirements.map((label, index) => ({
        id: `${id}-scan-${index + 1}`,
        label,
        format: "Any file type",
        status: "missing" as const,
      }));

      const subOrder: SubOrder = {
        id,
        orderId,
        service: row.service,
        icon: row.icon,
        status: "pending",
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
          {
            time: "just now",
            user: "System",
            text: `${row.service} sub-order created from order ${orderId}.`,
          },
        ],
      };
    }

    this._subOrders.update((current) => [...created, ...current]);
    this._details.update((current) => ({ ...details, ...current }));
    this.refreshSubOrderCounts(created.map((item) => item.id));
    return created;
  }

  replaceForOrder(orderId: string, rows: CreateSubOrderInput[]): SubOrder[] {
    if (!orderId) return [];

    const existingIds = this._subOrders()
      .filter((subOrder) => subOrder.orderId === orderId)
      .map((subOrder) => subOrder.id);

    if (existingIds.length > 0) {
      this._subOrders.update((current) =>
        current.filter((subOrder) => subOrder.orderId !== orderId),
      );
      this._details.update((current) => {
        const next = { ...current };
        for (const id of existingIds) {
          delete next[id];
        }
        return next;
      });
    }

    return this.createForOrder(orderId, rows);
  }

  private toApiSubOrderPayload(row: CreateSubOrderInput): Record<string, unknown> {
    return {
      service: row.service,
      icon: row.icon,
      priority: row.priority,
      dueDate: row.dueDate,
      notes: row.notes,
      teeth: row.teeth,
      scansTotal: row.scanRequirements.length,
      creationData: row.creationData,
    };
  }

  private toSubOrder(row: SubOrderJson): SubOrder {
    return {
      ...row,
      icon: ICON_MAP[row.icon] ?? row.icon,
    } as SubOrder;
  }

  saveFormItem(
    subOrderId: string,
    formId: string,
    payload: {
      values: Partial<SubOrderFormDraftValue>;
      context: SubOrderContextSnapshot;
      required: boolean;
    },
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

    const updatedForms = detail.forms.map((form) => {
      if (form.id !== formId) return form;
      const hasMinimumRequired = mergedValues.clinicalNotes.trim().length > 0;
      const nextStatus: SubOrderFormItemStatus =
        form.required || payload.required
          ? hasMinimumRequired
            ? "complete"
            : "incomplete"
          : hasMinimumRequired
            ? "complete"
            : "optional";
      return {
        ...form,
        value,
        status: nextStatus,
      };
    });

    this._details.update((current) => ({
      ...current,
      [subOrderId]: {
        ...detail,
        forms: updatedForms,
      },
    }));
    this.refreshSubOrderCounts([subOrderId]);
  }

  saveScanFiles(
    subOrderId: string,
    scanId: string,
    files: SubOrderScanLocalFile[],
  ): void {
    const detail = this._details()[subOrderId];
    if (!detail) return;
    const now = new Date().toISOString();
    const updatedScans = detail.scans.map((scan) => {
      if (scan.id !== scanId) return scan;
      const nextStatus: SubOrderScanItemStatus =
        files.length > 0 ? "selected-local" : "missing";
      return {
        ...scan,
        localFiles: files,
        status: nextStatus,
        updatedAt: now,
      };
    });

    this._details.update((current) => ({
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

    this._details.update((current) => ({
      ...current,
      [subOrderId]: {
        ...detail,
        activity: [
          { time: "just now", user, text: nextText },
          ...detail.activity,
        ],
      },
    }));
  }

  getByOrderId(orderId: string): SubOrder[] {
    if (!orderId) return [];
    return this._subOrders().filter((s) => s.orderId === orderId);
  }

  private buildDetailFormsForService(
    subOrderId: string,
    row: CreateSubOrderInput,
  ): SubOrderDetail["forms"] {
    const serviceId = this.normalizeServiceId(row.serviceId);
    const templates = SERVICE_FORM_TEMPLATES[serviceId] ?? [
      { label: `${row.service} Clinical Form`, required: true },
    ];

    return templates.map((template, index) => ({
      id: `${subOrderId}-form-${index + 1}`,
      label: template.label,
      required: template.required,
      status: "incomplete" as const,
    }));
  }

  private normalizeServiceId(value: string): string {
    return value.trim().toLowerCase();
  }

  private refreshSubOrderCounts(subOrderIds: string[]): void {
    const idSet = new Set(subOrderIds);
    const details = this._details();

    this._subOrders.update((rows) =>
      rows.map((row) => {
        if (!idSet.has(row.id)) return row;
        const detail = details[row.id];
        if (!detail) return row;

        const formsTotal = detail.forms.length;
        const formsComplete = detail.forms.filter(
          (form) => form.status === "complete",
        ).length;
        const scansTotal = detail.scans.length;
        const scansComplete = detail.scans.filter(
          (scan) =>
            scan.status === "uploaded" || scan.status === "selected-local",
        ).length;
        const status = this.deriveStatus(
          formsTotal,
          formsComplete,
          scansTotal,
          scansComplete,
        );

        return {
          ...row,
          formsTotal,
          formsComplete,
          scansTotal,
          scansComplete,
          status,
        };
      }),
    );
  }

  private deriveStatus(
    formsTotal: number,
    formsComplete: number,
    scansTotal: number,
    scansComplete: number,
  ): SubOrder["status"] {
    const total = formsTotal + scansTotal;
    const done = formsComplete + scansComplete;
    if (total > 0 && done >= total) return "done";
    if (done > 0) return "in-progress";
    return "pending";
  }

  private nextSequenceId(): number {
    const numericIds = this._subOrders()
      .map((subOrder) => Number(subOrder.id.replace("so-", "")))
      .filter((value) => Number.isFinite(value));
    const max = numericIds.length > 0 ? Math.max(...numericIds) : 0;
    return max + 1;
  }
}
