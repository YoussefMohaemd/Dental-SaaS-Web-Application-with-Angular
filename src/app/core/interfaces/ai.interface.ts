import { PageId } from "./navigation.interface";

export type AiActionIntent =
  | "createOrder"
  | "updateOrder"
  | "updatePatient"
  | "updateDoctor"
  | "updateClinic"
  | "openOrderDetails"
  | "generateReport"
  | "openOrders"
  | "openReports"
  | "searchOrders"
  | "searchPatients"
  | "searchDoctors"
  | "searchClinics"
  | "searchCases"
  | "addDoctor"
  | "addPatient"
  | "addClinic"
  | "changeWorkflow"
  | "changeScanCenter"
  | "changeSettings"
  | "aboutCompany"
  | "servicePricing"
  | "serviceCatalog"
  | "submissionStandards";

export interface AiShortcutAction {
  id: string;
  title: string;
  intent: AiActionIntent;
  description?: string;
  badge?: string;
  orderId?: string;
  confirmation?: {
    actionId: string;
    confirmationToken: string;
    tool: string;
    expiresAt?: string;
    payload?: Record<string, unknown>;
  };
}

export interface AiResultCardBase {
  id: string;
  title: string;
  summary: string;
  tone: "info" | "success" | "warning";
  details?: string;
}

export type AiResultCardWithCta = AiResultCardBase & {
  ctaLabel: string;
  ctaIntent: AiActionIntent;
};

export type AiResultCardWithoutCta = AiResultCardBase & {
  ctaLabel?: never;
  ctaIntent?: never;
};

export type AiResultCard = AiResultCardWithCta | AiResultCardWithoutCta;

export interface AiPromptDraft {
  search: string;
  prompt: string;
}

export type AiChatRole = "user" | "assistant" | "thinking";

export type AiChatMessageType =
  | "text"
  | "table"
  | "reportCard"
  | "statsCard"
  | "chart"
  | "orderDetails"
  | "patientInfo"
  | "loading"
  | "error"
  | "confirmation";

export interface AiChatMessage {
  id: string;
  role: AiChatRole;
  text: string;
  createdAt: string;
  type?: AiChatMessageType;
  markdown?: boolean;
  canCopy?: boolean;
  actions?: AiShortcutAction[];
  resultCards?: AiResultCard[];
}

export type AiFaqTopic = "company" | "services" | "pricing" | "standards";

export interface AiConversation {
  id: string;
  title: string;
  updatedAt: string;
  messages: AiChatMessage[];
  showWelcomeActions: boolean;
}

export interface AiConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
  preview: string;
  isActive: boolean;
}

export interface AiQuickAction {
  id: string;
  title: string;
  description: string;
  intent: AiActionIntent;
  icon: string;
  prefillPrompt: string;
  behavior: "send" | "prefill" | "navigate";
  category: "faq" | "operational" | "navigation";
  route?: PageId;
  badge?: string;
  requiredCapability?: string;
}
