import {
  Clinic,
  CreateOrderBillToTarget,
  CreateOrderService,
  Doctor,
  Order,
  Patient,
} from "@core/interfaces";

export type AiOrderWorkflowMode = "create" | "update";

export type AiOrderWorkflowStep =
  | "patient"
  | "doctor"
  | "clinic"
  | "billTo"
  | "services"
  | "teeth"
  | "review"
  | "lookupOrder"
  | "selectOrder"
  | "editOrder"
  | "reviewUpdate";

export interface AiOrderWorkflowCreateData {
  patient: Patient | null;
  doctor: Doctor | null;
  clinic: Clinic | null;
  patientReference: string;
  doctorReference: string;
  clinicReference: string;
  billToTarget: CreateOrderBillToTarget;
  selectedServiceIds: string[];
  selectedTeeth: number[];
  selectedTeethByService: Record<string, number[]>;
  activeServiceId: string | null;
  patientCandidates: Patient[];
  doctorCandidates: Doctor[];
  clinicCandidates: Clinic[];
}

export interface AiOrderWorkflowUpdateData {
  orderCandidates: Order[];
  selectedOrder: Order | null;
  orderReference: string;
  baselineServiceIds: string[];
  selectedServiceIds: string[];
  baselineTeeth: number[];
  selectedTeeth: number[];
  baselineTeethByService: Record<string, number[]>;
  selectedTeethByService: Record<string, number[]>;
  activeServiceId: string | null;
  notes: string;
  billToTarget: CreateOrderBillToTarget;
}

export interface AiOrderWorkflowState {
  mode: AiOrderWorkflowMode;
  step: AiOrderWorkflowStep;
  input: string;
  loading: boolean;
  error: string | null;
  notice: string | null;
  services: readonly CreateOrderService[];
  create: AiOrderWorkflowCreateData | null;
  update: AiOrderWorkflowUpdateData | null;
}
