import { Component, computed, inject, signal, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute } from "@angular/router";
import { PatientDataService } from "@core/services/patient-data.service";
import { OrderDataService } from "@core/services/order-data.service";
import { CaseDataService } from "@core/services/case-data.service";
import { DocumentDataService } from "@core/services/document-data.service";
import { NavigationService } from "@core/services/navigation.service";
import { FormatUtils } from "@core/services/format-utils.service";
import { Case, LabDocument, Order, Patient } from "@core/models";
import { StatusBadgeComponent } from "@shared/components/status-badge/status-badge.component";
import { AppButtonComponent } from "@shared/components/button/button.component";
import { AvatarComponent } from "@shared/components/avatar/avatar.component";
import { IconActionButtonComponent } from "@shared/components/icon-action-button/icon-action-button.component";
import { PriorityBadgeComponent } from "@shared/components/priority-badge/priority-badge.component";
import { SafeHtmlPipe } from "@shared/pipes/safe-html.pipe";
import { TableModule } from "primeng/table";

interface ContactItem {
  icon: string;
  label: string;
  value: string;
}

type PatientTab = "Overview" | "Orders" | "Cases" | "Documents" | "Activity";

interface PatientDocument extends LabDocument {
  patientName?: string;
  orderId?: string;
  orderNumber?: string;
  subOrderId?: string;
}

interface PatientActivityItem {
  kind: "order" | "case" | "document";
  title: string;
  details: string;
  at: string;
  orderId?: string;
  caseId?: string;
}

@Component({
  selector: "app-patient-details",
  standalone: true,
  imports: [
    CommonModule,
    StatusBadgeComponent,
    AppButtonComponent,
    AvatarComponent,
    IconActionButtonComponent,
    PriorityBadgeComponent,
    SafeHtmlPipe,
    TableModule,
  ],
  templateUrl: "./patient-details.component.html",
  styleUrl: "./patient-details.component.scss",
})
export class PatientDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly patientService = inject(PatientDataService);
  private readonly orderService = inject(OrderDataService);
  private readonly caseService = inject(CaseDataService);
  private readonly documentService = inject(DocumentDataService);
  protected readonly navigationService = inject(NavigationService);
  protected readonly formatUtils = inject(FormatUtils);

  readonly patient = signal<Patient | null>(null);
  readonly patientOrders = computed<Order[]>(() => {
    const patient = this.patient();
    if (!patient) return [];
    return this.orderService.getOrdersByPatient(patient.id);
  });

  readonly patientCases = computed<Case[]>(() => {
    const patient = this.patient();
    if (!patient) return [];
    return this.caseService.getCasesByPatient(patient.id);
  });

  readonly patientDocuments = computed<PatientDocument[]>(() => {
    const patient = this.patient();
    if (!patient) return [];

    const patientName = this.normalize(patient.name);
    const patientDoctor = this.normalize(patient.doctorName);
    const patientOrderIds = new Set(
      this.patientOrders().map((order) => order.id),
    );

    return (this.documentService.documents() as PatientDocument[])
      .filter((doc) => {
        const byPatientName = this.normalize(doc.patientName) === patientName;
        const byOrder = !!doc.orderId && patientOrderIds.has(doc.orderId);
        const byDoctor = this.normalize(doc.doctor) === patientDoctor;
        return byPatientName || byOrder || byDoctor;
      })
      .sort((a, b) => this.toTimestamp(b.date) - this.toTimestamp(a.date));
  });

  readonly patientActivity = computed<PatientActivityItem[]>(() => {
    const orderEvents = this.patientOrders().map((order) => ({
      kind: "order" as const,
      title: `Order ${order.orderNumber}`,
      details: `${order.status} - ${order.restoration}`,
      at: order.updatedAt,
      orderId: order.id,
    }));

    const caseEvents = this.patientCases().map((c) => ({
      kind: "case" as const,
      title: `Case ${c.caseNumber}`,
      details: `${c.status} - ${c.title}`,
      at: c.updatedAt,
      caseId: c.id,
    }));

    const documentEvents = this.patientDocuments().map((doc) => ({
      kind: "document" as const,
      title: doc.name,
      details: `${doc.category} - ${doc.type} - ${doc.size}`,
      at: doc.date,
      orderId: doc.orderId,
    }));

    return [...orderEvents, ...caseEvents, ...documentEvents]
      .sort((a, b) => this.toTimestamp(b.at) - this.toTimestamp(a.at))
      .slice(0, 20);
  });

  readonly tabs: readonly PatientTab[] = [
    "Overview",
    "Orders",
    "Cases",
    "Documents",
    "Activity",
  ];
  readonly activeTab = signal<PatientTab>("Overview");

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

      this.contactItems.set([
        { icon: "mail", label: "Email", value: patient.email },
        { icon: "phone", label: "Phone", value: patient.phone },
        { icon: "building-2", label: "Clinic", value: patient.clinicName },
        { icon: "user", label: "Doctor", value: patient.doctorName },
      ]);
    }
  }

  private normalize(value: string | null | undefined): string {
    return (value ?? "").trim().toLowerCase();
  }

  private toTimestamp(dateValue: string): number {
    const timestamp = Date.parse(dateValue);
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  setActiveTab(tab: PatientTab): void {
    this.activeTab.set(tab);
  }

  getTabCount(tab: PatientTab): number {
    switch (tab) {
      case "Orders":
        return this.patientOrders().length;
      case "Cases":
        return this.patientCases().length;
      case "Documents":
        return this.patientDocuments().length;
      case "Activity":
        return this.patientActivity().length;
      default:
        return 0;
    }
  }

  goBack(): void {
    this.navigationService.navigate("patients");
  }

  navigateToOrdersPage(): void {
    this.navigationService.navigate("orders");
  }

  navigateToCasesPage(): void {
    this.navigationService.navigate("cases");
  }

  navigateToDocumentsPage(): void {
    this.navigationService.navigate("documents");
  }

  navigateToOrder(orderId: string): void {
    this.navigationService.navigate("viewOrder", { orderId });
  }

  navigateToCase(caseId: string): void {
    this.navigationService.navigate("caseDetails", { caseId });
  }

  navigateToDoctor(): void {
    const patient = this.patient();
    if (!patient?.doctorId) return;
    this.navigationService.navigate("doctorDetails", {
      doctorId: patient.doctorId,
    });
  }

  navigateToClinic(): void {
    const patient = this.patient();
    if (!patient?.clinicId) return;
    this.navigationService.navigate("clinicDetails", {
      clinicId: patient.clinicId,
    });
  }

  openDocumentContext(document: PatientDocument): void {
    if (document.orderId) {
      this.navigationService.navigate("viewOrder", {
        orderId: document.orderId,
      });
      return;
    }
    this.navigateToDocumentsPage();
  }

  openActivityItem(item: PatientActivityItem): void {
    if (item.kind === "order" && item.orderId) {
      this.navigateToOrder(item.orderId);
      return;
    }
    if (item.kind === "case" && item.caseId) {
      this.navigateToCase(item.caseId);
      return;
    }
    this.navigateToDocumentsPage();
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
      "plus-circle":
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"></circle><path d="M12 8v8"></path><path d="M8 12h8"></path></svg>',
      "file-text":
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>',
      activity:
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>',
      folder:
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z"></path></svg>',
      package:
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.29 7 12 12 20.71 7"></polyline><line x1="12" y1="22" x2="12" y2="12"></line></svg>',
      "folder-open":
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6h5l2 2h5a2 2 0 0 1 2 2v1"></path><path d="M3 10h18l-2 8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>',
    };
    return icons[name] || "";
  }
}
