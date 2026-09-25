import { Component, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { SafeHtmlPipe } from "@shared/pipes/safe-html.pipe";

export type FormsSectionId =
  | "patient"
  | "restoration"
  | "doctor"
  | "billing"
  | "changeRequest"
  | "scan"
  | "validation";

@Component({
  selector: "app-forms",
  standalone: true,
  imports: [CommonModule, FormsModule, SafeHtmlPipe],
  templateUrl: "./forms.component.html",
  styleUrl: "./forms.component.scss",
})
export class FormsComponent {
  readonly active = signal<FormsSectionId | null>("patient");

  readonly gender = signal("");
  readonly arch = signal("Both");
  readonly material = signal("");
  readonly showPassword = signal(false);
  readonly autoInvoice = signal(false);
  readonly severity = signal("Medium");
  readonly scanFiles = signal<string[]>([
    "UpperArch_scan_01.stl",
    "LowerArch_scan_02.stl",
  ]);

  readonly sections: { id: FormsSectionId; label: string; icon: string }[] = [
    { id: "patient", label: "Patient Form", icon: "user" },
    { id: "restoration", label: "Restoration Form", icon: "file-text" },
    { id: "doctor", label: "Doctor Form", icon: "stethoscope" },
    { id: "billing", label: "Billing Config", icon: "receipt" },
    { id: "changeRequest", label: "Change Request", icon: "refresh" },
    { id: "scan", label: "Scan Info", icon: "building" },
    { id: "validation", label: "Validation States", icon: "check-circle" },
  ];

  readonly materials = [
    "Zirconia (Multilayer)",
    "PFM",
    "E-max",
    "PMMA (Temp)",
    "Titanium",
    "Composite",
  ];
  readonly severities = ["Low", "Medium", "High", "Critical"];

  setActive(id: FormsSectionId): void {
    this.active.update((current) => (current === id ? null : id));
  }

  toggleShowPassword(): void {
    this.showPassword.update((v) => !v);
  }

  toggleAutoInvoice(): void {
    this.autoInvoice.update((v) => !v);
  }

  removeScanFile(name: string): void {
    this.scanFiles.update((current) => current.filter((f) => f !== name));
  }

  onAttachmentDropzoneActivate(event?: Event | KeyboardEvent): void {
    event?.preventDefault();
  }

  severityClasses(level: string): string {
    if (this.severity() !== level)
      return "border-border text-muted-foreground hover:bg-muted";
    if (level === "Critical") return "border-danger bg-danger/5 text-danger";
    if (level === "High") return "border-warning bg-warning/5 text-warning";
    if (level === "Medium") return "border-primary bg-primary/5 text-primary";
    return "border-success bg-success/5 text-success";
  }

  getIconSvg(name: string): string {
    const icons: Record<string, string> = {
      user: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
      "file-text":
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
      stethoscope:
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>',
      receipt:
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M8 15h5"/></svg>',
      refresh:
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.23 4.27A9 9 0 0 1 3.51 15"/></svg>',
      building:
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/><path d="M12 14h.01"/></svg>',
      "check-circle":
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      "alert-circle":
        '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
      info: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
      upload:
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
      "chevron-down":
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
      eye: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
      "eye-off":
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>',
      x: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    };
    return icons[name] || "";
  }
}
