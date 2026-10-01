import {
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormBuilder, Validators } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { OrderDataService } from "@core/services/order-data.service";
import { PatientDataService } from "@core/services/patient-data.service";
import { DoctorDataService } from "@core/services/doctor-data.service";
import { ClinicDataService } from "@core/services/clinic-data.service";
import { NavigationService } from "@core/services/navigation.service";
import { SubOrderDataService } from "@core/services/sub-order-data.service";
import { AppButtonComponent } from "@shared/components/button/button.component";
import { IconActionButtonComponent } from "@shared/components/icon-action-button/icon-action-button.component";
import { AppTextFieldComponent } from "@shared/components/input/input.component";
import { AppSelectComponent } from "@shared/components/select/select.component";
import { TeethChartComponent } from "@shared/components/teeth-chart/teeth-chart.component";
import { SafeHtmlPipe } from "@shared/pipes/safe-html.pipe";
import { statusDisplayLabel } from "@shared/utils/status-label";
import { ArchType, Order, Patient, Doctor, SubOrderCreationData } from "@core/models";
import { AVAILABLE_SERVICES } from "@core/models/create-order.model";
import {
  defaultServiceClinicalForm,
  defaultServiceDetail,
  deriveArchFromSelection,
  FILE_FORMATS,
  IMPLANT_SYSTEMS,
  mapServiceToRestoration,
  MARGIN_TYPES,
  MATERIALS,
  needsShadeArch,
  normalizeLookup,
  OCCLUSAL_CONCEPTS,
  OCCLUSAL_CONTACTS,
  parseTeethInput,
  resolveNameSuggestions,
  ServiceClinicalForm,
  ServiceDetail,
  serviceRequiresTeeth,
  SHADES,
} from "../order-flow.utils";

@Component({
  selector: "app-edit-order",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppButtonComponent,
    IconActionButtonComponent,
    AppTextFieldComponent,
    AppSelectComponent,
    TeethChartComponent,
    SafeHtmlPipe,
  ],
  templateUrl: "./edit-order.component.html",
  styleUrl: "./edit-order.component.scss",
})
export class EditOrderComponent implements OnDestroy {
  private static readonly AUTOCOMPLETE_LIMIT = 6;
  private static readonly AUTOCOMPLETE_DEBOUNCE_MS = 120;

  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly orderService = inject(OrderDataService);
  private readonly patientService = inject(PatientDataService);
  private readonly doctorService = inject(DoctorDataService);
  private readonly clinicService = inject(ClinicDataService);
  private readonly subOrderService = inject(SubOrderDataService);
  protected readonly navigationService = inject(NavigationService);

  readonly patients = this.patientService.patients;
  readonly doctors = this.doctorService.doctors;
  readonly clinics = this.clinicService.clinics;
  readonly saved = signal(false);
  readonly isLocked = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly selectedServiceIds = signal<string[]>([]);
  readonly serviceTeeth = signal<Record<string, number[]>>({});
  readonly serviceLabNotes = signal<Record<string, string>>({});
  readonly serviceDetails = signal<Record<string, ServiceDetail>>({});
  readonly serviceForms = signal<Record<string, ServiceClinicalForm>>({});
  readonly patientAutocompleteOpen = signal(false);
  readonly doctorAutocompleteOpen = signal(false);
  readonly patientAutocompleteQuery = signal("");
  readonly doctorAutocompleteQuery = signal("");

  private patientAutocompleteTimer: number | null = null;
  private doctorAutocompleteTimer: number | null = null;
  private readonly hydratedOrderId = signal<string | null>(null);

  readonly order = computed(() => {
    const orderId = this.route.snapshot.paramMap.get("orderId");
    return this.orderService.getOrderById(orderId ?? "");
  });

  readonly editForm = this.fb.nonNullable.group({
    patientName: ["", Validators.required],
    doctorName: [""],
    clinicId: [""],
    restoration: ["Crown", Validators.required],
    arch: ["Maxilla", Validators.required],
    shade: ["A2", Validators.required],
    format: ["STL", Validators.required],
    units: [1, [Validators.required, Validators.min(1), Validators.max(32)]],
    status: ["New", Validators.required],
    priority: ["Normal" as string, Validators.required],
    dueDate: [""],
    billTo: [""],
    notes: [""],
  });

  readonly restorationOptions = [
    "Crown",
    "Bridge",
    "Veneer",
    "Implant Crown",
    "Full Arch",
    "Night Guard",
    "Inlay",
    "Onlay",
  ];
  readonly shadeOptions = SHADES;
  readonly formatOptions = FILE_FORMATS;
  readonly statusOptions = [
    "New",
    "Review",
    "Design",
    "Production",
    "Quality Check",
    "Ready",
    "Completed",
    "Cancelled",
  ];
  readonly priorityOptions = ["Low", "Normal", "High", "Urgent"];
  readonly clinicOptions = computed(() =>
    this.clinics()
      .filter(
        (clinic) =>
          clinic.status === "Active" ||
          clinic.id === this.editForm.controls.clinicId.value,
      )
      .map((clinic) => ({ value: clinic.id, label: clinic.name })),
  );
  readonly patientNameSuggestions = computed(() =>
    resolveNameSuggestions(
      this.patients().map((patient) => patient.name),
      this.patientAutocompleteQuery(),
      EditOrderComponent.AUTOCOMPLETE_LIMIT,
    ),
  );
  readonly doctorNameSuggestions = computed(() =>
    resolveNameSuggestions(
      this.doctors().map((doctor) => doctor.name),
      this.doctorAutocompleteQuery(),
      EditOrderComponent.AUTOCOMPLETE_LIMIT,
    ),
  );
  readonly services = AVAILABLE_SERVICES;
  readonly selectedServices = computed(() =>
    this.services.filter((service) => this.selectedServiceIds().includes(service.id)),
  );
  readonly serviceArchOptions = [
    { value: "Maxilla (Upper)", label: "Maxilla (Upper)" },
    { value: "Mandible (Lower)", label: "Mandible (Lower)" },
    { value: "Both", label: "Both" },
  ] as const;
  readonly occlusalConcepts = OCCLUSAL_CONCEPTS;
  readonly implantSystems = IMPLANT_SYSTEMS;
  readonly occlusalContacts = OCCLUSAL_CONTACTS;
  readonly marginTypes = MARGIN_TYPES;
  readonly materials = MATERIALS;
  readonly archSelectOptions = [
    { value: "Maxilla", label: "Maxilla (Upper)" },
    { value: "Mandible", label: "Mandible (Lower)" },
    { value: "Both", label: "Both Arches" },
  ] as const;
  readonly statusSelectOptions = computed(() =>
    this.statusOptions.map((opt) => ({
      value: opt,
      label: this.statusLabel(opt),
    })),
  );
  readonly missingRequiredTeethServices = computed(() =>
    this.selectedServices()
      .filter((service) => serviceRequiresTeeth(service.id))
      .filter((service) => this.teethForService(service.id).length === 0)
      .map((service) => service.name),
  );
  readonly canSave = computed(() => {
    if (!this.editForm.valid) return false;
    if (this.selectedServiceIds().length === 0) return false;
    if (this.editForm.controls.patientName.value.trim().length === 0) return false;
    return this.missingRequiredTeethServices().length === 0;
  });

  constructor() {
    effect(() => {
      const current = this.order();
      if (!current) return;
      if (this.hydratedOrderId() === current.id) return;
      this.hydrateFromOrder(current);
      this.hydratedOrderId.set(current.id);
    });

    effect(() => {
      const selected = this.selectedServiceIds();
      if (selected.length === 0) return;
      const mapped = mapServiceToRestoration(selected[0]);
      if (this.editForm.controls.restoration.value !== mapped) {
        this.editForm.controls.restoration.setValue(mapped, { emitEvent: false });
      }
    });
  }

  toggleService(serviceId: string): void {
    this.selectedServiceIds.update((current) => {
      if (current.includes(serviceId)) {
        return current.filter((id) => id !== serviceId);
      }
      return [...current, serviceId];
    });
    this.ensureServiceState(serviceId);
    this.saveError.set(null);
  }

  serviceSelected(serviceId: string): boolean {
    return this.selectedServiceIds().includes(serviceId);
  }

  teethInputValue(serviceId: string): string {
    return this.teethForService(serviceId).join(", ");
  }

  setServiceTeethInput(serviceId: string, value: string): void {
    this.serviceTeeth.update((current) => ({
      ...current,
      [serviceId]: parseTeethInput(value),
    }));
  }

  toggleServiceTooth(serviceId: string, tooth: number): void {
    this.serviceTeeth.update((current) => {
      const selected = current[serviceId] ?? [];
      const next = selected.includes(tooth)
        ? selected.filter((value) => value !== tooth)
        : [...selected, tooth];
      return { ...current, [serviceId]: next.sort((left, right) => left - right) };
    });
  }

  clearServiceTeeth(serviceId: string): void {
    this.serviceTeeth.update((current) => ({ ...current, [serviceId]: [] }));
  }

  serviceTeethSelection(serviceId: string): number[] {
    return this.teethForService(serviceId);
  }

  serviceTeethLegend(serviceId: string, serviceName: string): Record<string, number[]> {
    return { [serviceName]: this.teethForService(serviceId) };
  }

  setServiceClinicalNotes(serviceId: string, value: string): void {
    this.setServiceForm(serviceId, "clinicalNotes", value);
  }

  setServiceLabNotes(serviceId: string, value: string): void {
    this.serviceLabNotes.update((current) => ({
      ...current,
      [serviceId]: value,
    }));
  }

  setServiceDetail(
    serviceId: string,
    key: keyof ServiceDetail,
    value: string,
  ): void {
    this.serviceDetails.update((current) => ({
      ...current,
      [serviceId]: { ...this.getServiceDetail(serviceId), [key]: value },
    }));
  }

  getServiceDetail(serviceId: string): ServiceDetail {
    return this.serviceDetails()[serviceId] ?? defaultServiceDetail();
  }

  setServiceForm(
    serviceId: string,
    key: keyof ServiceClinicalForm,
    value: string,
  ): void {
    this.serviceForms.update((current) => ({
      ...current,
      [serviceId]: { ...this.getServiceForm(serviceId), [key]: value },
    }));
  }

  getServiceForm(serviceId: string): ServiceClinicalForm {
    return this.serviceForms()[serviceId] ?? defaultServiceClinicalForm(serviceId);
  }

  clinicalNotesValue(serviceId: string): string {
    return this.getServiceForm(serviceId).clinicalNotes;
  }

  labNotesValue(serviceId: string): string {
    return this.serviceLabNotes()[serviceId] ?? "";
  }

  needsShadeArch(serviceId: string): boolean {
    return needsShadeArch(serviceId);
  }

  onPatientInput(value: string): void {
    this.editForm.controls.patientName.setValue(value);
    this.editForm.controls.patientName.markAsDirty();
    this.scheduleAutocomplete("patient", value);
  }

  onDoctorInput(value: string): void {
    this.editForm.controls.doctorName.setValue(value);
    this.editForm.controls.doctorName.markAsDirty();
    this.scheduleAutocomplete("doctor", value);
  }

  onPatientFocus(): void {
    this.patientAutocompleteOpen.set(true);
    this.scheduleAutocomplete("patient", this.editForm.controls.patientName.value);
  }

  onDoctorFocus(): void {
    this.doctorAutocompleteOpen.set(true);
    this.scheduleAutocomplete("doctor", this.editForm.controls.doctorName.value);
  }

  onPatientBlur(): void {
    this.editForm.controls.patientName.markAsTouched();
    window.setTimeout(() => this.patientAutocompleteOpen.set(false), 120);
  }

  onDoctorBlur(): void {
    this.editForm.controls.doctorName.markAsTouched();
    window.setTimeout(() => this.doctorAutocompleteOpen.set(false), 120);
  }

  selectPatientSuggestion(name: string): void {
    this.editForm.controls.patientName.setValue(name);
    this.patientAutocompleteQuery.set(name);
    this.patientAutocompleteOpen.set(false);
  }

  selectDoctorSuggestion(name: string): void {
    this.editForm.controls.doctorName.setValue(name);
    this.doctorAutocompleteQuery.set(name);
    this.doctorAutocompleteOpen.set(false);
  }

  toggleLock(): void {
    this.isLocked.update((v) => !v);
  }

  fieldInvalid(controlName: string): boolean {
    const control = this.editForm.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  discard(): void {
    const current = this.order();
    if (current) this.navigationService.navigate("viewOrder", { orderId: current.id });
    else this.navigationService.navigate("orders");
  }

  saveChanges(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    if (this.selectedServiceIds().length === 0) {
      this.saveError.set("Select at least one service before saving.");
      return;
    }
    if (this.missingRequiredTeethServices().length > 0) {
      this.saveError.set(
        `Select teeth for: ${this.missingRequiredTeethServices().join(", ")}.`,
      );
      return;
    }

    const current = this.order();
    if (!current) return;

    const raw = this.editForm.getRawValue();
    const patientNameInput = raw.patientName.trim();
    if (patientNameInput.length === 0) {
      this.saveError.set("Patient name is required.");
      return;
    }

    const matchedPatient = this.matchPatientByName(patientNameInput);
    const doctorNameInput = raw.doctorName.trim();
    const matchedDoctor = this.matchDoctorByName(doctorNameInput);
    const selectedClinic = this.resolveClinicById(raw.clinicId);
    const clinicName = selectedClinic?.name ?? "";
    const clinicId = selectedClinic?.id ?? "";
    const doctorName = matchedDoctor?.name || doctorNameInput;
    const doctorId = matchedDoctor?.id || (doctorName ? this.syntheticEntityId("dr", doctorName) : "");
    const patientName = matchedPatient?.name || patientNameInput;
    const patientId = matchedPatient?.id || this.syntheticEntityId("pt", patientName);

    const dueDate = raw.dueDate || current.dueDate || this.defaultDueDate();
    const selectedServices = this.selectedServices();
    const allTeeth = this.collectAllTeeth();
    const rows = selectedServices.map((service) => {
      const selectedTeeth = this.teethForService(service.id);
      const details = this.getServiceDetail(service.id);
      const serviceForm = this.getServiceForm(service.id);
      const creationData: SubOrderCreationData = {
        serviceId: service.id,
        serviceDetails: { ...details },
        serviceForm: { ...serviceForm },
        selectedTeeth: [...selectedTeeth],
        scanRequirements: [...service.scanRequirements],
        fileReferences:
          current.creationData?.services
            .find((entry) => entry.serviceId === service.id)
            ?.fileReferences.slice() ?? [],
      };
      return {
        serviceId: service.id,
        service: service.name,
        icon: service.icon,
        priority: raw.priority as Order["priority"],
        dueDate,
        notes:
          this.labNotesValue(service.id).trim() ||
          this.fallbackServiceNote(service.name, selectedTeeth),
        teeth: [...selectedTeeth],
        scanRequirements: [...service.scanRequirements],
        creationData,
      };
    });

    this.orderService.updateOrder(current.id, {
      patientId,
      patientName,
      doctorId,
      doctorName,
      clinicId,
      clinicName,
      restoration: mapServiceToRestoration(selectedServices[0].id),
      arch: deriveArchFromSelection(allTeeth, raw.arch as ArchType),
      shade: raw.shade,
      format: raw.format,
      units: Math.max(raw.units, allTeeth.length, 1),
      status: raw.status as Order["status"],
      priority: raw.priority as Order["priority"],
      dueDate,
      billTo: raw.billTo.trim() || clinicName || patientName,
      notes: raw.notes,
      hasNotes: raw.notes.trim().length > 0,
      isLocked: this.isLocked(),
      creationData: {
        services: rows.map((row) => structuredClone(row.creationData)),
      },
    });

    this.subOrderService.replaceForOrder(current.id, rows);
    this.saveError.set(null);
    this.saved.set(true);
    window.setTimeout(() => {
      this.navigationService.navigate("viewOrder", { orderId: current.id });
    }, 800);
  }

  goBack(): void {
    this.discard();
  }

  getIconSvg(name: string): string {
    const icons: Record<string, string> = {
      "arrow-left":
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>',
      x: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
      save: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
      check:
        '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    };
    return icons[name] || "";
  }

  statusLabel(status: string): string {
    return statusDisplayLabel(status);
  }

  ngOnDestroy(): void {
    this.clearAutocompleteTimer("patient");
    this.clearAutocompleteTimer("doctor");
  }

  private hydrateFromOrder(order: Order): void {
    this.editForm.patchValue({
      patientName: order.patientName,
      doctorName: order.doctorName,
      clinicId: order.clinicId,
      restoration: order.restoration,
      arch: order.arch,
      shade: order.shade,
      format: order.format,
      units: order.units,
      status: order.status,
      priority: order.priority,
      dueDate: order.dueDate?.slice(0, 10) ?? "",
      billTo: order.billTo,
      notes: order.notes,
    });
    this.isLocked.set(order.isLocked);
    this.saved.set(false);
    this.initializeServicePlan(order);
  }

  private initializeServicePlan(order: Order): void {
    const serviceRows = order.creationData?.services ?? [];
    const relatedSubOrders = this.subOrderService.getByOrderId(order.id);

    const nextServiceIds: string[] = [];
    const nextTeeth: Record<string, number[]> = {};
    const nextLabNotes: Record<string, string> = {};
    const nextDetails: Record<string, ServiceDetail> = {};
    const nextForms: Record<string, ServiceClinicalForm> = {};

    for (const row of serviceRows) {
      const serviceId = this.resolveServiceId(row.serviceId, "");
      if (!serviceId) continue;
      if (!nextServiceIds.includes(serviceId)) nextServiceIds.push(serviceId);
      const rowTeeth = Array.isArray(row.selectedTeeth) ? row.selectedTeeth : [];
      nextTeeth[serviceId] = parseTeethInput(rowTeeth.join(","));
      nextDetails[serviceId] = {
        ...defaultServiceDetail(),
        ...row.serviceDetails,
      };
      nextForms[serviceId] = {
        ...defaultServiceClinicalForm(serviceId),
        ...row.serviceForm,
      };
    }

    for (const subOrder of relatedSubOrders) {
      const serviceId = this.resolveServiceId("", subOrder.service) ?? "other";
      if (!nextServiceIds.includes(serviceId)) nextServiceIds.push(serviceId);
      if (!(serviceId in nextTeeth)) nextTeeth[serviceId] = [...subOrder.teeth];
      if (!(serviceId in nextDetails)) {
        nextDetails[serviceId] = {
          ...defaultServiceDetail(),
          serviceNotes: subOrder.notes,
          shade: order.shade,
          fileFormat: order.format,
          arch:
            order.arch === "Maxilla"
              ? "Maxilla (Upper)"
              : order.arch === "Mandible"
                ? "Mandible (Lower)"
                : "Both",
        };
      }
      if (!(serviceId in nextForms)) {
        nextForms[serviceId] = defaultServiceClinicalForm(serviceId);
      }
      nextLabNotes[serviceId] = subOrder.notes;
    }

    if (nextServiceIds.length === 0) {
      const inferred = this.inferServiceIdFromOrder(order);
      nextServiceIds.push(inferred);
      nextTeeth[inferred] = [];
      nextDetails[inferred] = {
        ...defaultServiceDetail(),
        shade: order.shade,
        fileFormat: order.format,
      };
      nextForms[inferred] = defaultServiceClinicalForm(inferred);
    }

    this.selectedServiceIds.set(nextServiceIds);
    this.serviceTeeth.set(nextTeeth);
    this.serviceLabNotes.set(nextLabNotes);
    this.serviceDetails.set(nextDetails);
    this.serviceForms.set(nextForms);
  }

  private inferServiceIdFromOrder(order: Order): string {
    if (order.restoration === "Implant Crown") return "surgical-guide";
    if (order.restoration === "Full Arch") return "gfmr";
    if (order.restoration === "Bridge") return "fmb";
    if (order.restoration === "Veneer") return "final-restoration";
    return "other";
  }

  private ensureServiceState(serviceId: string): void {
    if (!this.serviceDetails()[serviceId]) {
      this.serviceDetails.update((current) => ({
        ...current,
        [serviceId]: defaultServiceDetail(),
      }));
    }
    if (!this.serviceForms()[serviceId]) {
      this.serviceForms.update((current) => ({
        ...current,
        [serviceId]: defaultServiceClinicalForm(serviceId),
      }));
    }
  }

  private resolveServiceId(serviceId: string, serviceName: string): string | null {
    if (serviceId && this.services.some((service) => service.id === serviceId)) {
      return serviceId;
    }
    if (!serviceName) return null;
    const serviceNameKey = normalizeLookup(serviceName);
    const byName = this.services.find(
      (service) => normalizeLookup(service.name) === serviceNameKey,
    );
    return byName?.id ?? null;
  }

  private teethForService(serviceId: string): number[] {
    return [...(this.serviceTeeth()[serviceId] ?? [])];
  }

  private collectAllTeeth(): number[] {
    const set = new Set<number>();
    for (const serviceId of this.selectedServiceIds()) {
      for (const tooth of this.teethForService(serviceId)) set.add(tooth);
    }
    return [...set].sort((a, b) => a - b);
  }

  private fallbackServiceNote(serviceName: string, selectedTeeth: number[]): string {
    const teethLabel =
      selectedTeeth.length > 0
        ? `teeth ${selectedTeeth.join(", ")}`
        : "no specific teeth";
    return `${serviceName} updated for ${teethLabel}.`;
  }

  private resolveClinicById(clinicId: string): { id: string; name: string } | undefined {
    const selected = this.clinics().find((clinic) => clinic.id === clinicId);
    if (!selected) return undefined;
    return { id: selected.id, name: selected.name };
  }

  private matchPatientByName(name: string): Patient | undefined {
    const needle = normalizeLookup(name);
    return this.patients().find((patient) => normalizeLookup(patient.name) === needle);
  }

  private matchDoctorByName(name: string): Doctor | undefined {
    const needle = normalizeLookup(name);
    return this.doctors().find((doctor) => normalizeLookup(doctor.name) === needle);
  }

  private syntheticEntityId(prefix: string, value: string): string {
    const slug = value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    return `${prefix}-manual-${slug || "entry"}-${Date.now().toString().slice(-6)}`;
  }

  private defaultDueDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().slice(0, 10);
  }

  private scheduleAutocomplete(type: "patient" | "doctor", value: string): void {
    this.clearAutocompleteTimer(type);
    const timer = window.setTimeout(() => {
      if (type === "patient") this.patientAutocompleteQuery.set(value);
      else this.doctorAutocompleteQuery.set(value);
    }, EditOrderComponent.AUTOCOMPLETE_DEBOUNCE_MS);

    if (type === "patient") this.patientAutocompleteTimer = timer;
    else this.doctorAutocompleteTimer = timer;
  }

  private clearAutocompleteTimer(type: "patient" | "doctor"): void {
    const current =
      type === "patient"
        ? this.patientAutocompleteTimer
        : this.doctorAutocompleteTimer;
    if (current !== null) window.clearTimeout(current);
    if (type === "patient") this.patientAutocompleteTimer = null;
    else this.doctorAutocompleteTimer = null;
  }
}
