import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { TableModule } from "primeng/table";
import { DoctorDataService } from "@core/services/doctor-data.service";
import { ClinicDataService } from "@core/services/clinic-data.service";
import { OrderDataService } from "@core/services/order-data.service";
import { NavigationService } from "@core/services/navigation.service";
import { FormatUtils } from "@core/services/format-utils.service";
import { Doctor, DoctorStatus } from "@core/interfaces";
import { SortConfig } from "@core/interfaces";
import { AppButtonComponent } from "@shared/components/button/button.component";
import { AvatarComponent } from "@shared/components/avatar/avatar.component";
import { AppTextFieldComponent } from "@shared/components/input/input.component";
import { AppSelectComponent } from "@shared/components/select/select.component";
import { EntityDialogComponent } from "@shared/components/entity-dialog/entity-dialog.component";
import { DataTableToolbarComponent } from "@shared/components/data-table-toolbar/data-table-toolbar.component";
import { SearchFilterToolbarComponent } from "@shared/components/search-filter-toolbar/search-filter-toolbar.component";
import { TableFeedbackComponent } from "@shared/components/table-feedback/table-feedback.component";
import { StatusBadgeComponent } from "@shared/components/status-badge/status-badge.component";
import { SafeHtmlPipe } from "@shared/pipes/safe-html.pipe";
import { DisplayDatePipe } from "@shared/pipes/display-date.pipe";
import { filterTableRows, sortTableRows } from "@shared/utils/table-state";
import { getApiErrorMessage } from "@shared/utils/api-error";
import {
  buildSortAriaLabel,
  sortAriaValue,
  SortAriaValue,
} from "@shared/utils/sort-a11y";

@Component({
  selector: "app-doctors",
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
    DataTableToolbarComponent,
    SearchFilterToolbarComponent,
    TableFeedbackComponent,
    StatusBadgeComponent,
    SafeHtmlPipe,
    DisplayDatePipe,
  ],
  templateUrl: "./doctors.component.html",
  styleUrl: "./doctors.component.scss",
})
export class DoctorsComponent implements OnInit {
  private readonly doctorService = inject(DoctorDataService);
  private readonly clinicService = inject(ClinicDataService);
  private readonly orderService = inject(OrderDataService);
  protected readonly navigationService = inject(NavigationService);
  protected readonly formatUtils = inject(FormatUtils);

  readonly doctors = this.doctorService.doctors;
  readonly loading = this.doctorService.loading;

  readonly STATUS_OPTIONS: DoctorStatus[] = ["Active", "Inactive"];

  readonly search = signal("");
  readonly statusFilter = signal<DoctorStatus | "">("");
  readonly sortCol = signal<keyof Doctor>("name");
  readonly sortDir = signal<"asc" | "desc">("asc");
  readonly showAddDialog = signal(false);
  readonly newName = signal("");
  readonly newSpecialty = signal("General Dentistry");
  readonly newClinic = signal("");
  readonly newEmail = signal("");
  readonly newGender = signal<"M" | "F">("M");
  readonly newDoctorError = signal<string | null>(null);
  readonly clinicOptions = computed(() =>
    this.clinicService.clinics().map((clinic) => ({
      value: clinic.name,
      label: clinic.name,
    })),
  );

  ngOnInit(): void {
    this.doctorService.loadDoctors();
    this.clinicService.loadClinics();
    this.orderService.loadOrders();
  }
  readonly newPhone = signal("");

  readonly orderCountByDoctorId = computed(() => {
    const countByDoctorId = new Map<string, number>();
    for (const order of this.orderService.orders()) {
      countByDoctorId.set(
        order.doctorId,
        (countByDoctorId.get(order.doctorId) ?? 0) + 1,
      );
    }
    return countByDoctorId;
  });

  readonly doctorsWithOrderStats = computed<Doctor[]>(() => {
    const countByDoctorId = this.orderCountByDoctorId();
    return this.doctors().map((doctor) => ({
      ...doctor,
      ordersCount: countByDoctorId.get(doctor.id) ?? 0,
    }));
  });

  readonly filtered = computed(() => {
    let result = filterTableRows(this.doctorsWithOrderStats(), this.search(), [
      (doctor) => doctor.name,
      (doctor) => doctor.specialty,
      (doctor) => doctor.clinicName,
    ]);
    if (this.statusFilter())
      result = result.filter((d) => d.status === this.statusFilter());

    return sortTableRows(result, this.sortCol(), this.sortDir());
  });

  readonly sortConfigs: SortConfig[] = [
    { label: "Name", col: "name" },
    { label: "Specialty", col: "specialty" },
    { label: "Clinic", col: "clinicName" },
    { label: "Email", col: "email" },
    { label: "Phone", col: "phone" },
    { label: "Orders", col: "ordersCount" },
    { label: "Joined", col: "joinedDate" },
    { label: "Status", col: "status" },
  ];

  toggleSort(col: keyof Doctor): void {
    if (this.sortCol() === col)
      this.sortDir.update((d) => (d === "asc" ? "desc" : "asc"));
    else {
      this.sortCol.set(col);
      this.sortDir.set("asc");
    }
  }

  sortAriaSort(col: keyof Doctor): SortAriaValue {
    return sortAriaValue(this.sortCol() === col, this.sortDir());
  }

  sortAriaLabel(col: keyof Doctor, label: string): string {
    return buildSortAriaLabel(label, this.sortCol() === col, this.sortDir());
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.search.set(target.value);
  }

  onSearchValueChange(value: string): void {
    this.search.set(value);
  }

  onStatusFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.statusFilter.set(target.value as DoctorStatus | "");
  }

  onStatusFilterValueChange(value: string): void {
    this.statusFilter.set(value as DoctorStatus | "");
  }

  openAddDialog(): void {
    this.newName.set("");
    this.newSpecialty.set("General Dentistry");
    this.newClinic.set(this.clinicService.clinics()[0]?.name ?? "");
    this.newEmail.set("");
    this.newPhone.set("");
    this.newGender.set("M");
    this.newDoctorError.set(null);
    this.showAddDialog.set(true);
  }

  closeAddDialog(): void {
    this.showAddDialog.set(false);
  }

  saveDoctor(): void {
    const name = this.newName().trim();
    const specialty = this.newSpecialty().trim();
    const email = this.newEmail().trim();
    const phone = this.newPhone().trim();
    const clinic = this.clinicService
      .clinics()
      .find((item) => item.name === this.newClinic());
    const errors: string[] = [];
    if (
      !/^\p{L}[\p{L}\s.'-]{1,}$/u.test(name) ||
      name.split(/\s+/).length < 2
    ) {
      errors.push("Enter the doctor's first and last name.");
    }
    if (!specialty) {
      errors.push("Select a specialty.");
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
    if (errors.length > 0) {
      this.newDoctorError.set(errors.join(" "));
      return;
    }
    if (!clinic) return;
    const initials =
      name
        .replace(/^Dr\.\s*/, "")
        .split(" ")
        .map((p) => p[0] ?? "")
        .join("")
        .slice(0, 2)
        .toUpperCase() || "ND";
    this.doctorService
      .createDoctor$({
        name: name.startsWith("Dr.") ? name : `Dr. ${name}`,
        gender: this.newGender(),
        specialty,
        clinicId: clinic.id,
        email,
        phone,
        status: "Active",
        joinedDate: new Date().toISOString().slice(0, 10),
        avatar: initials,
      })
      .subscribe({
        next: () => this.showAddDialog.set(false),
        error: (error) => {
          console.error("Failed to create doctor:", error);
          this.newDoctorError.set(
            getApiErrorMessage(error, "Unable to create the doctor."),
          );
        },
      });
  }

  doctorDisplayId(doctor: Doctor): string {
    return doctor.lookupId ?? doctor.id;
  }

  getIconSvg(name: string): string {
    const icons: Record<string, string> = {
      plus: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
      search:
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35"></path></svg>',
      "arrow-up-down":
        '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 5 5 12"></polyline><polyline points="5 19 12 12 19 19"></polyline></svg>',
      "user-cog":
        '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="18" r="3"></circle><circle cx="9" cy="7" r="4"></circle><path d="M10 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path></svg>',
      loader:
        '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.22-8.56"/></svg>',
    };
    return icons[name] || "";
  }
}
