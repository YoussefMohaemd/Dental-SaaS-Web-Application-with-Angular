import { Component, computed, input, output, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { LOWER_JAW_TEETH, UPPER_JAW_TEETH } from "@core/models/tooth.model";

export type ToothStatus =
  "normal" | "planned" | "implant" | "missing" | "extract";
export type JawFilter = "both" | "upper" | "lower";
export type ArchSide = "right" | "left";

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
  normal: { fill: "#FFFFFF", border: "#64748B" },
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
  readonly upperRightTeeth = this.upperTeeth.slice(0, 8);
  readonly upperLeftTeeth = this.upperTeeth.slice(8);
  readonly lowerRightTeeth = this.lowerTeeth.slice(0, 8);
  readonly lowerLeftTeeth = this.lowerTeeth.slice(8);

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
    { label: "Missing", fill: "transparent", border: "#64748B", dashed: true },
    { label: "To Extract", fill: "#fee2e2", border: "#DC2626", dashed: false },
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
    if (t === 8) return 25;
    if (t === 7) return 24;
    if (t === 6) return 22;
    if (t === 5 || t === 4) return 19;
    if (t === 3) return 17;
    if (t === 1 || t === 2) return 16;
    return 18;
  }

  getToothHeight(num: number, isUpper: boolean): number {
    const t = num % 10;
    if (t >= 6) return 31;
    if (t === 5 || t === 4) return 34;
    if (t === 3) return 37;
    if (t === 1 || t === 2) return 35;
    return isUpper ? 33 : 32;
  }

  getArchCurveOffset(index: number, total: number, side: ArchSide): number {
    if (total <= 1) return 0;
    const distanceToMidline = side === "right" ? total - 1 - index : index;
    const normalizedProximity = 1 - distanceToMidline / (total - 1);
    return Math.round(Math.pow(Math.max(0, normalizedProximity), 1.22) * 8);
  }

  getCrownRadius(num: number, isUpper: boolean): string {
    const t = num % 10;
    if (t >= 6) {
      return isUpper
        ? "36% 36% 48% 48% / 22% 22% 78% 78%"
        : "48% 48% 36% 36% / 78% 78% 22% 22%";
    }
    if (t === 5 || t === 4) {
      return isUpper
        ? "34% 34% 52% 52% / 18% 18% 82% 82%"
        : "52% 52% 34% 34% / 82% 82% 18% 18%";
    }
    if (t === 3) {
      return isUpper
        ? "30% 30% 56% 56% / 10% 10% 90% 90%"
        : "56% 56% 30% 30% / 90% 90% 10% 10%";
    }
    return isUpper
      ? "28% 28% 50% 50% / 12% 12% 88% 88%"
      : "50% 50% 28% 28% / 88% 88% 12% 12%";
  }

  fillOf(num: number): string {
    const status = this.statusOf(num);
    if (status === "missing") return "transparent";
    if (this.isSelected(num)) return this.serviceColorOf(num) ?? "#2563EB";
    if (this.hoveredTooth() === num && !this.readOnly()) return "#DBEAFE";
    return STATUS_STYLE[status].fill;
  }

  borderOf(num: number): string {
    const status = this.statusOf(num);
    if (this.isSelected(num)) return this.serviceColorOf(num) ?? "#2563EB";
    if (this.hoveredTooth() === num && !this.readOnly()) return "#1E40AF";
    return STATUS_STYLE[status].border;
  }

  glowOf(num: number): string {
    if (this.isSelected(num)) {
      return `0 0 0 2px rgb(255 255 255 / 0.92), 0 9px 20px ${
        this.serviceColorOf(num) ?? "#2563EB"
      }33`;
    }
    if (this.hoveredTooth() === num && !this.readOnly()) {
      return "0 0 0 2px rgb(255 255 255 / 0.92), 0 10px 20px rgb(30 64 175 / 0.28)";
    }
    return "0 0 0 1px rgb(255 255 255 / 0.95), 0 4px 9px rgb(15 23 42 / 0.2)";
  }

  serviceColorAt(index: number): string {
    return SERVICE_COLORS[index % SERVICE_COLORS.length];
  }

  serviceTeethCount(service: string): number {
    return this.serviceTeeth()[service]?.length ?? 0;
  }
}
