export interface CreateOrderService {
  id: string;
  name: string;
  description: string;
  icon: string;
  scanRequirements: string[];
}

export interface CreateOrderFormData {
  patientId: string;
  doctorId: string;
  clinicId: string;
  priority: "Low" | "Normal" | "High" | "Urgent";
  dueDate: string;
  notes: string;
  shade: string;
  format: string;
}

export interface ServiceTeethMapping {
  [serviceId: string]: number[];
}

export const CREATE_ORDER_STEPS = [
  { id: 1, label: "Patient & Clinic", short: "Patient" },
  { id: 2, label: "Services", short: "Services" },
  { id: 3, label: "Teeth Selection", short: "Teeth" },
  { id: 4, label: "Service Details", short: "Details" },
  { id: 5, label: "Forms", short: "Forms" },
  { id: 6, label: "Scans & Files", short: "Files" },
  { id: 7, label: "Review", short: "Review" },
] as const;

export const AVAILABLE_SERVICES: CreateOrderService[] = [
  {
    id: "treatment-plan",
    name: "Treatment Plan",
    description:
      "Comprehensive treatment planning with diagnostic data and clinical workflow.",
    icon: "📋",
    scanRequirements: ["Full arch STL", "Bite registration"],
  },
  {
    id: "surgical-guide",
    name: "Surgical Guide",
    description:
      "Precision-guided implant surgery using CT and digital planning.",
    icon: "🦷",
    scanRequirements: [
      "CBCT / CT scan",
      "STL dental model",
      "Supporting reference files",
    ],
  },
  {
    id: "gfmr",
    name: "GFMR",
    description:
      "Full-mouth rehabilitation with a guided functional occlusal approach.",
    icon: "⚙️",
    scanRequirements: ["Upper arch scan", "Lower arch scan", "Bite scan"],
  },
  {
    id: "fmb",
    name: "FMB / FMP",
    description:
      "Full-mouth bridge or partial restoration fabricated to precision.",
    icon: "🔬",
    scanRequirements: ["Upper arch STL", "Lower arch STL"],
  },
  {
    id: "temp-restoration",
    name: "Temporary Restoration",
    description:
      "Interim restorations to protect and maintain occlusion during treatment.",
    icon: "🛡️",
    scanRequirements: ["Working model scan", "Antagonist scan"],
  },
  {
    id: "final-restoration",
    name: "Final Restoration",
    description:
      "Definitive crowns, bridges, veneers, or full-arch restorations.",
    icon: "✨",
    scanRequirements: ["Prep scan", "Antagonist scan", "Shade reference photo"],
  },
  {
    id: "full-guide",
    name: "Full Guide Case",
    description:
      "End-to-end digital workflow with guided surgery and final prosthetics.",
    icon: "🔑",
    scanRequirements: [
      "CBCT / CT scan",
      "Full arch STL",
      "Diagnostic model",
      "Bite registration",
    ],
  },
  {
    id: "other",
    name: "Other Service",
    description:
      "Custom lab service or specialized dental work not listed above.",
    icon: "➕",
    scanRequirements: ["As specified"],
  },
];

export const SHADE_OPTIONS = [
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
export const FORMAT_OPTIONS = ["STL", "PLY", "OBJ", "DICOM", "STL+OBJ"];
export const ARCH_OPTIONS = ["Maxilla (Upper)", "Mandible (Lower)", "Both"];
export const PRIORITY_OPTIONS = ["Low", "Normal", "High", "Urgent"] as const;
