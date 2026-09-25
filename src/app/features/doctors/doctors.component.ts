import { Component, computed, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { DoctorDataService } from "@core/services/doctor-data.service";
import { NavigationService } from "@core/services/navigation.service";
import { FormatUtils } from "@core/services/format-utils.service";
import { Doctor, DoctorStatus } from "@core/models";
import { ButtonComponent } from "@shared/components/button/button.component";
import { AvatarComponent } from "@shared/components/avatar/avatar.component";
import { InputComponent } from "@shared/components/input/input.component";
import { SelectComponent } from "@shared/components/select/select.component";
import { EntityDialogComponent } from "@shared/components/entity-dialog/entity-dialog.component";
import { DataTableToolbarComponent } from "@shared/components/data-table-toolbar/data-table-toolbar.component";
import { SearchFilterToolbarComponent } from "@shared/components/search-filter-toolbar/search-filter-toolbar.component";
import { TableFeedbackComponent } from "@shared/components/table-feedback/table-feedback.component";
import { SafeHtmlPipe } from "@shared/pipes/safe-html.pipe";
import { filterTableRows, sortTableRows } from "@shared/utils/table-state";

interface SortConfig {
  label: string;
  col: keyof Doctor;
}

@Component({
  selector: "app-doctors",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    AvatarComponent,
    InputComponent,
    SelectComponent,
    EntityDialogComponent,
    DataTableToolbarComponent,
    SearchFilterToolbarComponent,
    TableFeedbackComponent,
    SafeHtmlPipe,
  ],
  templateUrl: "./doctors.component.html",
  styleUrl: "./doctors.component.scss",
})
export class DoctorsComponent {
  private readonly doctorService = inject(DoctorDataService);
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
  readonly newClinic = signal("Bright Smile Dental");
  readonly newEmail = signal("");
  readonly newPhone = signal("");

  readonly filtered = computed(() => {
    let result = filterTableRows(this.doctors(), this.search(), [
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

  getStatusClass(status: string): string {
    return status === "Active"
      ? "enterprise-status-active"
      : "enterprise-status-inactive";
  }

  openAddDialog(): void {
    this.newName.set("");
    this.newSpecialty.set("General Dentistry");
    this.newClinic.set("Bright Smile Dental");
    this.newEmail.set("");
    this.newPhone.set("");
    this.showAddDialog.set(true);
  }

  closeAddDialog(): void {
    this.showAddDialog.set(false);
  }

  saveDoctor(): void {
    const name = this.newName().trim() || "New Doctor";
    const initials =
      name
        .replace(/^Dr\.\s*/, "")
        .split(" ")
        .map((p) => p[0] ?? "")
        .join("")
        .slice(0, 2)
        .toUpperCase() || "ND";
    this.doctorService.addDoctor({
      id: `dr-${Date.now()}`,
      name: name.startsWith("Dr.") ? name : `Dr. ${name}`,
      specialty: this.newSpecialty(),
      clinicId: "cl1",
      clinicName: this.newClinic(),
      email: this.newEmail().trim() || "doctor@clinic.com",
      phone: this.newPhone().trim() || "+1 (555) 000-0000",
      status: "Active",
      ordersCount: 0,
      joinedDate: new Date().toISOString().slice(0, 10),
      avatar: initials,
    });
    this.showAddDialog.set(false);
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
