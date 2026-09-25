import { Component, computed, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute } from "@angular/router";
import { TableModule } from "primeng/table";
import { ClinicDataService } from "@core/services/clinic-data.service";
import { DoctorDataService } from "@core/services/doctor-data.service";
import { OrderDataService } from "@core/services/order-data.service";
import { NavigationService } from "@core/services/navigation.service";
import { FormatUtils } from "@core/services/format-utils.service";
import { AvatarComponent } from "@shared/components/avatar/avatar.component";
import { IconActionButtonComponent } from "@shared/components/icon-action-button/icon-action-button.component";
import { statusDisplayLabel } from "@shared/utils/status-label";

type ClinicTab = "overview" | "doctors" | "orders" | "activity";

@Component({
  selector: "app-clinic-details",
  standalone: true,
  imports: [CommonModule, TableModule, AvatarComponent, IconActionButtonComponent],
  templateUrl: "./clinic-details.component.html",
  styleUrl: "./clinic-details.component.scss",
})
export class ClinicDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly clinicService = inject(ClinicDataService);
  private readonly doctorService = inject(DoctorDataService);
  private readonly orderService = inject(OrderDataService);
  protected readonly navigationService = inject(NavigationService);
  protected readonly formatUtils = inject(FormatUtils);

  readonly activeTab = signal<ClinicTab>("overview");
  readonly tabs: { id: ClinicTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "doctors", label: "Doctors" },
    { id: "orders", label: "Orders" },
    { id: "activity", label: "Activity" },
  ];

  readonly clinic = computed(() => {
    const clinicId = this.route.snapshot.paramMap.get("clinicId");
    return (
      this.clinicService.getClinicById(clinicId ?? "") ??
      this.clinicService.clinics()[0]
    );
  });

  readonly clinicDoctors = computed(() => {
    const current = this.clinic();
    if (!current) return [];
    return this.doctorService
      .doctors()
      .filter((d) => d.clinicId === current.id);
  });

  readonly clinicOrders = computed(() => {
    const current = this.clinic();
    if (!current) return [];
    return this.orderService.getOrdersByClinic(current.id).slice(0, 10);
  });

  readonly recentActivity = computed(() => this.clinicOrders().slice(0, 5));

  goBack(): void {
    this.navigationService.navigate("clinics");
  }

  setTab(tab: ClinicTab): void {
    this.activeTab.set(tab);
  }

  openDoctor(doctorId: string): void {
    this.navigationService.navigate("doctorDetails", { doctorId });
  }

  openOrder(orderId: string): void {
    this.navigationService.navigate("viewOrder", { orderId });
  }

  statusClasses(status: string): string {
    return status === "Active"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-muted text-muted-foreground";
  }

  statusLabel(status: string): string {
    return statusDisplayLabel(status);
  }

  backIconSvg(): string {
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>';
  }
}
