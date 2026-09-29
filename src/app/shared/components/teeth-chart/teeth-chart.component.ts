import { Component, computed, input, output, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { LOWER_JAW_TEETH, UPPER_JAW_TEETH } from "@core/models/tooth.model";

export type ToothStatus =
  "normal" | "planned" | "implant" | "missing" | "extract";
export type JawFilter = "both" | "upper" | "lower";

export const UPPER_TEETH = UPPER_JAW_TEETH.map((tooth) => tooth.number);
export const LOWER_TEETH = LOWER_JAW_TEETH.map((tooth) => tooth.number);

export const SERVICE_COLORS = [
  "#2563EB",
  "#06B6D4",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EF4444",
  "#F97316",
  "#6366F1",
];

const STATUS_STYLE: Record<ToothStatus, { fill: string; border: string }> = {
  normal: { fill: "#FFFFFF", border: "#94A3B8" },
  planned: { fill: "#DBEAFE", border: "#2563EB" },
  implant: { fill: "#D1FAE5", border: "#059669" },
  missing: { fill: "transparent", border: "#64748B" },
  extract: { fill: "#FEE2E2", border: "#DC2626" },
};

@Component({
  selector: "app-teeth-chart",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./teeth-chart.component.html",
  styleUrls: ["./teeth-chart.component.scss"],
})
export class TeethChartComponent {
  readonly selected = input<number[]>([]);
  readonly toothStatuses = input<Record<number, ToothStatus>>({});
  readonly serviceTeeth = input<Record<string, number[]>>({});
  readonly services = input<string[]>([]);
  readonly readOnly = input<boolean>(false);

  readonly toothToggle = output<number>();

  readonly activeJaw = signal<JawFilter>("both");
  readonly hoveredTooth = signal<number | null>(null);

  readonly jaws: JawFilter[] = ["both", "upper", "lower"];

  readonly upperTeeth = UPPER_TEETH;
  readonly lowerTeeth = LOWER_TEETH;

  readonly serviceColors = computed<Record<number, string>>(() => {
    const map: Record<number, string> = {};
    const teethByService = this.serviceTeeth();
    this.services().forEach((svc, i) => {
      (teethByService[svc] || []).forEach((n) => {
        map[n] = SERVICE_COLORS[i % SERVICE_COLORS.length];
      });
    });
    return map;
  });

  readonly hasServiceColors = computed(
    () => Object.keys(this.serviceTeeth()).length > 0,
  );

  readonly legend = [
    { label: "Planned", fill: "#dbeafe", border: "#2563EB", dashed: false },
    { label: "Implant", fill: "#d1fae5", border: "#10B981", dashed: false },
    { label: "Missing", fill: "transparent", border: "#94a3b8", dashed: true },
    { label: "To Extract", fill: "#fee2e2", border: "#ef4444", dashed: false },
  ];

  setJaw(jaw: JawFilter): void {
    this.activeJaw.set(jaw);
  }

  onToggle(num: number): void {
    if (!this.readOnly()) this.toothToggle.emit(num);
  }

  onHover(num: number): void {
    if (!this.readOnly()) this.hoveredTooth.set(num);
  }

  onLeave(): void {
    this.hoveredTooth.set(null);
  }

  onSpaceKey(event: Event, num: number): void {
    event.preventDefault();
    this.onToggle(num);
  }

  statusOf(num: number): ToothStatus {
    return this.toothStatuses()[num] ?? "normal";
  }

  isSelected(num: number): boolean {
    return this.selected().includes(num);
  }

  serviceColorOf(num: number): string | undefined {
    return this.hasServiceColors() ? this.serviceColors()[num] : undefined;
  }

  getToothWidth(num: number): number {
    const t = num % 10;
    if (t === 8 || t === 7) return 24;
    if (t === 6) return 22;
    if (t === 5 || t === 4) return 18;
    if (t === 3) return 14;
    if (t === 2 || t === 1) return 15;
    return 16;
  }

  getToothHeight(num: number, isUpper: boolean): number {
    const t = num % 10;
    if (t >= 6) return isUpper ? 32 : 30;
    if (t === 5 || t === 4) return isUpper ? 34 : 32;
    if (t === 3) return isUpper ? 38 : 36;
    if (t === 1 || t === 2) return isUpper ? 37 : 35;
    return 32;
  }

  fillOf(num: number): string {
    const status = this.statusOf(num);
    if (status === "missing") return "transparent";
    if (this.isSelected(num)) return this.serviceColorOf(num) ?? "#2563EB";
    if (this.hoveredTooth() === num && !this.readOnly()) return "#EFF6FF";
    return STATUS_STYLE[status].fill;
  }

  borderOf(num: number): string {
    const status = this.statusOf(num);
    if (this.isSelected(num)) return this.serviceColorOf(num) ?? "#2563EB";
    if (this.hoveredTooth() === num && !this.readOnly()) return "#1D4ED8";
    return STATUS_STYLE[status].border;
  }

  glowOf(num: number): string {
    if (this.isSelected(num)) {
      return `0 0 0 2px rgb(255 255 255 / 0.92), 0 9px 20px ${
        this.serviceColorOf(num) ?? "#2563EB"
      }33`;
    }
    if (this.hoveredTooth() === num && !this.readOnly()) {
      return "0 0 0 2px rgb(255 255 255 / 0.9), 0 8px 18px rgb(37 99 235 / 0.25)";
    }
    return "0 0 0 1px rgb(255 255 255 / 0.92), 0 2px 5px rgb(15 23 42 / 0.14)";
  }

  serviceColorAt(index: number): string {
    return SERVICE_COLORS[index % SERVICE_COLORS.length];
  }

  serviceTeethCount(service: string): number {
    return this.serviceTeeth()[service]?.length ?? 0;
  }
}
