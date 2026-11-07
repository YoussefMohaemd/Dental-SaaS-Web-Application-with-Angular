import { AiQuickAction } from "@core/interfaces";

export interface AiActionWorkflowField {
  key: string;
  label: string;
  placeholder: string;
  optional?: boolean;
}

export interface AiActionWorkflowState {
  action: AiQuickAction;
  fields: readonly AiActionWorkflowField[];
  stepIndex: number;
  values: Record<string, string>;
  error: string | null;
}
