import {
  CreateOrderBillToTarget,
  CreateOrderService,
  Order,
} from "@core/interfaces";

export type AiOrderWorkflowStep =
  | "lookupOrder"
  | "selectOrder"
  | "editOrder"
  | "reviewUpdate";

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
  step: AiOrderWorkflowStep;
  input: string;
  loading: boolean;
  error: string | null;
  notice: string | null;
  services: readonly CreateOrderService[];
  update: AiOrderWorkflowUpdateData | null;
}
