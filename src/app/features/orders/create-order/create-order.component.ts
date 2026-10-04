import { Component, computed, inject, OnDestroy, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { PatientDataService } from "@core/services/patient-data.service";
import { DoctorDataService } from "@core/services/doctor-data.service";
import { ClinicDataService } from "@core/services/clinic-data.service";
import { NavigationService } from "@core/services/navigation.service";
import { OrderDataService } from "@core/services/order-data.service";
import { ScanCenterDataService } from "@core/services/scan-center-data.service";
import { SubOrderDataService } from "@core/services/sub-order-data.service";
import { FormatUtils } from "@core/services/format-utils.service";
import {
  AVAILABLE_SERVICES,
  CreateOrderService,
  ServiceTeethMapping,
} from "@core/models/create-order.model";
import { Clinic, Doctor, Patient } from "@core/models";
import { SubOrderCreationData } from "@core/models/sub-order.model";
import { AppButtonComponent } from "@shared/components/button/button.component";
import { AppSelectComponent } from "@shared/components/select/select.component";
import { TeethChartComponent } from "@shared/components/teeth-chart/teeth-chart.component";
import { SafeHtmlPipe } from "@shared/pipes/safe-html.pipe";
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
  resolveNameSuggestions,
  ServiceClinicalForm,
  ServiceDetail,
  serviceRequiresTeeth,
  SHADES,
} from "../order-flow.utils";

const STEPS = [
  { id: 1, label: "Patient & Clinic", short: "Patient" },
  { id: 2, label: "Services", short: "Services" },
  { id: 3, label: "Teeth Selection", short: "Teeth" },
  { id: 4, label: "Service Details", short: "Details" },
  { id: 5, label: "Forms", short: "Forms" },
  { id: 6, label: "Scans & Files", short: "Files" },
  { id: 7, label: "Review", short: "Review" },
];

const MAIL_RECIPIENTS = [
  "CS",
  "Sales",
  "TP",
  "Ops",
  "Finance",
  "Guides",
  "Restorations",
  "Production",
  "Boston",
  "Scanning Techs",
  "CAD/CAM",
  "QMS",
] as const;

const IH_TASK_RECIPIENTS = [
  "CS",
  "Sales",
  "TP",
  "Ops",
  "Finance",
  "Guides assembly",
  "Restorations EG",
  "Production",
  "Boston",
  "Scanning Techs",
  "CAD/CAM",
] as const;

type CreateOrderFormState = {
  patientName: string;
  doctorName: string;
  doctorId: string;
  clinicId: string;
  billToTarget: "doctor" | "scan-center";
  notes: string;
  shade: string;
  format: string;
};

interface DoctorSuggestion {
  id: string;
  name: string;
  label: string;
}

@Component({
  selector: "app-create-order",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AppButtonComponent,
    AppSelectComponent,
    TeethChartComponent,
    SafeHtmlPipe,
  ],
  templateUrl: "./create-order.component.html",
  styleUrl: "./create-order.component.scss",
})
export class CreateOrderComponent implements OnDestroy {
  private static readonly AUTOCOMPLETE_LIMIT = 6;
  private static readonly AUTOCOMPLETE_DEBOUNCE_MS = 120;

  private readonly patientService = inject(PatientDataService);
  private readonly doctorService = inject(DoctorDataService);
  private readonly clinicService = inject(ClinicDataService);
  private readonly orderService = inject(OrderDataService);
  private readonly scanCenterService = inject(ScanCenterDataService);
  private readonly subOrderService = inject(SubOrderDataService);
  protected readonly formatUtils = inject(FormatUtils);
  protected readonly navigationService = inject(NavigationService);

  readonly patients = this.patientService.patients;
  readonly doctors = this.doctorService.doctors;
  readonly clinics = this.clinicService.clinics;
  readonly scanCenters = this.scanCenterService.scanCenters;

  readonly step = signal(1);
  readonly selectedServices = signal<string[]>([]);
  readonly selectedTeeth = signal<number[]>([]);
  readonly serviceTeeth = signal<ServiceTeethMapping>({});
  readonly activeServiceForTeeth = signal<string | null>(null);
  readonly patientAutocompleteOpen = signal(false);
  readonly doctorAutocompleteOpen = signal(false);
  readonly patientAutocompleteQuery = signal("");
  readonly doctorAutocompleteQuery = signal("");
  private patientAutocompleteTimer: number | null = null;
  private doctorAutocompleteTimer: number | null = null;

  readonly form = signal<CreateOrderFormState>({
    patientName: "",
    doctorName: "",
    doctorId: "",
    clinicId: "",
    billToTarget: "doctor",
    notes: "",
    shade: "A2",
    format: "STL",
  });

  readonly serviceDetails = signal<Record<string, ServiceDetail>>({});

  readonly serviceForms = signal<Record<string, ServiceClinicalForm>>({});
  readonly uploadTarget = signal<{ serviceId: string; requirement: string } | null>(
    null,
  );
  readonly uploadedRequirementFiles = signal<Record<string, string[]>>({});
  readonly internalCaseFiles = signal<string[]>([]);
  readonly sendMailRecipients = signal<string[]>([]);
  readonly ihTaskRecipient = signal<string | null>(null);
  readonly rushTask = signal(false);

  readonly selectedPatient = computed(() =>
    this.matchPatientByName(this.form().patientName),
  );
  readonly selectedDoctor = computed(() =>
    this.matchDoctorByInput(this.form().doctorName, this.form().doctorId),
  );
  readonly selectedClinic = computed(() =>
    this.resolveClinicById(this.form().clinicId),
  );
  readonly patientNameSuggestions = computed(() =>
    resolveNameSuggestions(
      this.patients().map((patient) => patient.name),
      this.patientAutocompleteQuery(),
      CreateOrderComponent.AUTOCOMPLETE_LIMIT,
    ),
  );
  readonly doctorSuggestions = computed<DoctorSuggestion[]>(() => {
    const query = normalizeLookup(this.doctorAutocompleteQuery());
    if (!query) return [];

    const matched = this.doctors()
      .filter((doctor) => {
        const byName = normalizeLookup(doctor.name).includes(query);
        const byLookupId = normalizeLookup(doctor.lookupId ?? "").includes(query);
        return byName || byLookupId;
      })
      .sort((left, right) => {
        const leftLabel = this.doctorSuggestionLabel(left);
        const rightLabel = this.doctorSuggestionLabel(right);
        const leftStartsName = normalizeLookup(left.name).startsWith(query) ? 0 : 1;
        const rightStartsName = normalizeLookup(right.name).startsWith(query)
          ? 0
          : 1;
        if (leftStartsName !== rightStartsName) {
          return leftStartsName - rightStartsName;
        }
        const leftStartsId = normalizeLookup(left.lookupId ?? "").startsWith(query)
          ? 0
          : 1;
        const rightStartsId = normalizeLookup(right.lookupId ?? "").startsWith(
          query,
        )
          ? 0
          : 1;
        if (leftStartsId !== rightStartsId) {
          return leftStartsId - rightStartsId;
        }
        return leftLabel.localeCompare(rightLabel);
      })
      .slice(0, CreateOrderComponent.AUTOCOMPLETE_LIMIT);

    return matched.map((doctor) => ({
      id: doctor.id,
      name: doctor.name,
      label: this.doctorSuggestionLabel(doctor),
    }));
  });
  readonly clinicOptions = computed(() =>
    this.clinics()
      .filter((c) => c.status === "Active" || c.id === this.form().clinicId)
      .map((c) => ({ value: c.id, label: c.name })),
  );
  readonly billToOptions = [
    { value: "doctor", label: "Doctor" },
    { value: "scan-center", label: "Scan Center" },
  ] as const;
  readonly serviceArchOptions = [
    { value: "Maxilla (Upper)", label: "Maxilla (Upper)" },
    { value: "Mandible (Lower)", label: "Mandible (Lower)" },
    { value: "Both", label: "Both" },
  ] as const;
  readonly selectedServiceObjects = computed(() =>
    AVAILABLE_SERVICES.filter((s) => this.selectedServices().includes(s.id)),
  );

  readonly serviceNames = computed(() =>
    this.selectedServiceObjects().map((s) => s.name),
  );

  readonly serviceTeethByName = computed(() => {
    const byId = this.serviceTeeth();
    const out: Record<string, number[]> = {};
    for (const [id, teeth] of Object.entries(byId)) {
      out[AVAILABLE_SERVICES.find((s) => s.id === id)?.name ?? id] = teeth;
    }
    return out;
  });
  readonly steps = STEPS;
  readonly services: CreateOrderService[] = AVAILABLE_SERVICES;
  readonly shades = SHADES;
  readonly fileFormats = FILE_FORMATS;
  readonly occlusalConcepts = OCCLUSAL_CONCEPTS;
  readonly implantSystems = IMPLANT_SYSTEMS;
  readonly occlusalContacts = OCCLUSAL_CONTACTS;
  readonly marginTypes = MARGIN_TYPES;
  readonly materials = MATERIALS;
  readonly mailRecipients = MAIL_RECIPIENTS;
  readonly ihTaskRecipients = IH_TASK_RECIPIENTS;

  readonly selectedServicesTotal = computed(() =>
    this.selectedServiceObjects().reduce((sum, service) => sum + service.basePrice, 0),
  );
  readonly selectedDoctorDisplay = computed(() => {
    const doctor = this.selectedDoctor();
    if (doctor) return doctor.name;
    return this.form().doctorName || "—";
  });
  readonly selectedBillToLabel = computed(() => {
    if (this.form().billToTarget === "scan-center") {
      const centerName = this.scanCenters()[0]?.name ?? "Local Session";
      return `Scan Center • ${centerName}`;
    }
    const doctor = this.selectedDoctor();
    return doctor ? `Doctor • ${doctor.name}` : "Doctor";
  });

  readonly allTeethCombined = computed(() => {
    const set = new Set<number>(this.selectedTeeth());
    for (const teeth of Object.values(this.serviceTeeth())) {
      for (const t of teeth) set.add(t);
    }
    return [...set].sort((a, b) => a - b);
  });

  readonly hasAnyTeeth = computed(
    () =>
      this.selectedTeeth().length > 0 ||
      Object.values(this.serviceTeeth()).some((v) => v.length > 0),
  );
  readonly missingRequiredTeethServices = computed(() =>
    this.selectedServiceObjects()
      .filter((service) => serviceRequiresTeeth(service.id))
      .filter((service) => this.teethForServiceWithFallback(service.id).length === 0)
      .map((service) => service.name),
  );

  setField(key: keyof CreateOrderFormState, value: string): void {
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  onPatientInput(value: string): void {
    this.setField("patientName", value);
    this.scheduleAutocomplete("patient", value);
  }

  onDoctorInput(value: string): void {
    this.form.update((current) => ({
      ...current,
      doctorName: value,
      doctorId: "",
    }));
    this.scheduleAutocomplete("doctor", value);
  }

  onPatientFocus(): void {
    this.patientAutocompleteOpen.set(true);
    this.scheduleAutocomplete("patient", this.form().patientName);
  }

  onDoctorFocus(): void {
    this.doctorAutocompleteOpen.set(true);
    this.scheduleAutocomplete("doctor", this.form().doctorName);
  }

  onPatientBlur(): void {
    window.setTimeout(() => this.patientAutocompleteOpen.set(false), 120);
  }

  onDoctorBlur(): void {
    window.setTimeout(() => {
      this.doctorAutocompleteOpen.set(false);
      this.syncDoctorSelectionFromInput();
    }, 120);
  }

  selectPatientSuggestion(name: string): void {
    this.setField("patientName", name);
    this.patientAutocompleteQuery.set(name);
    this.patientAutocompleteOpen.set(false);
  }

  selectDoctorSuggestion(suggestion: DoctorSuggestion): void {
    this.form.update((current) => ({
      ...current,
      doctorName: suggestion.name,
      doctorId: suggestion.id,
    }));
    this.doctorAutocompleteQuery.set(suggestion.label);
    this.doctorAutocompleteOpen.set(false);
  }

  toggleService(id: string): void {
    this.selectedServices.update((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );

    if (!this.serviceDetails()[id]) {
      this.serviceDetails.update((prev) => ({
        ...prev,
        [id]: defaultServiceDetail(),
      }));
    }
    if (!this.serviceForms()[id]) {
      this.serviceForms.update((prev) => ({
        ...prev,
        [id]: defaultServiceClinicalForm(id),
      }));
    }
  }

  setServiceDetail(
    serviceId: string,
    key: keyof ServiceDetail,
    value: string,
  ): void {
    this.serviceDetails.update((prev) => ({
      ...prev,
      [serviceId]: {
        ...(prev[serviceId] ?? defaultServiceDetail()),
        [key]: value,
      },
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
    this.serviceForms.update((prev) => ({
      ...prev,
      [serviceId]: {
        ...(prev[serviceId] ?? defaultServiceClinicalForm(serviceId)),
        [key]: value,
      },
    }));
  }

  getServiceForm(serviceId: string): ServiceClinicalForm {
    return this.serviceForms()[serviceId] ?? defaultServiceClinicalForm(serviceId);
  }

  needsShadeArch(serviceId: string): boolean {
    return needsShadeArch(serviceId);
  }

  toggleTooth(num: number): void {
    const active = this.activeServiceForTeeth();
    if (active) {
      this.serviceTeeth.update((prev) => {
        const cur = prev[active] || [];
        return {
          ...prev,
          [active]: cur.includes(num)
            ? cur.filter((n) => n !== num)
            : [...cur, num],
        };
      });
    } else {
      this.selectedTeeth.update((prev) =>
        prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num],
      );
    }
  }

  allSelectedTeeth(): number[] {
    return this.visibleSelectedTeeth();
  }

  readonly visibleSelectedTeeth = computed(() => {
    const active = this.activeServiceForTeeth();
    return active
      ? [...(this.serviceTeeth()[active] || [])]
      : [...this.selectedTeeth()];
  });

  teethForService(serviceId: string): number[] {
    return this.serviceTeeth()[serviceId] || [];
  }

  serviceName(serviceId: string): string {
    return (
      AVAILABLE_SERVICES.find((s) => s.id === serviceId)?.name ?? serviceId
    );
  }

  canProceed(): boolean {
    const step = this.step();
    if (step === 1) {
      return (
        this.form().patientName.trim().length > 0 &&
        this.selectedDoctor() !== undefined
      );
    }
    if (step === 2) return this.selectedServices().length > 0;
    if (step === 3) return this.missingRequiredTeethServices().length === 0;
    return true;
  }

  validationMessage(): string {
    if (this.step() === 1) {
      if (this.form().patientName.trim().length === 0) {
        return "Enter a patient name to continue.";
      }
      return "Select a doctor by name or ID to continue.";
    }
    if (this.step() === 2) return "Select at least one service to continue.";
    if (this.step() === 3 && this.missingRequiredTeethServices().length > 0) {
      return `Select teeth for: ${this.missingRequiredTeethServices().join(", ")}.`;
    }
    return "";
  }

  goToStep(target: number): void {
    const current = this.step();
    if (target === current) return;
    if (target < current) {
      this.step.set(target);
      return;
    }
    if (target === current + 1 && this.canProceed()) {
      this.step.set(target);
    }
  }

  canGoToStep(target: number): boolean {
    const current = this.step();
    if (target <= current) return true;
    if (target === current + 1) return this.canProceed();
    return false;
  }

  nextStep(): void {
    if (this.canProceed() && this.step() < STEPS.length) {
      this.step.update((s) => s + 1);
    }
  }

  prevStep(): void {
    if (this.step() === 1) {
      this.navigationService.navigate("orders");
    } else {
      this.step.update((s) => s - 1);
    }
  }

  submitOrder(): void {
    const patientInput = this.form().patientName.trim();
    const doctor = this.selectedDoctor();
    if (
      patientInput.length === 0 ||
      this.selectedServiceObjects().length === 0 ||
      !doctor
    ) {
      if (!doctor) this.step.set(1);
      return;
    }
    if (this.missingRequiredTeethServices().length > 0) {
      this.step.set(3);
      return;
    }
    const patient = this.selectedPatient();
    const clinic = this.selectedClinic();
    const clinicName = clinic?.name ?? "";
    const clinicId = clinic?.id ?? "";
    const doctorName = doctor.name;
    const doctorId = doctor.id;
    const patientName = patient?.name || patientInput;
    const patientId = patient?.id || this.syntheticEntityId("pt", patientName);

    const scanCenter = this.scanCenters()[0];
    const selectedServices = this.selectedServiceObjects();
    const dueDate = this.defaultDueDate(selectedServices);
    const allTeeth = this.allTeethCombined();
    const internalCaseNote = this.form().notes.trim();
    const internalCaseFiles = this.internalCaseFiles();
    const sendMailTo = this.sendMailRecipients();
    const sendIhTaskTo = this.ihTaskRecipient();
    const rushTask = this.rushTask();
    const serviceRows = selectedServices.map((service) => {
      const selectedTeeth = this.teethForServiceWithFallback(service.id);
      const serviceDetails = this.getServiceDetail(service.id);
      const serviceForm = this.getServiceForm(service.id);
      const fileReferences = this.serviceFileReferences(service.id);
      const creationData: SubOrderCreationData = {
        serviceId: service.id,
        serviceDetails: { ...serviceDetails },
        serviceForm: { ...serviceForm },
        selectedTeeth,
        scanRequirements: [...service.scanRequirements],
        fileReferences,
      };
      return {
        serviceId: service.id,
        service: service.name,
        icon: service.icon,
        priority: "Normal" as const,
        dueDate,
        notes:
          serviceDetails.serviceNotes ||
          this.form().notes ||
          this.fallbackServiceNote(service.name),
        teeth: selectedTeeth,
        scanRequirements: [...service.scanRequirements],
        fileReferences,
        creationData,
      };
    });

    const createdOrder = this.orderService.createOrder({
      patientId,
      patientName,
      doctorId,
      doctorName,
      clinicId,
      clinicName,
      scanCenterId: scanCenter?.id ?? "scan-local",
      scanCenterName: scanCenter?.name ?? "Local Session",
      status: "New",
      priority: "Normal",
      restoration: mapServiceToRestoration(selectedServices[0].id),
      arch: deriveArchFromSelection(allTeeth),
      format: this.form().format,
      shade: this.form().shade,
      units: Math.max(allTeeth.length, 1),
      amount: this.selectedServicesTotal(),
      billed: false,
      billTo:
        this.form().billToTarget === "scan-center"
          ? `Scan Center • ${scanCenter?.name ?? "Local Session"}`
          : `Doctor • ${doctorName}`,
      vouchers: 0,
      isLocked: false,
      hasNotes: internalCaseNote.length > 0 || internalCaseFiles.length > 0,
      notes: internalCaseNote,
      dueDate,
      csTask: sendIhTaskTo
        ? `${sendIhTaskTo}${rushTask ? " (RUSH)" : ""}`
        : undefined,
      creationData: {
        services: serviceRows.map((row) => structuredClone(row.creationData)),
        communication: {
          internalCaseNote,
          internalCaseFiles: [...internalCaseFiles],
          sendMailTo: [...sendMailTo],
          sendIhTaskTo: sendIhTaskTo ?? undefined,
          rushTask,
        },
      },
    });

    this.subOrderService.createForOrder(createdOrder.id, serviceRows);
    this.navigationService.navigate("viewOrder", { orderId: createdOrder.id });
  }

  private defaultDueDate(services: readonly CreateOrderService[]): string {
    const fallbackDays = 7;
    const turnaroundDays =
      services.length > 0
        ? Math.max(...services.map((service) => service.turnaroundDays))
        : fallbackDays;
    const date = new Date();
    date.setDate(date.getDate() + turnaroundDays);
    return date.toISOString().slice(0, 10);
  }

  private fallbackServiceNote(serviceName: string): string {
    const selected = this.allTeethCombined();
    const teethLabel =
      selected.length > 0
        ? `teeth ${selected.join(", ")}`
        : "no specific teeth";
    return `${serviceName} requested with ${teethLabel}.`;
  }

  private teethForServiceWithFallback(serviceId: string): number[] {
    const serviceSpecific = this.serviceTeeth()[serviceId] ?? [];
    if (serviceSpecific.length > 0) return [...serviceSpecific];
    return [...this.selectedTeeth()];
  }

  toggleMailRecipient(recipient: string, checked: boolean): void {
    this.sendMailRecipients.update((current) => {
      if (checked) {
        if (current.includes(recipient)) return current;
        return [...current, recipient];
      }
      return current.filter((item) => item !== recipient);
    });
  }

  setIhTaskRecipient(recipient: string): void {
    this.ihTaskRecipient.set(recipient);
  }

  toggleRushTask(checked: boolean): void {
    this.rushTask.set(checked);
  }

  onInternalCaseFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) {
      input.value = "";
      return;
    }

    const incoming = Array.from(files)
      .map((file) => file.name.trim())
      .filter((name) => name.length > 0);

    if (incoming.length > 0) {
      this.internalCaseFiles.update((current) => {
        const merged = [...current];
        for (const name of incoming) {
          if (!merged.includes(name)) merged.push(name);
        }
        return merged;
      });
    }

    input.value = "";
  }

  removeInternalCaseFile(fileName: string): void {
    this.internalCaseFiles.update((current) =>
      current.filter((entry) => entry !== fileName),
    );
  }

  private resolveClinicById(clinicId: string): Clinic | undefined {
    return this.clinics().find((clinic) => clinic.id === clinicId);
  }

  private matchPatientByName(name: string): Patient | undefined {
    const needle = normalizeLookup(name);
    return this.patients().find(
      (patient) => normalizeLookup(patient.name) === needle,
    );
  }

  private matchDoctorByInput(name: string, doctorId: string): Doctor | undefined {
    const byId = doctorId.trim();
    if (byId) {
      const matchedById = this.matchDoctorById(byId);
      if (matchedById) return matchedById;
    }

    const needle = normalizeLookup(name);
    return this.doctors().find(
      (doctor) =>
        normalizeLookup(doctor.name) === needle ||
        normalizeLookup(doctor.lookupId ?? "") === needle ||
        normalizeLookup(doctor.id) === needle,
    );
  }

  private matchDoctorById(doctorId: string): Doctor | undefined {
    const needle = normalizeLookup(doctorId);
    return this.doctors().find((doctor) => normalizeLookup(doctor.id) === needle);
  }

  private syncDoctorSelectionFromInput(): void {
    const current = this.form();
    const matched = this.matchDoctorByInput(current.doctorName, current.doctorId);
    if (!matched) {
      this.form.update((value) => ({ ...value, doctorId: "" }));
      return;
    }
    this.form.update((value) => ({
      ...value,
      doctorName: matched.name,
      doctorId: matched.id,
    }));
  }

  private doctorSuggestionLabel(doctor: Doctor): string {
    return `${doctor.name}:${doctor.lookupId ?? doctor.id}`;
  }

  private syntheticEntityId(prefix: string, value: string): string {
    const slug = value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    return `${prefix}-manual-${slug || "entry"}-${Date.now().toString().slice(-6)}`;
  }

  private scheduleAutocomplete(
    type: "patient" | "doctor",
    value: string,
  ): void {
    this.clearAutocompleteTimer(type);
    const timer = window.setTimeout(() => {
      if (type === "patient") this.patientAutocompleteQuery.set(value);
      else this.doctorAutocompleteQuery.set(value);
    }, CreateOrderComponent.AUTOCOMPLETE_DEBOUNCE_MS);

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

  ngOnDestroy(): void {
    this.clearAutocompleteTimer("patient");
    this.clearAutocompleteTimer("doctor");
  }

  getStepConfig(stepId: number) {
    const current = this.step();
    const done = stepId < current;
    const active = stepId === current;
    return { done, active };
  }

  selectedServiceNames(): string {
    const names = this.selectedServiceObjects().map((service) => service.name);
    return names.length > 0 ? names.join(", ") : "—";
  }

  getIconSvg(name: string): string {
    const icons: Record<string, string> = {
      check:
        '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
      "check-lg":
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
      "chevron-right":
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
      "chevron-left":
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
      plus: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
      x: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
      "file-up":
        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 12 15 15"/></svg>',
      "file-up-lg":
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 12 15 15"/></svg>',
    };
    return icons[name] || "";
  }

  getInitials(name: string): string {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  openUploadDialogForRequirement(
    serviceId: string,
    requirement: string,
    input: HTMLInputElement,
  ): void {
    this.uploadTarget.set({ serviceId, requirement });
    input.value = "";
    input.click();
  }

  openUploadDialogForService(serviceId: string, input: HTMLInputElement): void {
    const service = this.selectedServiceObjects().find((s) => s.id === serviceId);
    const firstRequirement = service?.scanRequirements[0];
    if (!firstRequirement) return;
    this.openUploadDialogForRequirement(serviceId, firstRequirement, input);
  }

  onUploadFilesSelected(event: Event): void {
    const target = this.uploadTarget();
    if (!target) return;

    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) {
      input.value = "";
      return;
    }

    const key = this.requirementKey(target.serviceId, target.requirement);
    const additions = Array.from(files)
      .map((file) => file.name.trim())
      .filter((name) => name.length > 0);

    if (additions.length > 0) {
      this.uploadedRequirementFiles.update((prev) => {
        const existing = prev[key] ?? [];
        const merged = [...existing];
        for (const name of additions) {
          if (!merged.includes(name)) merged.push(name);
        }
        return { ...prev, [key]: merged };
      });
    }

    input.value = "";
  }

  filesForRequirement(serviceId: string, requirement: string): string[] {
    return (
      this.uploadedRequirementFiles()[this.requirementKey(serviceId, requirement)] ??
      []
    );
  }

  removeRequirementFile(
    serviceId: string,
    requirement: string,
    fileName: string,
  ): void {
    const key = this.requirementKey(serviceId, requirement);
    this.uploadedRequirementFiles.update((prev) => {
      const remaining = (prev[key] ?? []).filter((name) => name !== fileName);
      if (remaining.length === 0) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: remaining };
    });
  }

  serviceFileReferences(serviceId: string): string[] {
    const refs = this.uploadedRequirementFiles();
    const servicePrefix = `${serviceId}::`;
    const merged = new Set<string>();
    for (const [key, files] of Object.entries(refs)) {
      if (!key.startsWith(servicePrefix)) continue;
      for (const file of files) merged.add(file);
    }
    return [...merged];
  }

  private requirementKey(serviceId: string, requirement: string): string {
    return `${serviceId}::${requirement}`;
  }
}
