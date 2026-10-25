import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TableModule } from "primeng/table";
import { CaseDataService } from "@core/services/case-data.service";
import { PatientDataService } from "@core/services/patient-data.service";
import { DoctorDataService } from "@core/services/doctor-data.service";
import { ClinicDataService } from "@core/services/clinic-data.service";
import { DocumentDataService } from "@core/services/document-data.service";
import { NavigationService } from "@core/services/navigation.service";
import { OrderDataService } from "@core/services/order-data.service";
import { FormatUtils } from "@core/services/format-utils.service";
import { Case, CaseStatus, Priority } from "@core/interfaces";
import { StatusBadgeComponent } from "@shared/components/status-badge/status-badge.component";
import { PriorityBadgeComponent } from "@shared/components/priority-badge/priority-badge.component";
import { AppButtonComponent } from "@shared/components/button/button.component";
import { AppTextFieldComponent } from "@shared/components/input/input.component";
import { AppSelectComponent } from "@shared/components/select/select.component";
import { EnterprisePaginatorComponent } from "@shared/components/enterprise-paginator/enterprise-paginator.component";
import { TableFeedbackComponent } from "@shared/components/table-feedback/table-feedback.component";
import { EntityDialogComponent } from "@shared/components/entity-dialog/entity-dialog.component";
import { SafeHtmlPipe } from "../../shared/pipes/safe-html.pipe";
import { getCaseDocuments, getCaseOrders } from "./case-relations";
import { getApiErrorMessage } from "@shared/utils/api-error";

type ViewMode = "table" | "grid";

@Component({
  selector: "app-cases",
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    StatusBadgeComponent,
    PriorityBadgeComponent,
    AppButtonComponent,
    AppTextFieldComponent,
    AppSelectComponent,
    EnterprisePaginatorComponent,
    TableFeedbackComponent,
    EntityDialogComponent,
    SafeHtmlPipe,
  ],
  templateUrl: "./cases.component.html",
  styleUrl: "./cases.component.scss",
})
export class CasesComponent implements OnInit {
  private readonly caseService = inject(CaseDataService);
  private readonly orderService = inject(OrderDataService);
  private readonly documentService = inject(DocumentDataService);
  private readonly patientService = inject(PatientDataService);
  private readonly doctorService = inject(DoctorDataService);
  private readonly clinicService = inject(ClinicDataService);
  protected readonly navigationService = inject(NavigationService);
  protected readonly formatUtils = inject(FormatUtils);

  readonly cases = this.caseService.cases;
  readonly loading = this.caseService.loading;

  readonly STATUS_OPTIONS: CaseStatus[] = [
    "Open",
    "In Progress",
    "Review",
    "Closed",
  ];
  readonly PRIORITY_OPTIONS: Priority[] = ["Low", "Normal", "High", "Urgent"];

  readonly view = signal<ViewMode>("table");
  readonly search = signal("");
  readonly statusFilter = signal<CaseStatus | "">("");
  readonly page = signal(1);
  readonly pageSize = 12;
  readonly showAddDialog = signal(false);
  readonly newCaseTitle = signal("");
  readonly newCasePatientId = signal("");
  readonly newCaseDoctorId = signal("");
  readonly newCaseClinicId = signal("");
  readonly newCasePriority = signal<Priority>("Normal");
  readonly newCaseNotes = signal("");
  readonly newCaseError = signal<string | null>(null);
  ngOnInit(): void {
    this.caseService.loadCases();
    this.orderService.loadOrders();
    this.documentService.loadDocuments();
    this.patientService.loadPatients();
    this.doctorService.loadDoctors();
    this.clinicService.loadClinics();
  }

  readonly patientOptions = computed(() =>
    this.patientService.patients().map((patient) => ({
      value: patient.id,
      label: patient.name,
    })),
  );
  readonly doctorOptions = computed(() =>
    this.doctorService
      .doctors()
      .filter((doctor) => {
        const patient = this.patientService
          .patients()
          .find((item) => item.id === this.newCasePatientId());
        return !patient || doctor.id === patient.doctorId;
      })
      .map((doctor) => ({ value: doctor.id, label: doctor.name })),
  );
  readonly clinicOptions = computed(() =>
    this.clinicService.clinics().map((clinic) => ({
      value: clinic.id,
      label: clinic.name,
    })),
  );

  readonly filtered = computed(() => {
    let result = [...this.cases()];
    const search = this.search();
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.patientName.toLowerCase().includes(q) ||
          c.caseNumber.toLowerCase().includes(q),
      );
    }
    if (this.statusFilter())
      result = result.filter((c) => c.status === this.statusFilter());
    return result;
  });

  readonly totalPages = computed(() =>
    Math.ceil(this.filtered().length / this.pageSize),
  );
  readonly pageData = computed(() =>
    this.filtered().slice(
      (this.page() - 1) * this.pageSize,
      this.page() * this.pageSize,
    ),
  );
  readonly caseMetrics = computed(() => {
    const orders = this.orderService.orders();
    const documents = this.documentService.documents();
    const metrics = new Map<
      string,
      { ordersCount: number; filesCount: number }
    >();

    for (const item of this.cases()) {
      const caseOrders = getCaseOrders(item, orders);
      const caseDocuments = getCaseDocuments(item, caseOrders, documents);
      metrics.set(item.id, {
        ordersCount: caseOrders.length,
        filesCount: caseDocuments.length,
      });
    }

    return metrics;
  });

  setView(mode: ViewMode): void {
    this.view.set(mode);
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.search.set(target.value);
    this.page.set(1);
  }

  onSearchValueChange(value: string): void {
    this.search.set(value);
    this.page.set(1);
  }

  onStatusFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.statusFilter.set(target.value as CaseStatus | "");
    this.page.set(1);
  }

  onStatusFilterValueChange(value: string): void {
    this.statusFilter.set(value as CaseStatus | "");
    this.page.set(1);
  }

  onPageNumberChange(pageNumber: number): void {
    this.page.set(pageNumber);
  }

  openAddCaseDialog(): void {
    const firstPatient = this.patientService.patients()[0];
    this.newCaseTitle.set("");
    this.newCasePatientId.set(firstPatient?.id ?? "");
    this.newCaseDoctorId.set(firstPatient?.doctorId ?? "");
    this.newCaseClinicId.set(firstPatient?.clinicId ?? "");
    this.newCasePriority.set("Normal");
    this.newCaseNotes.set("");
    this.newCaseError.set(null);
    this.showAddDialog.set(true);
  }

  navigateToCreateOrder(): void {
    this.openAddCaseDialog();
  }

  closeAddCaseDialog(): void {
    this.showAddDialog.set(false);
  }

  onNewCasePatientChange(patientId: string): void {
    const patient = this.patientService
      .patients()
      .find((item) => item.id === patientId);
    this.newCasePatientId.set(patientId);
    this.newCaseDoctorId.set(patient?.doctorId ?? "");
    this.newCaseClinicId.set(patient?.clinicId ?? "");
    this.newCaseError.set(null);
  }

  onNewCasePriorityChange(value: string): void {
    if (this.PRIORITY_OPTIONS.includes(value as Priority)) {
      this.newCasePriority.set(value as Priority);
    }
  }

  saveCase(): void {
    const title = this.newCaseTitle().trim();
    const patientId = this.newCasePatientId();
    const doctorId = this.newCaseDoctorId();
    const clinicId = this.newCaseClinicId();
    const errors: string[] = [];
    if (title.length < 3)
      errors.push("Enter a case title with at least 3 characters.");
    if (!patientId) errors.push("Select a patient.");
    if (!doctorId) errors.push("Select a doctor.");
    if (!clinicId) errors.push("Select a clinic.");
    if (errors.length > 0) {
      this.newCaseError.set(errors.join(" "));
      return;
    }

    const caseNumber = `CS-${Date.now().toString().slice(-8)}`;
    this.caseService
      .createCase$({
        caseNumber,
        title,
        patientId,
        doctorId,
        clinicId,
        status: "Open",
        priority: this.newCasePriority(),
        notes: this.newCaseNotes().trim(),
      })
      .subscribe({
        next: () => this.closeAddCaseDialog(),
        error: (error) => {
          console.error("Failed to create case:", error);
          this.newCaseError.set(
            getApiErrorMessage(error, "Unable to create the case."),
          );
        },
      });
  }

  navigateToCase(caseId: string): void {
    this.navigationService.navigate("caseDetails", { caseId });
  }

  getOrdersCount(caseItem: Case): number {
    return (
      this.caseMetrics().get(caseItem.id)?.ordersCount ?? caseItem.ordersCount
    );
  }

  getFilesCount(caseItem: Case): number {
    return (
      this.caseMetrics().get(caseItem.id)?.filesCount ?? caseItem.filesCount
    );
  }

  getIconSvg(name: string): string {
    const icons: Record<string, string> = {
      plus: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
      search:
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35"></path></svg>',
      list: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>',
      "grid-3x3":
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect></svg>',
      "folder-open":
        '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"></path></svg>',
    };
    return icons[name] || "";
  }
}
