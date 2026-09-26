import { Component, computed, inject, signal, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute } from "@angular/router";
import { CaseDataService } from "@core/services/case-data.service";
import { DocumentDataService } from "@core/services/document-data.service";
import { OrderDataService } from "@core/services/order-data.service";
import { NavigationService } from "@core/services/navigation.service";
import { FormatUtils } from "@core/services/format-utils.service";
import { Case, LabDocument, Order } from "@core/models";
import { StatusBadgeComponent } from "@shared/components/status-badge/status-badge.component";
import { AppButtonComponent } from "@shared/components/button/button.component";
import { IconActionButtonComponent } from "@shared/components/icon-action-button/icon-action-button.component";
import { PriorityBadgeComponent } from "@shared/components/priority-badge/priority-badge.component";
import { SafeHtmlPipe } from "@shared/pipes/safe-html.pipe";
import { getCaseDocuments, getCaseOrders } from "../case-relations";

interface ActivityItem {
  user: string;
  action: string;
  time: string;
}

@Component({
  selector: "app-case-details",
  standalone: true,
  imports: [
    CommonModule,
    StatusBadgeComponent,
    PriorityBadgeComponent,
    AppButtonComponent,
    IconActionButtonComponent,
    SafeHtmlPipe,
  ],
  templateUrl: "./case-details.component.html",
  styleUrl: "./case-details.component.scss",
})
export class CaseDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly caseService = inject(CaseDataService);
  private readonly orderService = inject(OrderDataService);
  private readonly documentService = inject(DocumentDataService);
  protected readonly navigationService = inject(NavigationService);
  protected readonly formatUtils = inject(FormatUtils);

  readonly case = computed<Case | null>(() => {
    const caseId = this.caseId();
    if (!caseId) return null;
    return this.caseService.getCaseById(caseId) ?? null;
  });
  readonly caseOrders = computed<Order[]>(() => {
    const currentCase = this.case();
    if (!currentCase) return [];
    return getCaseOrders(currentCase, this.orderService.orders());
  });
  readonly caseFiles = computed<LabDocument[]>(() => {
    const currentCase = this.case();
    if (!currentCase) return [];
    return getCaseDocuments(
      currentCase,
      this.caseOrders(),
      this.documentService.documents(),
    );
  });

  readonly tabs = ["Overview", "Files", "Notes", "Activity"];
  readonly activeTab = signal<string>("Overview");
  readonly activityItems = computed<ActivityItem[]>(() => {
    const currentCase = this.case();
    if (!currentCase) return [];

    const filesCount = this.caseFiles().length;
    const filesLabel = filesCount === 1 ? "file" : "files";

    return [
      {
        user: "K. Patel",
        action: `uploaded ${filesCount} scan ${filesLabel}`,
        time: currentCase.updatedAt,
      },
      {
        user: "T. Anderson",
        action: "reviewed case details",
        time: currentCase.createdAt,
      },
      {
        user: "Jessica R.",
        action: "created case",
        time: currentCase.createdAt,
      },
    ];
  });

  private readonly caseId = signal("");

  ngOnInit(): void {
    this.caseId.set(this.route.snapshot.paramMap.get("caseId") || "");
  }

  setActiveTab(tab: string): void {
    this.activeTab.set(tab);
  }

  goBack(): void {
    this.navigationService.navigate("cases");
  }

  navigateToPatient(patientId: string): void {
    this.navigationService.navigate("patientDetails", { patientId });
  }

  navigateToDoctor(doctorId: string): void {
    this.navigationService.navigate("doctorDetails", { doctorId });
  }

  navigateToClinic(clinicId: string): void {
    this.navigationService.navigate("clinicDetails", { clinicId });
  }

  navigateToOrder(orderId: string): void {
    this.navigationService.navigate("viewOrder", { orderId });
  }

  getOrdersCount(): number {
    return this.caseOrders().length;
  }

  getFilesCount(): number {
    return this.caseFiles().length;
  }

  getStatusColors(status: string): string {
    const colors: Record<string, string> = {
      Open: "bg-blue-50 text-blue-700",
      "In Progress": "bg-amber-50 text-amber-700",
      Review: "bg-violet-50 text-violet-700",
      Closed: "bg-muted text-muted-foreground",
    };
    return colors[status] || "bg-muted text-muted-foreground";
  }

  getIconSvg(name: string): string {
    const icons: Record<string, string> = {
      "arrow-left":
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>',
      "external-link":
        '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>',
      "file-text":
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>',
    };
    return icons[name] || "";
  }
}
