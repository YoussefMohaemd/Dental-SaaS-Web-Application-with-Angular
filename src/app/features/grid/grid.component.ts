import { CommonModule } from "@angular/common";
import { Component, computed, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TableModule } from "primeng/table";
import { ButtonComponent } from "@shared/components/button/button.component";
import { SearchInputComponent } from "@shared/components/search-input/search-input.component";
import { SelectComponent } from "@shared/components/select/select.component";
import { StatusBadgeComponent } from "@shared/components/status-badge/status-badge.component";
import { PriorityBadgeComponent } from "@shared/components/priority-badge/priority-badge.component";
import { LoadingStateComponent } from "@shared/components/loading-state/loading-state.component";
import { EmptyStateComponent } from "@shared/components/empty-state/empty-state.component";
import { filterTableRows } from "@shared/utils/table-state";

type WorkflowStatus = "New" | "Review" | "Design" | "Production" | "Done";
type WorkflowPriority = "Low" | "Normal" | "High" | "Urgent";

interface OrderGridRow {
  id: string;
  orderNumber: string;
  patient: string;
  patientId: string;
  doctor: string;
  service: string;
  stage: WorkflowStatus;
  createdDate: string;
  dueDate: string;
}

interface PatientGridRow {
  id: string;
  patient: string;
  patientId: string;
  doctor: string;
  age: number;
  lastVisit: string;
  status: "Active" | "Follow-up" | "On Hold";
}

interface ServiceGridRow {
  id: string;
  serviceName: string;
  category: string;
  orders: number;
  status: "Active" | "Under Review" | "Paused";
  updated: string;
}

interface WorkflowGridRow {
  id: string;
  orderNumber: string;
  patient: string;
  assignedTo: string;
  currentStage: WorkflowStatus;
  priority: WorkflowPriority;
  dueDate: string;
  status: "On Track" | "Attention" | "Blocked";
  subOrders: readonly {
    id: string;
    service: string;
    forms: string;
    status: "Done" | "In Progress" | "Pending";
    eta: string;
  }[];
}

interface ServiceShowcaseCard {
  id: string;
  serviceName: string;
  category: string;
  openOrders: number;
  completedToday: number;
  utilization: string;
  owner: string;
  status: "Healthy" | "Needs Review" | "Blocked";
}

interface PatientSnapshot {
  id: string;
  patient: string;
  patientId: string;
  doctor: string;
  stage: WorkflowStatus;
  nextStep: string;
  dueDate: string;
}

@Component({
  selector: "app-grid",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonComponent,
    SearchInputComponent,
    SelectComponent,
    StatusBadgeComponent,
    PriorityBadgeComponent,
    LoadingStateComponent,
    EmptyStateComponent,
  ],
  templateUrl: "./grid.component.html",
  styleUrl: "./grid.component.scss",
})
export class GridComponent {
  readonly orders: OrderGridRow[] = [
    {
      id: "ord-1",
      orderNumber: "ORD-2026-1042",
      patient: "Sarah Thompson",
      patientId: "PT-1048",
      doctor: "Dr. Allison Park",
      service: "Surgical Guide",
      stage: "New",
      createdDate: "2026-09-02",
      dueDate: "2026-09-10",
    },
    {
      id: "ord-2",
      orderNumber: "ORD-2026-1039",
      patient: "Marcus Lee",
      patientId: "PT-1037",
      doctor: "Dr. Kareem Hassan",
      service: "Full Arch Restoration",
      stage: "Review",
      createdDate: "2026-09-01",
      dueDate: "2026-09-11",
    },
    {
      id: "ord-3",
      orderNumber: "ORD-2026-1035",
      patient: "Emily Carter",
      patientId: "PT-1029",
      doctor: "Dr. Priya Nair",
      service: "Implant Crown",
      stage: "Design",
      createdDate: "2026-08-30",
      dueDate: "2026-09-08",
    },
    {
      id: "ord-4",
      orderNumber: "ORD-2026-1028",
      patient: "Noah Williams",
      patientId: "PT-1018",
      doctor: "Dr. Omar Saleh",
      service: "Night Guard",
      stage: "Production",
      createdDate: "2026-08-28",
      dueDate: "2026-09-06",
    },
    {
      id: "ord-5",
      orderNumber: "ORD-2026-1023",
      patient: "Sophia Garcia",
      patientId: "PT-1004",
      doctor: "Dr. Allison Park",
      service: "Veneer Set",
      stage: "Done",
      createdDate: "2026-08-25",
      dueDate: "2026-09-03",
    },
    {
      id: "ord-6",
      orderNumber: "ORD-2026-1019",
      patient: "Daniel Kim",
      patientId: "PT-0992",
      doctor: "Dr. Layla Mansour",
      service: "Bridge 3-Unit",
      stage: "Review",
      createdDate: "2026-08-24",
      dueDate: "2026-09-04",
    },
    {
      id: "ord-7",
      orderNumber: "ORD-2026-1016",
      patient: "Amelia Brown",
      patientId: "PT-0981",
      doctor: "Dr. Kareem Hassan",
      service: "Shade Match",
      stage: "New",
      createdDate: "2026-08-22",
      dueDate: "2026-09-01",
    },
    {
      id: "ord-8",
      orderNumber: "ORD-2026-1011",
      patient: "Liam Johnson",
      patientId: "PT-0977",
      doctor: "Dr. Priya Nair",
      service: "Diagnostic Wax-up",
      stage: "Production",
      createdDate: "2026-08-19",
      dueDate: "2026-08-30",
    },
    {
      id: "ord-9",
      orderNumber: "ORD-2026-1007",
      patient: "Olivia Martin",
      patientId: "PT-0968",
      doctor: "Dr. Omar Saleh",
      service: "Abutment Design",
      stage: "Design",
      createdDate: "2026-08-16",
      dueDate: "2026-08-27",
    },
    {
      id: "ord-10",
      orderNumber: "ORD-2026-1002",
      patient: "Ethan Clark",
      patientId: "PT-0953",
      doctor: "Dr. Layla Mansour",
      service: "Occlusal Splint",
      stage: "Done",
      createdDate: "2026-08-13",
      dueDate: "2026-08-24",
    },
  ];

  readonly patients: PatientGridRow[] = [
    {
      id: "pt-1",
      patient: "Sarah Thompson",
      patientId: "PT-1048",
      doctor: "Dr. Allison Park",
      age: 42,
      lastVisit: "2026-08-31",
      status: "Active",
    },
    {
      id: "pt-2",
      patient: "Marcus Lee",
      patientId: "PT-1037",
      doctor: "Dr. Kareem Hassan",
      age: 37,
      lastVisit: "2026-08-25",
      status: "Follow-up",
    },
    {
      id: "pt-3",
      patient: "Emily Carter",
      patientId: "PT-1029",
      doctor: "Dr. Priya Nair",
      age: 51,
      lastVisit: "2026-08-20",
      status: "Active",
    },
    {
      id: "pt-4",
      patient: "Noah Williams",
      patientId: "PT-1018",
      doctor: "Dr. Omar Saleh",
      age: 29,
      lastVisit: "2026-08-17",
      status: "On Hold",
    },
    {
      id: "pt-5",
      patient: "Sophia Garcia",
      patientId: "PT-1004",
      doctor: "Dr. Allison Park",
      age: 45,
      lastVisit: "2026-08-15",
      status: "Follow-up",
    },
    {
      id: "pt-6",
      patient: "Daniel Kim",
      patientId: "PT-0992",
      doctor: "Dr. Layla Mansour",
      age: 63,
      lastVisit: "2026-08-10",
      status: "Active",
    },
    {
      id: "pt-7",
      patient: "Amelia Brown",
      patientId: "PT-0981",
      doctor: "Dr. Kareem Hassan",
      age: 34,
      lastVisit: "2026-08-08",
      status: "Active",
    },
    {
      id: "pt-8",
      patient: "Liam Johnson",
      patientId: "PT-0977",
      doctor: "Dr. Priya Nair",
      age: 56,
      lastVisit: "2026-08-02",
      status: "On Hold",
    },
  ];

  readonly services: ServiceGridRow[] = [
    {
      id: "svc-1",
      serviceName: "Surgical Guide",
      category: "Implant",
      orders: 84,
      status: "Active",
      updated: "2026-09-03",
    },
    {
      id: "svc-2",
      serviceName: "Temporary Crown",
      category: "Restorative",
      orders: 56,
      status: "Active",
      updated: "2026-09-02",
    },
    {
      id: "svc-3",
      serviceName: "Full Arch PMMA",
      category: "Prosthetic",
      orders: 31,
      status: "Under Review",
      updated: "2026-08-29",
    },
    {
      id: "svc-4",
      serviceName: "Diagnostic Wax-up",
      category: "Planning",
      orders: 22,
      status: "Active",
      updated: "2026-08-28",
    },
    {
      id: "svc-5",
      serviceName: "Custom Abutment",
      category: "Implant",
      orders: 17,
      status: "Paused",
      updated: "2026-08-25",
    },
    {
      id: "svc-6",
      serviceName: "Shade Analysis",
      category: "Aesthetic",
      orders: 38,
      status: "Active",
      updated: "2026-08-24",
    },
  ];

  readonly workflowRows: WorkflowGridRow[] = [
    {
      id: "wf-1",
      orderNumber: "ORD-2026-1042",
      patient: "Sarah Thompson",
      assignedTo: "M. Alvarez",
      currentStage: "Review",
      priority: "Urgent",
      dueDate: "2026-09-10",
      status: "Attention",
      subOrders: [
        {
          id: "sub-1",
          service: "Surgical Guide",
          forms: "3/3",
          status: "Done",
          eta: "2026-09-06",
        },
        {
          id: "sub-2",
          service: "Final Restoration",
          forms: "1/3",
          status: "In Progress",
          eta: "2026-09-09",
        },
      ],
    },
    {
      id: "wf-2",
      orderNumber: "ORD-2026-1035",
      patient: "Emily Carter",
      assignedTo: "R. Ahmed",
      currentStage: "Design",
      priority: "High",
      dueDate: "2026-09-08",
      status: "On Track",
      subOrders: [
        {
          id: "sub-3",
          service: "Implant Crown",
          forms: "2/2",
          status: "Done",
          eta: "2026-09-05",
        },
        {
          id: "sub-4",
          service: "Shade Match",
          forms: "1/1",
          status: "Done",
          eta: "2026-09-05",
        },
      ],
    },
    {
      id: "wf-3",
      orderNumber: "ORD-2026-1019",
      patient: "Daniel Kim",
      assignedTo: "L. Bennett",
      currentStage: "Production",
      priority: "Normal",
      dueDate: "2026-09-04",
      status: "Blocked",
      subOrders: [
        {
          id: "sub-5",
          service: "Bridge 3-Unit",
          forms: "2/3",
          status: "In Progress",
          eta: "2026-09-03",
        },
        {
          id: "sub-6",
          service: "QC Checklist",
          forms: "0/1",
          status: "Pending",
          eta: "2026-09-04",
        },
      ],
    },
    {
      id: "wf-4",
      orderNumber: "ORD-2026-1011",
      patient: "Liam Johnson",
      assignedTo: "S. Grant",
      currentStage: "Done",
      priority: "Low",
      dueDate: "2026-08-30",
      status: "On Track",
      subOrders: [
        {
          id: "sub-7",
          service: "Diagnostic Wax-up",
          forms: "2/2",
          status: "Done",
          eta: "2026-08-28",
        },
      ],
    },
  ];

  readonly responsiveOrders = this.orders.slice(0, 4);

  readonly serviceShowcaseCards: readonly ServiceShowcaseCard[] = [
    {
      id: "card-1",
      serviceName: "Surgical Guide",
      category: "Implant",
      openOrders: 18,
      completedToday: 6,
      utilization: "82%",
      owner: "A. Vega",
      status: "Healthy",
    },
    {
      id: "card-2",
      serviceName: "Full Arch PMMA",
      category: "Prosthetic",
      openOrders: 9,
      completedToday: 2,
      utilization: "94%",
      owner: "R. Ahmed",
      status: "Needs Review",
    },
    {
      id: "card-3",
      serviceName: "Custom Abutment",
      category: "Implant",
      openOrders: 7,
      completedToday: 1,
      utilization: "96%",
      owner: "L. Bennett",
      status: "Blocked",
    },
    {
      id: "card-4",
      serviceName: "Shade Analysis",
      category: "Aesthetic",
      openOrders: 11,
      completedToday: 4,
      utilization: "74%",
      owner: "M. Alvarez",
      status: "Healthy",
    },
  ];

  readonly patientSnapshots: readonly PatientSnapshot[] = [
    {
      id: "snap-1",
      patient: "Sarah Thompson",
      patientId: "PT-1048",
      doctor: "Dr. Allison Park",
      stage: "Review",
      nextStep: "Confirm occlusal map",
      dueDate: "2026-09-10",
    },
    {
      id: "snap-2",
      patient: "Marcus Lee",
      patientId: "PT-1037",
      doctor: "Dr. Kareem Hassan",
      stage: "Design",
      nextStep: "Approve bridge contour",
      dueDate: "2026-09-11",
    },
    {
      id: "snap-3",
      patient: "Emily Carter",
      patientId: "PT-1029",
      doctor: "Dr. Priya Nair",
      stage: "Production",
      nextStep: "Finalize milling batch",
      dueDate: "2026-09-08",
    },
    {
      id: "snap-4",
      patient: "Noah Williams",
      patientId: "PT-1018",
      doctor: "Dr. Omar Saleh",
      stage: "New",
      nextStep: "Validate uploaded scans",
      dueDate: "2026-09-06",
    },
  ];

  readonly workflowBoardColumns = computed(() => {
    const stages: WorkflowStatus[] = [
      "New",
      "Review",
      "Design",
      "Production",
      "Done",
    ];
    return stages.map((stage) => ({
      stage,
      items: this.orders
        .filter((order) => order.stage === stage)
        .slice(0, 3)
        .map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          patient: order.patient,
          service: order.service,
          dueDate: order.dueDate,
        })),
    }));
  });

  readonly patientSearch = signal("");
  readonly patientStatusFilter = signal<"All" | PatientGridRow["status"]>(
    "All",
  );
  readonly visitWindowFilter = signal<"All" | "Last 7 Days" | "Last 30 Days">(
    "All",
  );

  selectedServiceRows: ServiceGridRow[] = [];

  readonly showLoadingExample = signal(false);
  readonly compactStageFilter = signal<"All" | WorkflowStatus>("All");

  readonly patientStatusOptions: readonly string[] = [
    "All",
    "Active",
    "Follow-up",
    "On Hold",
  ];
  readonly visitWindowOptions: readonly string[] = [
    "All",
    "Last 7 Days",
    "Last 30 Days",
  ];
  readonly stageOptions: readonly string[] = [
    "All",
    "New",
    "Review",
    "Design",
    "Production",
    "Done",
  ];

  readonly filteredPatients = computed(() => {
    const searched = filterTableRows(this.patients, this.patientSearch(), [
      (row) => row.patient,
      (row) => row.patientId,
      (row) => row.doctor,
    ]);

    return searched.filter((row) => {
      const matchesStatus =
        this.patientStatusFilter() === "All" ||
        row.status === this.patientStatusFilter();
      const matchesVisitWindow = this.matchesVisitWindow(
        row.lastVisit,
        this.visitWindowFilter(),
      );
      return matchesStatus && matchesVisitWindow;
    });
  });

  readonly filteredCompactRows = computed(() => {
    const selected = this.compactStageFilter();
    if (selected === "All") return this.orders;
    return this.orders.filter((row) => row.stage === selected);
  });

  readonly activeServices = computed(
    () => this.services.filter((row) => row.status === "Active").length,
  );

  readonly statusShowcaseRows = computed(() =>
    this.orders.map((order) => ({
      ...order,
      statusLabel: this.statusLabel(order.stage),
    })),
  );

  openPatientProfile(_patientId: string): void {}

  setCompactStageFilter(value: string): void {
    this.compactStageFilter.set(value as "All" | WorkflowStatus);
  }

  setPatientStatusFilter(value: string): void {
    this.patientStatusFilter.set(value as "All" | PatientGridRow["status"]);
  }

  setVisitWindowFilter(value: string): void {
    this.visitWindowFilter.set(value as "All" | "Last 7 Days" | "Last 30 Days");
  }

  toggleLoadingExample(): void {
    if (this.showLoadingExample()) {
      this.showLoadingExample.set(false);
      return;
    }

    this.showLoadingExample.set(true);
    setTimeout(() => this.showLoadingExample.set(false), 1200);
  }

  patientStatusClass(status: PatientGridRow["status"]): string {
    if (status === "Active")
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300";
    if (status === "Follow-up")
      return "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300";
    return "bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300";
  }

  serviceStatusClass(status: ServiceGridRow["status"]): string {
    if (status === "Active")
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300";
    if (status === "Under Review")
      return "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300";
    return "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300";
  }

  workflowStateClass(status: WorkflowGridRow["status"]): string {
    if (status === "On Track")
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300";
    if (status === "Attention")
      return "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300";
    return "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300";
  }

  serviceCardStatusClass(status: ServiceShowcaseCard["status"]): string {
    if (status === "Healthy")
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300";
    if (status === "Needs Review")
      return "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300";
    return "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300";
  }

  stageToStatus(stage: WorkflowStatus): string {
    if (stage === "Done") return "Completed";
    return stage;
  }

  statusLabel(stage: WorkflowStatus): string {
    return stage === "Done" ? "Done" : stage;
  }

  private matchesVisitWindow(
    value: string,
    window: "All" | "Last 7 Days" | "Last 30 Days",
  ): boolean {
    if (window === "All") return true;
    const visitDate = new Date(value).getTime();
    const now = new Date("2026-09-05").getTime();
    const diffDays = Math.floor((now - visitDate) / (1000 * 60 * 60 * 24));
    if (window === "Last 7 Days") return diffDays <= 7;
    return diffDays <= 30;
  }
}
