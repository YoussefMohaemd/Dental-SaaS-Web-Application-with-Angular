import { ArchType, RestoType } from "@core/models";

export interface ServiceDetail {
  shade: string;
  arch: string;
  occlusalConcept: string;
  implantSystem: string;
  fileFormat: string;
  serviceNotes: string;
}

export interface ServiceClinicalForm {
  clinicalNotes: string;
  occlusalContact: string;
  marginType: string;
  material: string;
  specialInstructions: string;
}

export const SHADES = [
  "A1",
  "A2",
  "A3",
  "A3.5",
  "B1",
  "B2",
  "C2",
  "D3",
  "BL1",
  "BL2",
];

export const FILE_FORMATS = ["STL", "PLY", "OBJ", "DICOM", "STL+OBJ"];
export const OCCLUSAL_CONCEPTS = [
  "Mutually Protected",
  "Group Function",
  "Full Balanced",
];
export const IMPLANT_SYSTEMS = [
  "Straumann",
  "Nobel Biocare",
  "Zimmer Biomet",
  "Neodent",
  "Other",
];
export const OCCLUSAL_CONTACTS = ["Light contact", "Full contact", "No contact"];
export const MARGIN_TYPES = ["Chamfer", "Shoulder", "Feather edge", "Knife edge"];
export const MATERIALS = [
  "Zirconia (Multilayer)",
  "PFM",
  "E-max",
  "PMMA",
  "Titanium",
];

const SERVICE_FORM_DEFAULTS: Record<string, Partial<ServiceClinicalForm>> = {
  "treatment-plan": {
    clinicalNotes:
      "Include diagnosis summary, treatment phases, and patient expectations.",
    occlusalContact: "No contact",
    marginType: "Shoulder",
    material: "PMMA",
    specialInstructions:
      "Attach timeline milestones and risks to review with the clinic.",
  },
  "surgical-guide": {
    clinicalNotes:
      "Specify implant positions, angulation limits, and anchor strategy.",
    occlusalContact: "No contact",
    marginType: "Feather edge",
    material: "Titanium",
    specialInstructions:
      "Confirm sleeve kit, offset, and drilling protocol before manufacturing.",
  },
  gfmr: {
    clinicalNotes:
      "Capture OVD targets, centric relation notes, and articulation plan.",
    occlusalContact: "Full contact",
    marginType: "Chamfer",
    material: "Zirconia (Multilayer)",
    specialInstructions:
      "Document sequence for provisional-to-final transition per arch.",
  },
  fmb: {
    clinicalNotes:
      "Define span design, connector dimensions, and pontic requirements.",
    occlusalContact: "Light contact",
    marginType: "Shoulder",
    material: "Zirconia (Multilayer)",
    specialInstructions:
      "Highlight cantilever restrictions and tissue contact expectations.",
  },
  "temp-restoration": {
    clinicalNotes:
      "State provisional goals for soft-tissue shaping and bite stabilization.",
    occlusalContact: "Light contact",
    marginType: "Chamfer",
    material: "PMMA",
    specialInstructions:
      "Include expected wear period and any planned adjustments.",
  },
  "final-restoration": {
    clinicalNotes:
      "Provide definitive prep details, emergence profile, and shade strategy.",
    occlusalContact: "Full contact",
    marginType: "Shoulder",
    material: "E-max",
    specialInstructions:
      "List characterization zones, translucency requests, and delivery targets.",
  },
  "full-guide": {
    clinicalNotes:
      "Outline full workflow from guide surgery to immediate/provisional loading.",
    occlusalContact: "Full contact",
    marginType: "Chamfer",
    material: "Zirconia (Multilayer)",
    specialInstructions:
      "Track dependency between guide verification and prosthetic milestones.",
  },
  other: {
    clinicalNotes:
      "Describe custom service scope, acceptance criteria, and constraints.",
    occlusalContact: "Light contact",
    marginType: "Chamfer",
    material: "PFM",
    specialInstructions:
      "List all custom technical details and communication checkpoints.",
  },
};

const SERVICES_REQUIRING_TEETH = new Set<string>([
  "surgical-guide",
  "gfmr",
  "fmb",
  "temp-restoration",
  "final-restoration",
  "full-guide",
]);

export function defaultServiceDetail(): ServiceDetail {
  return {
    shade: "A2",
    arch: "Both",
    occlusalConcept: "Mutually Protected",
    implantSystem: "Straumann",
    fileFormat: "STL",
    serviceNotes: "",
  };
}

export function defaultServiceClinicalForm(
  serviceId?: string,
): ServiceClinicalForm {
  return {
    clinicalNotes:
      "Document indication, target outcome, and key clinical constraints for this service.",
    occlusalContact: "Light contact",
    marginType: "Chamfer",
    material: "Zirconia (Multilayer)",
    specialInstructions:
      "Add technician instructions, esthetic targets, and any staging notes.",
    ...(serviceId ? SERVICE_FORM_DEFAULTS[serviceId] : {}),
  };
}

export function needsShadeArch(serviceId: string): boolean {
  return (
    serviceId === "fmb" ||
    serviceId === "final-restoration" ||
    serviceId === "temp-restoration"
  );
}

export function serviceRequiresTeeth(serviceId: string): boolean {
  return SERVICES_REQUIRING_TEETH.has(serviceId.trim().toLowerCase());
}

export function mapServiceToRestoration(serviceId: string): RestoType {
  if (serviceId === "surgical-guide") return "Implant Crown";
  if (serviceId === "final-restoration" || serviceId === "fmb") return "Bridge";
  if (serviceId === "temp-restoration") return "Crown";
  if (serviceId === "gfmr" || serviceId === "full-guide") return "Full Arch";
  return "Crown";
}

export function deriveArchFromSelection(
  teeth: readonly number[],
  fallback: ArchType = "Both",
): ArchType {
  const hasUpper = teeth.some((tooth) => tooth >= 11 && tooth <= 28);
  const hasLower = teeth.some((tooth) => tooth >= 31 && tooth <= 48);
  if (hasUpper && hasLower) return "Both";
  if (hasUpper) return "Maxilla";
  if (hasLower) return "Mandible";
  return fallback;
}

export function parseTeethInput(value: string): number[] {
  const numbers = value
    .split(/[\s,]+/)
    .map((part) => Number(part))
    .filter((tooth) => Number.isInteger(tooth) && tooth >= 11 && tooth <= 48);
  return Array.from(new Set(numbers)).sort((a, b) => a - b);
}

export function normalizeLookup(value: string): string {
  return value.trim().toLowerCase();
}

export function uniqueSortedValues(values: readonly string[]): string[] {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter((value) => value.length > 0)),
  ).sort((a, b) => a.localeCompare(b));
}

export function resolveNameSuggestions(
  values: readonly string[],
  query: string,
  limit = 6,
): string[] {
  const needle = normalizeLookup(query);
  if (!needle) return [];

  const matched = uniqueSortedValues(values).filter((value) =>
    normalizeLookup(value).includes(needle),
  );

  matched.sort((left, right) => {
    const leftKey = normalizeLookup(left);
    const rightKey = normalizeLookup(right);
    const leftStarts = leftKey.startsWith(needle) ? 0 : 1;
    const rightStarts = rightKey.startsWith(needle) ? 0 : 1;
    if (leftStarts !== rightStarts) return leftStarts - rightStarts;
    return left.localeCompare(right);
  });

  return matched.slice(0, Math.max(1, limit));
}
