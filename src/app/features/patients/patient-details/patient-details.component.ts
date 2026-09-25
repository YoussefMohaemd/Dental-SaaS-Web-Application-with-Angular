import { Component, computed, inject, signal, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute } from "@angular/router";
import { PatientDataService } from "@core/services/patient-data.service";
import { OrderDataService } from "@core/services/order-data.service";
import { NavigationService } from "@core/services/navigation.service";
import { FormatUtils } from "@core/services/format-utils.service";
import { Patient, Order } from "@core/models";
import { StatusBadgeComponent } from "@shared/components/status-badge/status-badge.component";
import { ButtonComponent } from "@shared/components/button/button.component";
import { AvatarComponent } from "@shared/components/avatar/avatar.component";
import { SafeHtmlPipe } from "@shared/pipes/safe-html.pipe";

interface ContactItem {
  icon: string;
  label: string;
  value: string;
}

@Component({
  selector: "app-patient-details",
  standalone: true,
  imports: [
    CommonModule,
    StatusBadgeComponent,
    ButtonComponent,
    AvatarComponent,
    SafeHtmlPipe,
  ],
  templateUrl: "./patient-details.component.html",
  styleUrl: "./patient-details.component.scss",
})
export class PatientDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly patientService = inject(PatientDataService);
  private readonly orderService = inject(OrderDataService);
  protected readonly navigationService = inject(NavigationService);
  protected readonly formatUtils = inject(FormatUtils);

  readonly patient = signal<Patient | null>(null);
  readonly patientOrders = signal<Order[]>([]);

  readonly tabs = ["Overview", "Orders", "Cases", "Documents", "Activity"];
  readonly activeTab = signal<string>("Overview");

  readonly contactItems = signal<ContactItem[]>([]);

  private patientId = "";

  ngOnInit(): void {
    this.patientId = this.route.snapshot.paramMap.get("patientId") || "";
    this.loadPatient();
  }

  private loadPatient(): void {
    const patient = this.patientService.getPatientById(this.patientId);
    if (patient) {
      this.patient.set(patient);
      const orders = this.orderService.getOrdersByPatient(patient.id);
      this.patientOrders.set(orders);

      this.contactItems.set([
        { icon: "mail", label: "Email", value: patient.email },
        { icon: "phone", label: "Phone", value: patient.phone },
        { icon: "building-2", label: "Clinic", value: patient.clinicName },
        { icon: "user", label: "Doctor", value: patient.doctorName },
      ]);
    }
  }

  setActiveTab(tab: string): void {
    this.activeTab.set(tab);
  }

  goBack(): void {
    this.navigationService.navigate("patients");
  }

  getGenderLabel(gender: string): string {
    return gender === "M" ? "Male" : "Female";
  }

  getStatusClass(status: string): string {
    return status === "Active"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-muted text-muted-foreground";
  }

  getIconSvg(name: string): string {
    const icons: Record<string, string> = {
      "arrow-left":
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>',
      mail: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>',
      phone:
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>',
      "building-2":
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18"></path><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"></path><path d="M18 9v11a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-9"></path><path d="M10 6h4"></path><path d="M10 10h4"></path><path d="M10 14h4"></path></svg>',
      user: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
      "clipboard-list":
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>',
    };
    return icons[name] || "";
  }
}
