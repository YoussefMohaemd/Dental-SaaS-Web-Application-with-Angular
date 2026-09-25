import {
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute } from "@angular/router";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { CdkMenuModule } from "@angular/cdk/menu";
import { DialogModule } from "primeng/dialog";
import { OrderDataService } from "@core/services/order-data.service";
import { PatientDataService } from "@core/services/patient-data.service";
import { DoctorDataService } from "@core/services/doctor-data.service";
import { ClinicDataService } from "@core/services/clinic-data.service";
import { NavigationService } from "@core/services/navigation.service";
import { FormatUtils } from "@core/services/format-utils.service";
import { Order, Patient, Doctor, Clinic, SubOrder } from "@core/models";
import { AvatarComponent } from "@shared/components/avatar/avatar.component";
import { ButtonComponent } from "@shared/components/button/button.component";
import { IconActionButtonComponent } from "@shared/components/icon-action-button/icon-action-button.component";
import { OrderSummaryCardComponent } from "@shared/components/order-summary-card/order-summary-card.component";
import { SafeHtmlPipe } from "@shared/pipes/safe-html.pipe";
import { lucideSvg } from "@shared/icons/lucide-icons";
import { SubOrderDataService } from "@core/services/sub-order-data.service";
import { statusDisplayLabel } from "@shared/utils/status-label";

const STAGES = [
  "Received",
  "Scanning",
  "Design",
  "Fabrication",
  "QC",
  "Dispatch",
  "Delivered",
];

function withIconSize(svg: string, size?: number): string {
  if (!svg || size == null) return svg;
  return svg
    .replace(/width="\d+"/, `width="${size}"`)
    .replace(/height="\d+"/, `height="${size}"`);
}

@Component({
  selector: "app-view-order",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CdkMenuModule,
    DialogModule,
    AvatarComponent,
    ButtonComponent,
    IconActionButtonComponent,
    OrderSummaryCardComponent,
    SafeHtmlPipe,
  ],
  templateUrl: "./view-order.component.html",
  styleUrl: "./view-order.component.scss",
})
export class ViewOrderComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly host = inject(ElementRef);
  private readonly orderService = inject(OrderDataService);
  private readonly patientService = inject(PatientDataService);
  private readonly doctorService = inject(DoctorDataService);
  private readonly clinicService = inject(ClinicDataService);
  private readonly subOrderService = inject(SubOrderDataService);
  protected readonly navigationService = inject(NavigationService);
  protected readonly formatUtils = inject(FormatUtils);

  private readonly paramMap = toSignal(this.route.paramMap, {
    initialValue: null,
  });
  private readonly orderId = computed(
    () => this.paramMap()?.get("orderId") ?? "",
  );

  readonly moreMenuOpen = signal(false);
  readonly noteDialogVisible = signal(false);
  readonly noteText = signal("");
  readonly noteSaving = signal(false);
  readonly noteSaved = signal(false);
  readonly notes = signal<{ text: string; at: string }[]>([]);
  readonly confirmDeleteVisible = signal(false);
  readonly actionMessage = signal<string | null>(null);

  readonly order = computed(() => {
    const id = this.orderId();
    if (!id) return undefined;
    return this.orderService.getOrderById(id);
  });

  readonly patient = computed(() => {
    const order = this.order();
    if (!order) return undefined;
    return this.patientService.getPatientById(order.patientId);
  });

  readonly doctor = computed(() => {
    const order = this.order();
    if (!order) return undefined;
    return this.doctorService.getDoctorById(order.doctorId);
  });

  readonly clinic = computed(() => {
    const order = this.order();
    if (!order) return undefined;
    return this.clinicService.getClinicById(order.clinicId);
  });

  readonly subOrders = computed<SubOrder[]>(() => {
    const order = this.order();
    if (!order) return [];
    return this.subOrderService.getByOrderId(order.id);
  });

  readonly completedServices = computed(
    () => this.subOrders().filter((s) => s.status === "done").length,
  );
  readonly totalServices = computed(() => this.subOrders().length);
  readonly overallProgress = computed(() => {
    const total = this.totalServices();
    if (total === 0) return 0;
    return Math.round((this.completedServices() / total) * 100);
  });
  readonly currentStage = 3;
  readonly stages: string[] = STAGES;

  ngOnInit(): void {}

  openMoreMenu(): void {
    this.moreMenuOpen.update((v) => !v);
  }

  closeMoreMenu(): void {
    this.moreMenuOpen.set(false);
  }

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent): void {
    if (!this.moreMenuOpen()) return;
    const target = event.target as Node | null;
    if (target && !this.host.nativeElement.contains(target)) {
      this.moreMenuOpen.set(false);
    }
  }

  @HostListener("document:keydown.escape")
  onEscape(): void {
    this.moreMenuOpen.set(false);
  }

  openNoteDialog(): void {
    this.noteDialogVisible.set(true);
    this.noteSaved.set(false);
    this.closeMoreMenu();
  }

  closeNoteDialog(): void {
    if (this.noteSaving()) return;
    this.noteDialogVisible.set(false);
  }

  onNoteTextChange(value: string | Event): void {
    const next =
      typeof value === "string"
        ? value
        : ((value.target as HTMLTextAreaElement | null)?.value ?? "");
    this.noteText.set(next);
  }

  saveNote(): void {
    const text = this.noteText().trim();
    if (!text) return;
    this.noteSaving.set(true);
    window.setTimeout(() => {
      this.notes.update((current) => [
        ...current,
        { text, at: new Date().toISOString() },
      ]);
      this.noteText.set("");
      this.noteSaving.set(false);
      this.noteSaved.set(true);
      window.setTimeout(() => {
        this.noteDialogVisible.set(false);
        this.noteSaved.set(false);
      }, 900);
    }, 600);
  }

  exportOrder(): void {
    const current = this.order();
    if (!current) return;
    const blob = new Blob([JSON.stringify(current, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${current.orderNumber}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    this.flashAction("Order exported as JSON.");
    this.closeMoreMenu();
  }

  askDelete(): void {
    this.confirmDeleteVisible.set(true);
    this.closeMoreMenu();
  }

  cancelDelete(): void {
    this.confirmDeleteVisible.set(false);
  }

  confirmDelete(): void {
    const current = this.order();
    if (current) this.orderService.deleteOrder(current.id);
    this.confirmDeleteVisible.set(false);
    this.navigationService.navigate("orders");
  }

  private flashAction(message: string): void {
    this.actionMessage.set(message);
    window.setTimeout(() => {
      if (this.actionMessage() === message) this.actionMessage.set(null);
    }, 2600);
  }

  formatSubOrderId(index: number): string {
    return `SO-${String(index + 1).padStart(2, "0")}`;
  }

  subOrderProgress(sub: SubOrder): number {
    const forms = sub.formsTotal === 0 ? 1 : sub.formsComplete / sub.formsTotal;
    const scans = sub.scansTotal === 0 ? 1 : sub.scansComplete / sub.scansTotal;
    return Math.round(((forms + scans) / 2) * 100);
  }

  navigateToCreateOrder(): void {
    this.navigationService.navigate("createOrder");
  }

  navigateToEditOrder(): void {
    const current = this.order();
    if (!current) return;
    this.navigationService.navigate("editOrder", { orderId: current.id });
  }

  navigateToWorkflow(): void {
    const current = this.order();
    if (!current) return;
    this.navigationService.navigate("orderWorkflow", { orderId: current.id });
  }

  navigateToFiles(): void {
    const current = this.order();
    if (!current) return;
    this.navigationService.navigate("orderFiles", { orderId: current.id });
  }

  navigateToPatient(): void {
    const current = this.order();
    if (!current) return;
    this.navigationService.navigate("patientDetails", {
      patientId: current.patientId,
    });
  }

  navigateToDoctor(): void {
    const current = this.order();
    if (!current) return;
    this.navigationService.navigate("doctorDetails", {
      doctorId: current.doctorId,
    });
  }

  navigateToClinic(): void {
    const current = this.order();
    if (!current) return;
    this.navigationService.navigate("clinicDetails", {
      clinicId: current.clinicId,
    });
  }

  navigateToSubOrder(subOrderId: string): void {
    const current = this.order();
    if (!current) return;
    this.navigationService.navigate("subOrder", {
      orderId: current.id,
      subOrderId,
    });
  }

  getStatusConfig(status: string) {
    const configs: Record<
      string,
      { label: string; color: string; bg: string; icon: string }
    > = {
      done: {
        label: "done",
        color: "text-success",
        bg: "bg-success/10",
        icon: "check-circle-2",
      },
      "in-progress": {
        label: "In Progress",
        color: "text-primary",
        bg: "bg-primary/10",
        icon: "clock",
      },
      pending: {
        label: "Pending",
        color: "text-muted-foreground",
        bg: "bg-muted",
        icon: "circle",
      },
      blocked: {
        label: "Blocked",
        color: "text-danger",
        bg: "bg-danger/10",
        icon: "alert-triangle",
      },
    };
    return configs[status] || configs["pending"];
  }

  statusLabel(status: string): string {
    return statusDisplayLabel(status);
  }

  getStatusIconSvg(name: string, size = 12): string {
    const map: Record<string, string> = {
      "check-circle-2": "circle-check",
      clock: "clock",
      circle: "circle",
      "alert-triangle": "triangle-alert",
    };
    return lucideSvg(map[name] ?? name, size);
  }

  getStageSvg(name: string, size?: number): string {
    const defaults: Record<string, { icon: string; size: number }> = {
      "chevron-right": { icon: "chevron-right", size: 14 },
      "chevron-left": { icon: "chevron-left", size: 18 },
      "arrow-left": { icon: "arrow-left", size: 18 },
      layers: { icon: "layers", size: 13 },
      "scan-line": { icon: "scan-line", size: 13 },
      "message-square": { icon: "message-square", size: 13 },
      edit: { icon: "pen", size: 13 },
      download: { icon: "download", size: 13 },
      "more-horizontal": { icon: "ellipsis", size: 16 },
      "file-text": { icon: "file-text", size: 13 },
    };
    const entry = defaults[name];
    if (!entry) return "";
    return lucideSvg(entry.icon, size ?? entry.size);
  }

  getProgressRingSvg(value: number, size = 48): string {
    const r = (size - 6) / 2;
    const circ = 2 * Math.PI * r;
    const dash = (value / 100) * circ;
    return `
      <svg width="${size}" height="${size}" class="shrink-0 -rotate-90">
        <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--color-border)" stroke-width="4" />
        <circle
          cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none"
          stroke="${value === 100 ? "var(--color-success)" : "var(--color-primary)"}"
          stroke-width="4" stroke-linecap="round"
          stroke-dasharray="${dash} ${circ}"
        />
      </svg>
    `;
  }
}
