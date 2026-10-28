import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { TableModule } from "primeng/table";
import { PatientDataService } from "@core/services/patient-data.service";
import { ClinicDataService } from "@core/services/clinic-data.service";
import { DoctorDataService } from "@core/services/doctor-data.service";
import { OrderDataService } from "@core/services/order-data.service";
import { NavigationService } from "@core/services/navigation.service";
import { FormatUtils } from "@core/services/format-utils.service";
import { Patient, PatientStatus } from "@core/interfaces";
import { AppButtonComponent } from "@shared/components/button/button.component";
import { AvatarComponent } from "@shared/components/avatar/avatar.component";
import { AppTextFieldComponent } from "@shared/components/input/input.component";
import { AppSelectComponent } from "@shared/components/select/select.component";
import { EntityDialogComponent } from "@shared/components/entity-dialog/entity-dialog.component";
import { EnterprisePaginatorComponent } from "@shared/components/enterprise-paginator/enterprise-paginator.component";
import { DataTableToolbarComponent } from "@shared/components/data-table-toolbar/data-table-toolbar.component";
import { SearchFilterToolbarComponent } from "@shared/components/search-filter-toolbar/search-filter-toolbar.component";
import { TableFeedbackComponent } from "@shared/components/table-feedback/table-feedback.component";
import { StatusBadgeComponent } from "@shared/components/status-badge/status-badge.component";
import { SafeHtmlPipe } from "../../shared/pipes/safe-html.pipe";
import { DisplayDatePipe } from "@shared/pipes/display-date.pipe";
import { filterTableRows } from "@shared/utils/table-state";
import {
  buildSortAriaLabel,
  sortAriaValue,
  SortAriaValue,
} from "@shared/utils/sort-a11y";
import {
  paginateTableRows,
  sortTableRows,
  tableTotalPages,
  visibleTablePages,
} from "@shared/utils/table-state";
import { getApiErrorMessage } from "@shared/utils/api-error";

@Component({
  selector: "app-patients",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    AppButtonComponent,
    AvatarComponent,
    AppTextFieldComponent,
    AppSelectComponent,
    EntityDialogComponent,
    EnterprisePaginatorComponent,
    DataTableToolbarComponent,
    SearchFilterToolbarComponent,
    TableFeedbackComponent,
    StatusBadgeComponent,
    SafeHtmlPipe,
    DisplayDatePipe,
  ],
  templateUrl: "./patients.component.html",
  styleUrl: "./patients.component.scss",
})
export class PatientsComponent implements OnInit {
  private readonly patientService = inject(PatientDataService);
  private readonly clinicService = inject(ClinicDataService);
  private readonly doctorService = inject(DoctorDataService);
  private readonly orderService = inject(OrderDataService);
  protected readonly navigationService = inject(NavigationService);
  protected readonly formatUtils = inject(FormatUtils);

  readonly patients = this.patientService.patients;
  readonly loading = this.patientService.loading;

  readonly STATUS_OPTIONS: PatientStatus[] = ["Active", "Inactive"];

  readonly search = signal("");
  readonly statusFilter = signal<PatientStatus | "">("");
  readonly page = signal(1);
  readonly sortCol = signal<keyof Patient>("name");
  readonly sortDir = signal<"asc" | "desc">("asc");
  readonly pageSize = 10;
  readonly showAddDialog = signal(false);
  readonly newName = signal("");
  readonly newEmail = signal("");
  readonly newPhone = signal("");
  readonly newClinic = signal("");
  readonly newGender = signal<"M" | "F">("F");
  readonly newPatientError = signal<string | null>(null);
  readonly clinicOptions = computed(() =>
    this.clinicService.clinics().map((clinic) => ({
      value: clinic.name,
      label: clinic.name,
    })),
  );

  ngOnInit(): void {
    this.patientService.loadPatients();
    this.clinicService.loadClinics();
    this.doctorService.loadDoctors();
    this.orderService.loadAllOrders();
  }

  readonly orderCountByPatientId = computed(() => {
    const countByPatientId = new Map<string, number>();
    for (const order of this.orderService.orders()) {
      countByPatientId.set(
        order.patientId,
        (countByPatientId.get(order.patientId) ?? 0) + 1,
      );
    }
    return countByPatientId;
  });

  readonly patientsWithOrderStats = computed<Patient[]>(() => {
    const countByPatientId = this.orderCountByPatientId();
    return this.patients().map((patient) => ({
      ...patient,
      ordersCount: countByPatientId.get(patient.id) ?? 0,
    }));
  });

  readonly filtered = computed(() => {
    let result = filterTableRows(this.patientsWithOrderStats(), this.search(), [
      (patient) => patient.name,
      (patient) => patient.email,
      (patient) => patient.clinicName,
    ]);
    if (this.statusFilter())
      result = result.filter((p) => p.status === this.statusFilter());

    return sortTableRows(result, this.sortCol(), this.sortDir());
  });

  readonly totalPages = computed(() =>
    tableTotalPages(this.filtered().length, this.pageSize),
  );
  readonly pageData = computed(() =>
    paginateTableRows(this.filtered(), this.page(), this.pageSize),
  );

  toggleSort(col: keyof Patient): void {
    if (this.sortCol() === col)
      this.sortDir.update((d) => (d === "asc" ? "desc" : "asc"));
    else {
      this.sortCol.set(col);
      this.sortDir.set("asc");
    }
  }

  sortAriaSort(col: keyof Patient): SortAriaValue {
    return sortAriaValue(this.sortCol() === col, this.sortDir());
  }

  sortAriaLabel(col: keyof Patient, label: string): string {
    return buildSortAriaLabel(label, this.sortCol() === col, this.sortDir());
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
    this.statusFilter.set(target.value as PatientStatus | "");
    this.page.set(1);
  }

  onStatusFilterValueChange(value: string): void {
    this.statusFilter.set(value as PatientStatus | "");
    this.page.set(1);
  }

  prevPage(): void {
    this.page.update((p) => Math.max(1, p - 1));
  }

  nextPage(): void {
    this.page.update((p) => Math.min(this.totalPages(), p + 1));
  }

  goToPage(pg: number): void {
    this.page.set(pg);
  }

  onPageNumberChange(pageNumber: number): void {
    this.page.set(pageNumber);
  }

  getPageNumbers(): number[] {
    return visibleTablePages(this.totalPages(), this.page());
  }

  getInitials(name: string): string {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  getGenderLabel(gender: string): string {
    return gender === "M" ? "Male" : "Female";
  }

  navigateToAddPatient(): void {
    this.newName.set("");
    this.newEmail.set("");
    this.newPhone.set("");
    this.newClinic.set(this.clinicService.clinics()[0]?.name ?? "");
    this.newGender.set("F");
    this.newPatientError.set(null);
    this.showAddDialog.set(true);
  }

  closeAddDialog(): void {
    this.showAddDialog.set(false);
  }

  savePatient(): void {
    const name = this.newName().trim();
    const email = this.newEmail().trim();
    const phone = this.newPhone().trim();
    const clinic = this.clinicService
      .clinics()
      .find((item) => item.name === this.newClinic());
    const doctor = clinic
      ? this.doctorService.doctors().find((item) => item.clinicId === clinic.id)
      : undefined;
    const errors: string[] = [];
    if (
      !/^\p{L}[\p{L}\s.'-]{1,}$/u.test(name) ||
      name.split(/\s+/).length < 2
    ) {
      errors.push("Enter the patient's first and last name.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push("Enter a valid email address.");
    }
    const phoneDigits = phone.replace(/\D/g, "");
    if (!/^[+()\d\s-]{7,20}$/.test(phone) || phoneDigits.length < 7) {
      errors.push("Enter a valid phone number.");
    }
    if (!clinic) {
      errors.push("Select an existing clinic.");
    }
    if (!doctor) {
      errors.push("The selected clinic has no assigned doctor.");
    }
    if (errors.length > 0) {
      this.newPatientError.set(errors.join(" "));
      return;
    }
    if (!clinic || !doctor) return;

    this.patientService
      .createPatient$({
        name,
        dob: new Date().toISOString().slice(0, 10),
        gender: this.newGender(),
        phone,
        email,
        clinicId: clinic.id,
        doctorId: doctor.id,
        status: "Active",
        lastVisit: new Date().toISOString().slice(0, 10),
      })
      .subscribe({
        next: () => this.showAddDialog.set(false),
        error: (error) => {
          console.error("Failed to create patient:", error);
          this.newPatientError.set(
            getApiErrorMessage(error, "Unable to create the patient."),
          );
        },
      });
  }

  getIconSvg(name: string): string {
    const icons: Record<string, string> = {
      plus: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
      search:
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35"></path></svg>',
      "chevron-left":
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>',
      "chevron-right":
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>',
      "arrow-up-down":
        '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 5 5 12"></polyline><polyline points="5 19 12 12 19 19"></polyline></svg>',
      users:
        '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
      loader:
        '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.22-8.56"/></svg>',
    };
    return icons[name] || "";
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }
}
