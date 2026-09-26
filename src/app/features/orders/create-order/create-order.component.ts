import { Component, computed, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { PatientDataService } from "@core/services/patient-data.service";
import { DoctorDataService } from "@core/services/doctor-data.service";
import { ClinicDataService } from "@core/services/clinic-data.service";
import { NavigationService } from "@core/services/navigation.service";
import { OrderDataService } from "@core/services/order-data.service";
import { ScanCenterDataService } from "@core/services/scan-center-data.service";
import { SubOrderDataService } from "@core/services/sub-order-data.service";
import {
  AVAILABLE_SERVICES,
  CreateOrderService,
  ServiceTeethMapping,
} from "@core/models/create-order.model";
import { ArchType, RestoType } from "@core/models";
import { SubOrderCreationData } from "@core/models/sub-order.model";
import { AppButtonComponent } from "@shared/components/button/button.component";
import { AppTextFieldComponent } from "@shared/components/input/input.component";
import { AppSelectComponent } from "@shared/components/select/select.component";
import { TeethChartComponent } from "@shared/components/teeth-chart/teeth-chart.component";
import { SafeHtmlPipe } from "@shared/pipes/safe-html.pipe";

export interface ServiceDetail {
  shade: string;
  arch: string;
  occlusalConcept: string;
  implantSystem: string;
  fileFormat: string;
  serviceNotes: string;
}

export interface ServiceClinicalForm {
  clinicalNotes: string;
  occlusalContact: string;
  marginType: string;
  material: string;
  specialInstructions: string;
}

const STEPS = [
  { id: 1, label: "Patient & Clinic", short: "Patient" },
  { id: 2, label: "Services", short: "Services" },
  { id: 3, label: "Teeth Selection", short: "Teeth" },
  { id: 4, label: "Service Details", short: "Details" },
  { id: 5, label: "Forms", short: "Forms" },
  { id: 6, label: "Scans & Files", short: "Files" },
  { id: 7, label: "Review", short: "Review" },
];

const SHADES = ["A1", "A2", "A3", "A3.5", "B1", "B2", "C2", "D3", "BL1", "BL2"];
const FILE_FORMATS = ["STL", "PLY", "OBJ", "DICOM", "STL+OBJ"];
const OCCLUSAL_CONCEPTS = [
  "Mutually Protected",
  "Group Function",
  "Full Balanced",
];
const IMPLANT_SYSTEMS = [
  "Straumann",
  "Nobel Biocare",
  "Zimmer Biomet",
  "Neodent",
  "Other",
];
const OCCLUSAL_CONTACTS = ["Light contact", "Full contact", "No contact"];
const MARGIN_TYPES = ["Chamfer", "Shoulder", "Feather edge", "Knife edge"];
const MATERIALS = ["Zirconia (Multilayer)", "PFM", "E-max", "PMMA", "Titanium"];

function defaultDetail(): ServiceDetail {
  return {
    shade: "A2",
    arch: "Both",
    occlusalConcept: "Mutually Protected",
    implantSystem: "Straumann",
    fileFormat: "STL",
    serviceNotes: "",
  };
}

function defaultClinicalForm(): ServiceClinicalForm {
  return {
    clinicalNotes: "",
    occlusalContact: "Light contact",
    marginType: "Chamfer",
    material: "Zirconia (Multilayer)",
    specialInstructions: "",
  };
}

@Component({
  selector: "app-create-order",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AppButtonComponent,
    AppTextFieldComponent,
    AppSelectComponent,
    TeethChartComponent,
    SafeHtmlPipe,
  ],
  templateUrl: "./create-order.component.html",
  styleUrl: "./create-order.component.scss",
})
export class CreateOrderComponent {
  private readonly patientService = inject(PatientDataService);
  private readonly doctorService = inject(DoctorDataService);
  private readonly clinicService = inject(ClinicDataService);
  private readonly orderService = inject(OrderDataService);
  private readonly scanCenterService = inject(ScanCenterDataService);
  private readonly subOrderService = inject(SubOrderDataService);
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

  readonly form = signal({
    patientId: "",
    doctorId: "",
    clinicId: "",
    priority: "Normal",
    dueDate: "",
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

  readonly selectedPatient = computed(() =>
    this.patients().find((p) => p.id === this.form().patientId),
  );
  readonly patientOptions = computed(() =>
    this.patients().map((p) => ({
      value: p.id,
      label: `${p.name} · ${p.clinicName}`,
    })),
  );
  readonly selectedDoctor = computed(() =>
    this.doctors().find((d) => d.id === this.form().doctorId),
  );
  readonly doctorOptions = computed(() => {
    const clinicId = this.form().clinicId;
    const rows = clinicId
      ? this.doctors().filter((d) => d.clinicId === clinicId)
      : this.doctors();
    return rows.map((d) => ({ value: d.id, label: d.name }));
  });
  readonly selectedClinic = computed(() =>
    this.clinics().find((c) => c.id === this.form().clinicId),
  );
  readonly clinicOptions = computed(() =>
    this.clinics()
      .filter((c) => c.status === "Active")
      .map((c) => ({ value: c.id, label: c.name })),
  );
  readonly priorityOptions = ["Low", "Normal", "High", "Urgent"] as const;
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

  readonly activeClinics = computed(() =>
    this.clinics().filter((c) => c.status === "Active"),
  );

  readonly doctorsForClinic = computed(() => {
    const clinicId = this.form().clinicId;
    if (!clinicId) return this.doctors();
    return this.doctors().filter((d) => d.clinicId === clinicId);
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

  setField(key: string, value: string): void {
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  setClinicAndResetDoctor(clinicId: string): void {
    this.setField("clinicId", clinicId);
    this.setField("doctorId", "");
  }

  toggleService(id: string): void {
    this.selectedServices.update((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );

    if (!this.serviceDetails()[id]) {
      this.serviceDetails.update((prev) => ({
        ...prev,
        [id]: defaultDetail(),
      }));
    }
    if (!this.serviceForms()[id]) {
      this.serviceForms.update((prev) => ({
        ...prev,
        [id]: defaultClinicalForm(),
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
      [serviceId]: { ...(prev[serviceId] ?? defaultDetail()), [key]: value },
    }));
  }

  getServiceDetail(serviceId: string): ServiceDetail {
    return this.serviceDetails()[serviceId] ?? defaultDetail();
  }

  setServiceForm(
    serviceId: string,
    key: keyof ServiceClinicalForm,
    value: string,
  ): void {
    this.serviceForms.update((prev) => ({
      ...prev,
      [serviceId]: {
        ...(prev[serviceId] ?? defaultClinicalForm()),
        [key]: value,
      },
    }));
  }

  getServiceForm(serviceId: string): ServiceClinicalForm {
    return this.serviceForms()[serviceId] ?? defaultClinicalForm();
  }

  needsShadeArch(serviceId: string): boolean {
    return (
      serviceId === "fmb" ||
      serviceId === "final-restoration" ||
      serviceId === "temp-restoration"
    );
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
    if (step === 1)
      return (
        !!this.form().patientId &&
        !!this.form().doctorId &&
        !!this.form().clinicId
      );
    if (step === 2) return this.selectedServices().length > 0;
    return true;
  }

  validationMessage(): string {
    if (this.step() === 1)
      return "Select a patient, doctor and clinic to continue.";
    if (this.step() === 2) return "Select at least one service to continue.";
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
    const patient = this.selectedPatient();
    const doctor = this.selectedDoctor();
    const clinic = this.selectedClinic();
    if (
      !patient ||
      !doctor ||
      !clinic ||
      this.selectedServiceObjects().length === 0
    ) {
      return;
    }

    const scanCenter = this.scanCenters()[0];
    const dueDate = this.form().dueDate || this.defaultDueDate();
    const selectedServices = this.selectedServiceObjects();
    const allTeeth = this.allTeethCombined();
    const serviceRows = selectedServices.map((service) => {
      const selectedTeeth = this.serviceTeeth()[service.id]?.length
        ? [...this.serviceTeeth()[service.id]]
        : [...allTeeth];
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
        priority: this.form().priority as "Low" | "Normal" | "High" | "Urgent",
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
      patientId: patient.id,
      patientName: patient.name,
      doctorId: doctor.id,
      doctorName: doctor.name,
      clinicId: clinic.id,
      clinicName: clinic.name,
      scanCenterId: scanCenter?.id ?? "scan-local",
      scanCenterName: scanCenter?.name ?? "Local Session",
      status: "New",
      priority: this.form().priority as "Low" | "Normal" | "High" | "Urgent",
      restoration: this.mapServiceToRestoration(selectedServices[0].id),
      arch: this.deriveArchFromSelection(allTeeth),
      format: this.form().format,
      shade: this.form().shade,
      units: Math.max(allTeeth.length, 1),
      amount: Math.max(selectedServices.length * 250, 250),
      billed: false,
      billTo: clinic.name,
      vouchers: 0,
      isLocked: false,
      hasNotes: this.form().notes.trim().length > 0,
      notes: this.form().notes,
      dueDate,
      creationData: {
        services: serviceRows.map((row) => structuredClone(row.creationData)),
      },
    });

    this.subOrderService.createForOrder(createdOrder.id, serviceRows);
    this.navigationService.navigate("viewOrder", { orderId: createdOrder.id });
  }

  private defaultDueDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 7);
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

  private mapServiceToRestoration(serviceId: string): RestoType {
    if (serviceId === "surgical-guide") return "Implant Crown";
    if (serviceId === "final-restoration" || serviceId === "fmb")
      return "Bridge";
    if (serviceId === "temp-restoration") return "Crown";
    if (serviceId === "gfmr" || serviceId === "full-guide") return "Full Arch";
    return "Crown";
  }

  private deriveArchFromSelection(teeth: number[]): ArchType {
    const hasUpper = teeth.some((tooth) => tooth >= 11 && tooth <= 28);
    const hasLower = teeth.some((tooth) => tooth >= 31 && tooth <= 48);
    if (hasUpper && hasLower) return "Both";
    if (hasUpper) return "Maxilla";
    if (hasLower) return "Mandible";
    return "Both";
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
