import { computed, effect, Injectable, inject, signal, untracked } from "@angular/core";
import {
  AVAILABLE_SERVICES,
  AiChatMessage,
  Clinic,
  Doctor,
  AiConversation,
  AiConversationSummary,
  Patient,
  AiPromptDraft,
  AiQuickAction,
  AiShortcutAction,
} from "@core/interfaces";
import {
  AssistantConfirmActionResponseDto,
  AssistantConversationSummaryDto,
  AssistantConversationViewDto,
  AssistantDataService,
  AssistantMessageResponseDto,
} from "@core/services/assistant-data.service";
import { ClinicDataService } from "@core/services/clinic-data.service";
import { DoctorDataService } from "@core/services/doctor-data.service";
import { AuthService } from "@core/services/auth.service";
import { AuthorizationService } from "@core/services/authorization.service";
import { NavigationService } from "@core/services/navigation.service";
import { PatientDataService } from "@core/services/patient-data.service";
import { type DentalCapability } from "@core/security/capabilities";
import { firstValueFrom } from "rxjs";
import { AI_QUICK_ACTIONS, AI_WELCOME_MESSAGE } from "../data/ai-chat.config";
import {
  AiActionWorkflowField,
  AiActionWorkflowState,
} from "./ai-action-workflow.models";
import { AiOrderWorkflowState } from "./ai-order-workflow.models";

@Injectable({ providedIn: "root" })
export class AiChatFacade {
  private readonly authService = inject(AuthService);
  private readonly authorizationService = inject(AuthorizationService);
  private readonly navigationService = inject(NavigationService);
  private readonly assistantDataService = inject(AssistantDataService);
  private readonly patientDataService = inject(PatientDataService);
  private readonly doctorDataService = inject(DoctorDataService);
  private readonly clinicDataService = inject(ClinicDataService);

  private messageSequence = 0;
  private localConversationSequence = 0;
  private readonly backendConversationByLocalId = new Map<string, string>();
  private backendAllowedSuggestionIds = new Set<string>();
  private currentUserId: string | null = null;
  private sessionGeneration = 0;

  readonly promptDraft = signal<AiPromptDraft>({
    search: "",
    prompt: "",
  });
  readonly activeWorkflow = signal<AiActionWorkflowState | null>(null);
  readonly activeOrderWorkflow = signal<AiOrderWorkflowState | null>(null);
  readonly isResponding = signal(false);
  readonly historyOpen = signal(false);
  readonly conversations = signal<AiConversation[]>([]);
  readonly activeConversationId = signal<string | null>(null);

  readonly activeConversation = computed(() =>
    this.conversations().find((item) => item.id === this.activeConversationId()),
  );

  readonly messages = computed(() => this.activeConversation()?.messages ?? []);

  readonly showWelcome = computed(
    () => this.activeConversation()?.showWelcomeActions ?? false,
  );

  readonly conversationSummaries = computed<AiConversationSummary[]>(() => {
    const activeId = this.activeConversationId();
    return this.conversations().map((conversation) => ({
      id: conversation.id,
      title: conversation.title,
      updatedAt: conversation.updatedAt,
      preview: conversation.messages.at(-1)?.text ?? "No messages yet.",
      isActive: conversation.id === activeId,
    }));
  });

  readonly quickActions = computed(() =>
    AI_QUICK_ACTIONS.filter((action) => this.isQuickActionVisible(action)),
  );
  readonly activeWorkflowField = computed(() => {
    const workflow = this.activeWorkflow();
    if (!workflow) {
      return null;
    }
    return workflow.fields[workflow.stepIndex] ?? null;
  });

  readonly canSend = computed(
    () => this.promptDraft().prompt.trim().length > 0 && !this.isResponding(),
  );

  public constructor() {
    effect(() => {
      const userId = this.authService.user()?.userId ?? null;
      untracked(() => this.onSessionChanged(userId));
    });
  }

  toggleHistory(): void {
    this.historyOpen.update((state) => !state);
  }

  closeHistory(): void {
    this.historyOpen.set(false);
  }

  selectConversation(conversationId: string): void {
    const exists = this.conversations().some((item) => item.id === conversationId);
    if (!exists) {
      return;
    }

    this.activeConversationId.set(conversationId);
    this.activeWorkflow.set(null);
    this.activeOrderWorkflow.set(null);
    if (this.navigationService.isMobile()) {
      this.historyOpen.set(false);
    }

    void this.loadConversationMessages(conversationId);
  }

  startNewChat(): void {
    const active = this.activeConversation();
    if (active && active.showWelcomeActions && !this.backendConversationByLocalId.has(active.id)) {
      this.promptDraft.update((state) => ({ ...state, prompt: "" }));
      this.activeWorkflow.set(null);
      this.activeOrderWorkflow.set(null);
      this.closeHistory();
      return;
    }

    const localId = this.nextLocalConversationId();
    const conversation = this.createConversationShell(localId, "New conversation");
    this.conversations.update((state) => [conversation, ...state]);
    this.activeConversationId.set(localId);
    this.promptDraft.update((state) => ({ ...state, prompt: "" }));
    this.activeWorkflow.set(null);
    this.activeOrderWorkflow.set(null);
    this.closeHistory();
  }

  updateDraft(prompt: string): void {
    this.promptDraft.update((state) => ({ ...state, prompt }));
  }

  showQuickActions(): void {
    const conversationId = this.activeConversationId();
    if (!conversationId) {
      return;
    }

    this.setWelcomeActions(conversationId, true);
  }

  updateWorkflowInput(value: string): void {
    const workflow = this.activeWorkflow();
    if (!workflow) {
      return;
    }

    const field = workflow.fields[workflow.stepIndex];
    if (!field) {
      return;
    }

    this.activeWorkflow.set({
      ...workflow,
      values: {
        ...workflow.values,
        [field.key]: value,
      },
      error: null,
    });
  }

  continueWorkflow(): void {
    const workflow = this.activeWorkflow();
    if (!workflow) {
      return;
    }

    const field = workflow.fields[workflow.stepIndex];
    if (!field) {
      return;
    }

    const value = (workflow.values[field.key] ?? "").trim();
    if (!field.optional && !value) {
      this.activeWorkflow.set({
        ...workflow,
        error: `${field.label} is required.`,
      });
      return;
    }

    if (workflow.stepIndex + 1 < workflow.fields.length) {
      this.activeWorkflow.set({
        ...workflow,
        stepIndex: workflow.stepIndex + 1,
        error: null,
      });
      return;
    }

    const prompt = this.buildWorkflowPrompt(workflow);
    this.activeWorkflow.set(null);
    this.activeOrderWorkflow.set(null);
    void this.submitPrompt(prompt);
  }

  cancelWorkflow(): void {
    this.activeWorkflow.set(null);
    this.activeOrderWorkflow.set(null);
  }

  updateOrderWorkflowInput(value: string): void {
    const workflow = this.activeOrderWorkflow();
    if (!workflow) {
      return;
    }

    this.activeOrderWorkflow.set({
      ...workflow,
      input: value,
      error: null,
    });
  }

  continueOrderWorkflow(): void {
    const workflow = this.activeOrderWorkflow();
    if (!workflow) {
      return;
    }

    if (workflow.mode === "create") {
      this.continueCreateOrderWorkflow(workflow);
      return;
    }

    this.continueUpdateOrderWorkflow(workflow);
  }

  pickOrderWorkflowCandidate(id: string): void {
    const workflow = this.activeOrderWorkflow();
    if (!workflow) {
      return;
    }

    this.activeOrderWorkflow.set({
      ...workflow,
      input: id,
      error: null,
    });
    this.continueOrderWorkflow();
  }

  setOrderWorkflowBillTo(target: "doctor" | "scan-center"): void {
    const workflow = this.activeOrderWorkflow();
    if (!workflow) {
      return;
    }

    if (workflow.mode === "create" && workflow.create) {
      this.activeOrderWorkflow.set({
        ...workflow,
        create: {
          ...workflow.create,
          billToTarget: target,
        },
      });
      return;
    }

    if (workflow.mode === "update" && workflow.update) {
      this.activeOrderWorkflow.set({
        ...workflow,
        update: {
          ...workflow.update,
          billToTarget: target,
        },
      });
    }
  }

  toggleOrderWorkflowService(serviceId: string): void {
    const workflow = this.activeOrderWorkflow();
    if (!workflow) {
      return;
    }

    if (workflow.mode === "create" && workflow.create) {
      const selected = workflow.create.selectedServiceIds.includes(serviceId)
        ? workflow.create.selectedServiceIds.filter((id) => id !== serviceId)
        : [...workflow.create.selectedServiceIds, serviceId];
      this.activeOrderWorkflow.set({
        ...workflow,
        create: { ...workflow.create, selectedServiceIds: selected },
        error: null,
      });
      return;
    }

    if (workflow.mode === "update" && workflow.update) {
      const selected = workflow.update.selectedServiceIds.includes(serviceId)
        ? workflow.update.selectedServiceIds.filter((id) => id !== serviceId)
        : [...workflow.update.selectedServiceIds, serviceId];
      this.activeOrderWorkflow.set({
        ...workflow,
        update: { ...workflow.update, selectedServiceIds: selected },
        error: null,
      });
    }
  }

  toggleOrderWorkflowTooth(tooth: number): void {
    const workflow = this.activeOrderWorkflow();
    if (!workflow) {
      return;
    }

    const toggle = (values: number[]) =>
      values.includes(tooth) ? values.filter((value) => value !== tooth) : [...values, tooth];

    if (workflow.mode === "create" && workflow.create) {
      this.activeOrderWorkflow.set({
        ...workflow,
        create: { ...workflow.create, selectedTeeth: toggle(workflow.create.selectedTeeth) },
        error: null,
      });
      return;
    }

    if (workflow.mode === "update" && workflow.update) {
      this.activeOrderWorkflow.set({
        ...workflow,
        update: { ...workflow.update, selectedTeeth: toggle(workflow.update.selectedTeeth) },
        error: null,
      });
    }
  }

  updateOrderWorkflowNotes(value: string): void {
    const workflow = this.activeOrderWorkflow();
    if (!workflow || workflow.mode !== "update" || !workflow.update) {
      return;
    }

    this.activeOrderWorkflow.set({
      ...workflow,
      update: { ...workflow.update, notes: value },
      error: null,
    });
  }

  submitOrderWorkflow(): void {
    const workflow = this.activeOrderWorkflow();
    if (!workflow) {
      return;
    }

    if (workflow.mode === "create") {
      const prompt = this.buildCreateOrderWorkflowPrompt(workflow);
      this.activeOrderWorkflow.set(null);
      void this.submitPrompt(prompt);
      return;
    }

    const prompt = this.buildUpdateOrderWorkflowPrompt(workflow);
    this.activeOrderWorkflow.set(null);
    void this.submitPrompt(prompt);
  }

  async submitPrompt(rawPrompt?: string): Promise<void> {
    const prompt = (rawPrompt ?? this.promptDraft().prompt).trim();
    const conversationId = this.activeConversationId();
    if (!prompt || !conversationId || this.isResponding()) {
      return;
    }

    this.promptDraft.update((state) => ({ ...state, prompt: "" }));
    this.activeWorkflow.set(null);
    this.activeOrderWorkflow.set(null);
    this.setWelcomeActions(conversationId, false);
    this.appendMessage(conversationId, {
      id: this.nextMessageId(),
      role: "user",
      text: prompt,
      createdAt: new Date().toISOString(),
      type: "text",
    });

    if (isShowQuickActionsCommand(prompt)) {
      this.setWelcomeActions(conversationId, true);
      this.appendAssistantText("Quick actions are shown again.");
      return;
    }

    const loadingMessageId = this.nextMessageId();
    this.appendMessage(conversationId, {
      id: loadingMessageId,
      role: "thinking",
      text: "Thinking through your request...",
      createdAt: new Date().toISOString(),
      type: "loading",
    });

    this.refreshConversationTitle(conversationId, prompt);
    const generation = this.sessionGeneration;
    this.isResponding.set(true);
    try {
      const response = await this.postMessageWithConversationRecovery(conversationId, prompt);
      if (generation !== this.sessionGeneration) {
        return;
      }
      this.replaceMessage(
        conversationId,
        loadingMessageId,
        this.toAssistantMessage(response),
      );
      this.touchConversation(conversationId);
    } catch (error) {
      if (generation !== this.sessionGeneration) {
        return;
      }
      this.replaceMessage(conversationId, loadingMessageId, {
        id: this.nextMessageId(),
        role: "assistant",
        text: this.resolveAssistantErrorText(error),
        createdAt: new Date().toISOString(),
        type: "error",
        markdown: true,
        canCopy: true,
      });
    } finally {
      if (generation === this.sessionGeneration) {
        this.isResponding.set(false);
      }
    }
  }

  runQuickAction(action: AiQuickAction): void {
    if (!this.isQuickActionVisible(action)) {
      this.appendAssistantText(
        "You don't have access for that action in this account.",
        "error",
      );
      return;
    }

    const conversationId = this.activeConversationId();
    if (conversationId) {
      this.setWelcomeActions(conversationId, false);
    }

    if (isOrderWorkflowAction(action.id)) {
      this.startOrderWorkflow(action);
      return;
    }

    if (action.category === "operational" && action.behavior === "send") {
      this.startWorkflow(action);
      return;
    }

    if (action.behavior === "navigate") {
      if (action.route) {
        this.navigationService.navigate(action.route);
      }
      return;
    }

    if (action.behavior === "prefill") {
      this.updateDraft(action.prefillPrompt);
      return;
    }

    void this.submitPrompt(action.prefillPrompt);
  }

  runShortcutAction(action: AiShortcutAction): void {
    if (action.confirmation) {
      void this.confirmPendingAction(action.confirmation.actionId, action.confirmation.confirmationToken);
      return;
    }

    if (action.intent === "openOrderDetails" && action.orderId) {
      this.navigationService.navigate("viewOrder", { orderId: action.orderId });
      return;
    }

    const mapped = AI_QUICK_ACTIONS.find((item) => item.intent === action.intent);
    if (mapped) {
      this.runQuickAction(mapped);
    }
  }

  resolveCopyMessage(messageId: string): string | null {
    const message = this.messages().find((candidate) => candidate.id === messageId);
    if (!message || !message.canCopy) {
      return null;
    }
    return message.text;
  }

  private onSessionChanged(userId: string | null): void {
    if (userId === this.currentUserId) {
      return;
    }

    this.currentUserId = userId;
    this.resetState();
    if (userId) {
      void this.bootstrap(this.sessionGeneration);
    }
  }

  private resetState(): void {
    this.sessionGeneration += 1;
    this.backendConversationByLocalId.clear();
    this.backendAllowedSuggestionIds = new Set<string>();
    this.messageSequence = 0;
    this.localConversationSequence = 0;
    this.conversations.set([]);
    this.activeConversationId.set(null);
    this.promptDraft.set({ search: "", prompt: "" });
    this.historyOpen.set(false);
    this.isResponding.set(false);
  }

  private async bootstrap(generation: number): Promise<void> {
    let summaries: AssistantConversationSummaryDto[] = [];
    try {
      const [suggestions, loaded] = await Promise.all([
        firstValueFrom(this.assistantDataService.getSuggestions$()),
        firstValueFrom(this.assistantDataService.listConversations$()),
      ]);
      if (generation !== this.sessionGeneration) {
        return;
      }
      this.backendAllowedSuggestionIds = new Set(
        suggestions.filter((item) => item.enabled).map((item) => item.id),
      );
      summaries = loaded;
    } catch {
      if (generation !== this.sessionGeneration) {
        return;
      }
      summaries = [];
    }

    if (summaries.length === 0) {
      const localId = this.nextLocalConversationId();
      const conversation = this.createConversationShell(localId, "New conversation");
      this.conversations.set([conversation]);
      this.activeConversationId.set(localId);
      return;
    }

    const conversations = summaries.map((summary) =>
      this.createConversationShell(summary.id, summary.title, {
        showWelcomeActions: false,
        updatedAt: summary.updatedAt,
      }),
    );
    for (const summary of summaries) {
      this.backendConversationByLocalId.set(summary.id, summary.id);
    }

    const localId = this.nextLocalConversationId();
    const freshConversation = this.createConversationShell(localId, "New conversation");
    this.conversations.set([freshConversation, ...conversations]);
    this.activeConversationId.set(localId);
  }

  private createConversationShell(
    id: string,
    title: string,
    options?: { showWelcomeActions?: boolean; updatedAt?: string },
  ): AiConversation {
    const now = options?.updatedAt ?? new Date().toISOString();
    const showWelcomeActions = options?.showWelcomeActions ?? true;
    return {
      id,
      title: title || "New conversation",
      updatedAt: now,
      showWelcomeActions,
      messages: showWelcomeActions
        ? [
            {
              id: this.nextMessageId(),
              role: "assistant",
              text: AI_WELCOME_MESSAGE,
              createdAt: now,
              type: "text",
              markdown: false,
              canCopy: false,
            },
          ]
        : [],
    };
  }

  private appendMessage(conversationId: string, message: AiChatMessage): void {
    this.conversations.update((state) =>
      state.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              messages: [...conversation.messages, message],
              updatedAt: message.createdAt,
            }
          : conversation,
      ),
    );
  }

  private replaceMessage(
    conversationId: string,
    oldMessageId: string,
    nextMessage: AiChatMessage,
  ): void {
    this.conversations.update((state) =>
      state.map((conversation) => {
        if (conversation.id !== conversationId) {
          return conversation;
        }
        return {
          ...conversation,
          messages: conversation.messages.map((item) =>
            item.id === oldMessageId ? nextMessage : item,
          ),
          updatedAt: nextMessage.createdAt,
        };
      }),
    );
  }

  private appendAssistantText(
    text: string,
    type: AiChatMessage["type"] = "text",
  ): void {
    const conversationId = this.activeConversationId();
    if (!conversationId) {
      return;
    }
    this.appendMessage(conversationId, {
      id: this.nextMessageId(),
      role: "assistant",
      text,
      createdAt: new Date().toISOString(),
      type,
      markdown: true,
      canCopy: true,
    });
  }

  private setWelcomeActions(conversationId: string, showWelcomeActions: boolean): void {
    this.conversations.update((state) =>
      state.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, showWelcomeActions }
          : conversation,
      ),
    );
  }

  private refreshConversationTitle(conversationId: string, prompt: string): void {
    this.conversations.update((state) =>
      state.map((conversation) => {
        if (conversation.id !== conversationId || conversation.title !== "New conversation") {
          return conversation;
        }
        return {
          ...conversation,
          title: deriveConversationTitle(prompt),
        };
      }),
    );
  }

  private touchConversation(conversationId: string): void {
    this.conversations.update((state) => {
      const current = state.find((conversation) => conversation.id === conversationId);
      if (!current) {
        return state;
      }
      const others = state.filter((conversation) => conversation.id !== conversationId);
      return [current, ...others];
    });
  }

  private nextMessageId(): string {
    this.messageSequence += 1;
    return `msg-${this.messageSequence}`;
  }

  private nextLocalConversationId(): string {
    this.localConversationSequence += 1;
    return `local-conv-${this.localConversationSequence}`;
  }

  private async ensureBackendConversationId(localConversationId: string): Promise<string> {
    const existing = this.backendConversationByLocalId.get(localConversationId);
    if (existing) {
      return existing;
    }

    const title = this.activeConversation()?.title;
    const created = await firstValueFrom(
      this.assistantDataService.createConversation$(title),
    );
    this.backendConversationByLocalId.set(localConversationId, created.id);
    return created.id;
  }

  private async postMessageWithConversationRecovery(
    localConversationId: string,
    prompt: string,
  ): Promise<AssistantMessageResponseDto> {
    const backendConversationId = await this.ensureBackendConversationId(localConversationId);
    try {
      return await firstValueFrom(
        this.assistantDataService.postMessage$(backendConversationId, prompt),
      );
    } catch (error) {
      if (!this.isConversationNotFoundError(error)) {
        throw error;
      }

      this.backendConversationByLocalId.delete(localConversationId);
      const recreatedConversationId =
        await this.ensureBackendConversationId(localConversationId);
      return firstValueFrom(
        this.assistantDataService.postMessage$(recreatedConversationId, prompt),
      );
    }
  }

  private toAssistantMessage(response: AssistantMessageResponseDto): AiChatMessage {
    if (response.result.type === "confirmation") {
      const pendingActions = response.result.pendingActions;
      const actions: AiShortcutAction[] = pendingActions.map((item) => ({
        id: `confirm-${item.actionId}`,
        title: `Confirm ${item.tool}`,
        intent: "updateOrder",
        description: `Confirm pending action for ${item.tool}`,
        badge: "Confirm",
        confirmation: {
          actionId: item.actionId,
          confirmationToken: item.confirmationToken,
          tool: item.tool,
        },
      }));
      return {
        id: this.nextMessageId(),
        role: "assistant",
        text: response.result.text,
        createdAt: new Date().toISOString(),
        type: "confirmation",
        markdown: true,
        canCopy: true,
        actions,
      };
    }

    return {
      id: this.nextMessageId(),
      role: "assistant",
      text: response.result.text,
      createdAt: new Date().toISOString(),
      type: "text",
      markdown: true,
      canCopy: true,
      actions: this.buildShortcutActionsFromExecutions(response),
    };
  }

  private buildShortcutActionsFromExecutions(
    response: AssistantMessageResponseDto,
  ): AiShortcutAction[] {
    if (response.result.type !== "text") {
      return [];
    }

    const actions: AiShortcutAction[] = [];
    for (const execution of response.result.executions) {
      if (
        execution.status !== "executed" ||
        execution.tool !== "search_orders" ||
        !execution.result ||
        typeof execution.result !== "object"
      ) {
        continue;
      }

      const result = execution.result as {
        items?: Array<{ id?: string; orderNumber?: string; patientName?: string }>;
      };
      for (const item of result.items ?? []) {
        if (!item.id) {
          continue;
        }
        actions.push({
          id: `open-order-${item.id}`,
          title: item.orderNumber ? `Open ${item.orderNumber}` : "Open order",
          intent: "openOrderDetails",
          description: item.patientName
            ? `Open order details for ${item.patientName}`
            : "Open order details",
          badge: "Open",
          orderId: item.id,
        });
      }
    }

    return actions.slice(0, 8);
  }

  private async confirmPendingAction(
    actionId: string,
    confirmationToken: string,
  ): Promise<void> {
    const conversationId = this.activeConversationId();
    if (!conversationId || this.isResponding()) {
      return;
    }

    const generation = this.sessionGeneration;
    this.isResponding.set(true);
    try {
      const result = await firstValueFrom(
        this.assistantDataService.confirmAction$(actionId, confirmationToken),
      );
      if (generation !== this.sessionGeneration) {
        return;
      }
      this.appendConfirmationResultMessage(conversationId, result);
      this.touchConversation(conversationId);
      await this.loadConversationMessages(conversationId);
    } catch (error) {
      if (generation === this.sessionGeneration) {
        this.appendAssistantText(this.resolveAssistantErrorText(error), "error");
      }
    } finally {
      if (generation === this.sessionGeneration) {
        this.isResponding.set(false);
      }
    }
  }

  private appendConfirmationResultMessage(
    conversationId: string,
    result: AssistantConfirmActionResponseDto,
  ): void {
    this.appendMessage(conversationId, {
      id: this.nextMessageId(),
      role: "assistant",
      text: result.message,
      createdAt: new Date().toISOString(),
      type: "confirmation",
      markdown: true,
      canCopy: true,
    });
  }

  private async loadConversationMessages(localConversationId: string): Promise<void> {
    const backendConversationId = this.backendConversationByLocalId.get(localConversationId);
    if (!backendConversationId) {
      return;
    }

    try {
      const loaded = await firstValueFrom(
        this.assistantDataService.getConversation$(backendConversationId),
      );
      const mappedMessages = loaded.messages.map((message) =>
        this.mapBackendMessageToUiMessage(message),
      );
      this.conversations.update((state) =>
        state.map((conversation) =>
          conversation.id === localConversationId
            ? {
                ...conversation,
                title: loaded.title || conversation.title,
                updatedAt: loaded.updatedAt,
                showWelcomeActions: false,
                messages: mappedMessages.length > 0 ? mappedMessages : conversation.messages,
              }
            : conversation,
        ),
      );
    } catch {
      return;
    }
  }

  private mapBackendMessageToUiMessage(
    message: AssistantConversationViewDto["messages"][number],
  ): AiChatMessage {
    return {
      id: this.nextMessageId(),
      role: message.role,
      text: message.text,
      createdAt: message.createdAt,
      type: message.resultType === "confirmation" ? "confirmation" : "text",
      markdown: message.role === "assistant",
      canCopy: message.role === "assistant",
    };
  }

  private resolveAssistantErrorText(error: unknown): string {
    const candidate = error as
      | {
          status?: number;
          error?: {
            error?: {
              code?: string;
              message?: string;
            };
          };
        }
      | undefined;
    const rawMessage = candidate?.error?.error?.message?.trim() ?? "";
    const message = rawMessage.toLowerCase();
    if (candidate?.status === 403 || message.includes("permission denied")) {
      return "You don't have access for that action in this account.";
    }

    if (candidate?.status === 409 || message.includes("expired")) {
      return "This pending action is no longer valid. Please send a new request.";
    }

    const backendCode = candidate?.error?.error?.code ?? "";
    if (
      rawMessage &&
      (candidate?.status === 400 ||
        backendCode === "BUSINESS_RULE_VIOLATION" ||
        backendCode === "VALIDATION_ERROR")
    ) {
      return rawMessage;
    }

    if (this.isConversationNotFoundError(error)) {
      return "This conversation is no longer available. Please try sending your message again.";
    }

    return "Assistant service is currently unavailable. Please try again.";
  }

  private isConversationNotFoundError(error: unknown): boolean {
    const candidate = error as
      | {
          status?: number;
          error?: {
            error?: {
              code?: string;
              message?: string;
            };
          };
        }
      | undefined;
    const status = candidate?.status;
    const code = candidate?.error?.error?.code ?? "";
    const message = candidate?.error?.error?.message?.toLowerCase() ?? "";
    return status === 404 || code === "ASSISTANT_CONVERSATION_NOT_FOUND" || message.includes("conversation");
  }

  private startWorkflow(action: AiQuickAction): void {
    const fields = getWorkflowFields(action.id);
    if (fields.length === 0) {
      void this.submitPrompt(action.prefillPrompt);
      return;
    }

    this.activeOrderWorkflow.set(null);
    this.activeWorkflow.set({
      action,
      fields,
      stepIndex: 0,
      values: {},
      error: null,
    });
    this.beginWorkflowChatTurn(action);
  }

  private buildWorkflowPrompt(workflow: AiActionWorkflowState): string {
    const lines = workflow.fields.map((field) => {
      const value = (workflow.values[field.key] ?? "").trim();
      return `- ${field.label}: ${value || "(not provided)"}`;
    });

    const guardrails = getWorkflowGuardrails(workflow.action.id);
    const guardrailBlock = guardrails.length ? `\n\n${guardrails.join("\n")}` : "";
    return `${workflow.action.prefillPrompt}${guardrailBlock}\n\nUse the following user-provided values:\n${lines.join("\n")}\n\nProceed with this request now.`;
  }

  private startOrderWorkflow(action: AiQuickAction): void {
    this.activeWorkflow.set(null);
    this.activeOrderWorkflow.set(
      action.id === "ops-update-order"
        ? buildInitialUpdateOrderWorkflow()
        : buildInitialCreateOrderWorkflow(),
    );
    this.beginWorkflowChatTurn(action);
  }

  private beginWorkflowChatTurn(action: AiQuickAction): void {
    const conversationId = this.activeConversationId();
    if (!conversationId) {
      return;
    }

    this.appendMessage(conversationId, {
      id: this.nextMessageId(),
      role: "user",
      text: action.title,
      createdAt: new Date().toISOString(),
      type: "text",
    });
    this.appendAssistantText(
      `Let's complete ${action.title} step by step.`,
    );
  }

  private continueCreateOrderWorkflow(workflow: AiOrderWorkflowState): void {
    const create = workflow.create;
    if (!create) {
      return;
    }

    const inputValue = workflow.input.trim();
    if (workflow.step === "patient") {
      const patientReference = inputValue || create.patientReference.trim();
      if (!patientReference) {
        this.setOrderWorkflowError("Patient name or ID is required.");
        return;
      }
      const candidates = this.findPatientCandidates(patientReference);
      if (candidates.length > 1) {
        this.activeOrderWorkflow.set({
          ...workflow,
          input: patientReference,
          notice: "Multiple patients match this value. Pick one patient to continue.",
          create: {
            ...create,
            patientCandidates: candidates,
          },
          error: null,
        });
        return;
      }

      const [patient] = candidates;
      if (!patient) {
        this.setOrderWorkflowError("No matching patient found. Enter a valid patient name or ID.");
        return;
      }
      const doctor = this.findDoctorById(patient.doctorId);
      const clinic = this.findClinicById(patient.clinicId);
      const hasLinkedDoctor = patient.doctorId.trim().length > 0;
      const hasLinkedClinic = patient.clinicId.trim().length > 0;
      this.activeOrderWorkflow.set({
        ...workflow,
        step: hasLinkedDoctor ? (hasLinkedClinic ? "billTo" : "clinic") : "doctor",
        input: "",
        notice:
          hasLinkedDoctor && hasLinkedClinic
            ? "Doctor and clinic were auto-selected from the patient profile."
            : null,
        create: {
          ...create,
          patient,
          doctor: doctor ?? create.doctor,
          clinic: clinic ?? create.clinic,
          patientReference: patient.id,
          doctorReference: patient.doctorId || create.doctorReference,
          clinicReference: patient.clinicId || create.clinicReference,
          patientCandidates: [],
          doctorCandidates: [],
          clinicCandidates: [],
        },
        error: null,
      });
      return;
    }

    if (workflow.step === "doctor") {
      const doctorReference = inputValue || create.doctorReference.trim();
      if (!doctorReference) {
        this.setOrderWorkflowError("Doctor name or ID is required.");
        return;
      }
      const candidates = this.findDoctorCandidates(
        doctorReference,
        create.patient?.clinicId ?? null,
      );
      if (candidates.length > 1) {
        this.activeOrderWorkflow.set({
          ...workflow,
          input: doctorReference,
          notice: "Multiple doctors match this value. Pick one doctor to continue.",
          create: {
            ...create,
            doctorCandidates: candidates,
          },
          error: null,
        });
        return;
      }
      const [doctor] = candidates;
      if (!doctor) {
        this.activeOrderWorkflow.set({
          ...workflow,
          step: "clinic",
          input: "",
          notice: null,
          create: {
            ...create,
            doctorReference,
            doctorCandidates: [],
          },
          error: null,
        });
        return;
      }
      const clinic = this.findClinicById(doctor.clinicId);
      this.activeOrderWorkflow.set({
        ...workflow,
        step: doctor.clinicId.trim().length > 0 ? "billTo" : "clinic",
        input: "",
        notice:
          doctor.clinicId.trim().length > 0
            ? "Clinic was auto-selected from the doctor profile."
            : null,
        create: {
          ...create,
          doctor,
          clinic: clinic ?? create.clinic,
          doctorReference: doctor.id,
          clinicReference: doctor.clinicId || create.clinicReference,
          doctorCandidates: [],
          clinicCandidates: [],
        },
        error: null,
      });
      return;
    }

    if (workflow.step === "clinic") {
      const clinicReference = inputValue || create.clinicReference.trim();
      if (!clinicReference) {
        this.setOrderWorkflowError("Clinic name or ID is required.");
        return;
      }
      const candidates = this.findClinicCandidates(clinicReference);
      if (candidates.length > 1) {
        this.activeOrderWorkflow.set({
          ...workflow,
          input: clinicReference,
          notice: "Multiple clinics match this value. Pick one clinic to continue.",
          create: {
            ...create,
            clinicCandidates: candidates,
          },
          error: null,
        });
        return;
      }
      const [clinic] = candidates;
      if (!clinic) {
        this.activeOrderWorkflow.set({
          ...workflow,
          step: "billTo",
          input: "",
          notice: null,
          create: {
            ...create,
            clinicReference,
            clinicCandidates: [],
          },
          error: null,
        });
        return;
      }
      this.activeOrderWorkflow.set({
        ...workflow,
        step: "billTo",
        input: "",
        notice: null,
        create: {
          ...create,
          clinic,
          clinicReference: clinic.id,
          clinicCandidates: [],
        },
        error: null,
      });
      return;
    }

    if (workflow.step === "billTo") {
      this.activeOrderWorkflow.set({ ...workflow, step: "services", input: "", error: null });
      return;
    }

    if (workflow.step === "services") {
      if (create.selectedServiceIds.length === 0) {
        this.setOrderWorkflowError("Please select at least one service.");
        return;
      }
      this.activeOrderWorkflow.set({ ...workflow, step: "teeth", input: "", error: null });
      return;
    }

    if (workflow.step === "teeth") {
      if (create.selectedTeeth.length === 0) {
        this.setOrderWorkflowError("Please select at least one tooth.");
        return;
      }
      this.activeOrderWorkflow.set({ ...workflow, step: "review", input: "", error: null });
    }
  }

  private continueUpdateOrderWorkflow(workflow: AiOrderWorkflowState): void {
    const update = workflow.update;
    if (!update) {
      return;
    }

    if (workflow.step === "lookupOrder") {
      const orderReference = workflow.input.trim();
      if (!orderReference) {
        this.setOrderWorkflowError("Order ID or number is required.");
        return;
      }
      this.activeOrderWorkflow.set({
        ...workflow,
        step: "editOrder",
        input: "",
        notice: null,
        update: {
          ...update,
          orderReference,
        },
        error: null,
      });
      return;
    }

    if (workflow.step === "editOrder") {
      const hasChanges =
        update.selectedServiceIds.length > 0 ||
        update.selectedTeeth.length > 0 ||
        update.notes.trim().length > 0;
      if (!hasChanges) {
        this.setOrderWorkflowError("Please provide at least one update.");
        return;
      }
      this.activeOrderWorkflow.set({ ...workflow, step: "reviewUpdate", input: "", error: null });
    }
  }

  private setOrderWorkflowError(message: string): void {
    const workflow = this.activeOrderWorkflow();
    if (!workflow) {
      return;
    }

    this.activeOrderWorkflow.set({
      ...workflow,
      error: message,
    });
  }

  private buildCreateOrderWorkflowPrompt(workflow: AiOrderWorkflowState): string {
    const create = workflow.create;
    if (!create) {
      return "Create order";
    }

    const selectedServices = create.selectedServiceIds
      .map((id) => {
        const service = workflow.services.find((item) => item.id === id);
        return {
          id,
          name: service?.name ?? id,
        };
      });
    const serviceNames = selectedServices
      .map((service) => `${service.name} [${service.id}]`)
      .join(", ");
    const patient = create.patient?.name || create.patientReference || "(missing)";
    const doctor =
      create.doctor?.name ||
      create.patient?.doctorName ||
      create.doctorReference ||
      "(missing)";
    const clinic =
      create.clinic?.name ||
      create.doctor?.clinicName ||
      create.patient?.clinicName ||
      create.clinicReference ||
      "(missing)";
    return [
      "Create order using assistant tools.",
      "MANDATORY: MUST include a create_order action in this same response.",
      "Resolve patient/doctor/clinic to IDs first if needed, then include create_order payload.",
      "Do not return search result lists when creating this order.",
      "If multiple patients share the same name, select the one matching both doctor and clinic from this request.",
      "Only ask for clarification when no single patient matches doctor+clinic.",
      "Backend confirmation is required automatically for write actions.",
      `Patient: ${patient}`,
      `Doctor: ${doctor}`,
      `Clinic: ${clinic}`,
      `Bill to target: ${create.billToTarget}`,
      `Services: ${serviceNames}`,
      `Selected teeth: ${create.selectedTeeth.join(", ")}`,
      "For creationData.services, each creationData.services item must include serviceId and selectedTeeth.",
      "Use this item shape: {\"serviceId\":\"<service-id>\",\"selectedTeeth\":[...]}",
      "Use backend-compatible create_order payload and include creationData.services from selected services and teeth.",
    ].join("\n");
  }

  private buildUpdateOrderWorkflowPrompt(workflow: AiOrderWorkflowState): string {
    const update = workflow.update;
    if (!update) {
      return "Update order";
    }

    const serviceNames = update.selectedServiceIds
      .map((id) => workflow.services.find((service) => service.id === id)?.name ?? id)
      .join(", ");
    return [
      "Update order using assistant tools.",
      "MANDATORY: MUST include an update_order action in this same response.",
      "Resolve order reference to orderId if needed, then include update_order payload with changed fields.",
      "Backend confirmation is required automatically for write actions.",
      `Order reference: ${update.orderReference || "(missing)"}`,
      `Updated services: ${serviceNames || "(unchanged)"}`,
      `Updated teeth: ${update.selectedTeeth.length ? update.selectedTeeth.join(", ") : "(unchanged)"}`,
      `Bill to target: ${update.billToTarget}`,
      `Notes update: ${update.notes || "(none)"}`,
      "Use backend-compatible update_order payload with changed fields only.",
    ].join("\n");
  }

  private findPatientCandidates(reference: string): Patient[] {
    const normalized = normalizeLookup(reference);
    if (!normalized) {
      return [];
    }
    const patients = this.patientDataService.patients();
    const byId = patients.filter((item) => normalizeLookup(item.id) === normalized);
    if (byId.length > 0) {
      return byId;
    }
    const byExactName = patients.filter((item) => normalizeLookup(item.name) === normalized);
    if (byExactName.length > 0) {
      return byExactName;
    }
    return patients.filter((item) => normalizeLookup(item.name).includes(normalized));
  }

  private findDoctorCandidates(reference: string, clinicId: string | null): Doctor[] {
    const normalized = normalizeLookup(reference);
    if (!normalized) {
      return [];
    }
    const doctors = this.doctorDataService.doctors();
    const filterByClinic =
      clinicId && clinicId.trim().length > 0
        ? (items: Doctor[]) => items.filter((item) => item.clinicId === clinicId)
        : (items: Doctor[]) => items;
    const byId = filterByClinic(
      doctors.filter((item) => normalizeLookup(item.id) === normalized),
    );
    if (byId.length > 0) {
      return byId;
    }
    const byExactName = filterByClinic(
      doctors.filter((item) => normalizeLookup(item.name) === normalized),
    );
    if (byExactName.length > 0) {
      return byExactName;
    }
    return filterByClinic(
      doctors.filter(
        (item) =>
          normalizeLookup(item.name).includes(normalized) ||
          normalizeLookup(item.lookupId ?? "").includes(normalized),
      ),
    );
  }

  private findClinicCandidates(reference: string): Clinic[] {
    const normalized = normalizeLookup(reference);
    if (!normalized) {
      return [];
    }
    const clinics = this.clinicDataService.clinics();
    const byId = clinics.filter((item) => normalizeLookup(item.id) === normalized);
    if (byId.length > 0) {
      return byId;
    }
    const byExactName = clinics.filter((item) => normalizeLookup(item.name) === normalized);
    if (byExactName.length > 0) {
      return byExactName;
    }
    return clinics.filter(
      (item) =>
        normalizeLookup(item.name).includes(normalized) ||
        normalizeLookup(item.city).includes(normalized),
    );
  }

  private findDoctorById(doctorId: string): Doctor | null {
    if (!doctorId.trim()) {
      return null;
    }
    return this.doctorDataService.doctors().find((item) => item.id === doctorId) ?? null;
  }

  private findClinicById(clinicId: string): Clinic | null {
    if (!clinicId.trim()) {
      return null;
    }
    return this.clinicDataService.clinics().find((item) => item.id === clinicId) ?? null;
  }

  private isQuickActionVisible(action: AiQuickAction): boolean {
    if (
      action.requiredCapability &&
      !this.authorizationService.has(action.requiredCapability as DentalCapability)
    ) {
      return false;
    }

    if (action.category === "faq") {
      return true;
    }

    const suggestionId = mapQuickActionToSuggestionId(action.id);
    if (!suggestionId) {
      return true;
    }

    return this.backendAllowedSuggestionIds.has(suggestionId);
  }
}

function normalizeLookup(value: string): string {
  return value.trim().toLowerCase();
}

function mapQuickActionToSuggestionId(actionId: string): string | null {
  switch (actionId) {
    case "ops-search-orders":
      return "assistant-search-orders";
    case "ops-create-order":
      return "assistant-create-order";
    case "ops-search-patients":
      return "assistant-search-patients";
    case "faq-about-company":
      return "assistant-about-company";
    case "faq-services":
      return "assistant-services";
    case "faq-pricing":
      return "assistant-pricing";
    case "faq-submission-standards":
      return "assistant-submission-standards";
    default:
      return null;
  }
}

function getWorkflowFields(actionId: string): readonly AiActionWorkflowField[] {
  switch (actionId) {
    case "ops-search-orders":
      return [
        {
          key: "query",
          label: "Order lookup value",
          placeholder: "Patient name, order number, or doctor name",
        },
      ];
    case "ops-create-order":
      return [
        { key: "patient", label: "Patient name or ID", placeholder: "Enter patient" },
        { key: "doctor", label: "Doctor name or ID", placeholder: "Enter doctor" },
        { key: "clinic", label: "Clinic name or ID", placeholder: "Enter clinic" },
        { key: "notes", label: "Order notes", placeholder: "Optional notes", optional: true },
      ];
    case "ops-update-order":
      return [
        { key: "order", label: "Order ID or number", placeholder: "Enter order id/number" },
        {
          key: "changes",
          label: "Required updates",
          placeholder: "Describe fields to update",
        },
      ];
    case "ops-search-patients":
      return [{ key: "query", label: "Patient search value", placeholder: "Name, phone, or ID" }];
    case "ops-create-patient":
      return [
        { key: "name", label: "Patient full name", placeholder: "Enter patient name" },
        { key: "dob", label: "Date of birth (YYYY-MM-DD)", placeholder: "e.g. 1999-01-01" },
        { key: "gender", label: "Gender (M/F)", placeholder: "M or F" },
        { key: "phone", label: "Patient phone", placeholder: "Enter phone number" },
        { key: "email", label: "Patient email", placeholder: "Enter email" },
        { key: "clinic", label: "Clinic name or ID", placeholder: "Enter clinic name or id" },
        { key: "doctor", label: "Doctor name or ID", placeholder: "Enter doctor name or id" },
      ];
    case "ops-update-patient":
      return [
        { key: "patient", label: "Patient ID", placeholder: "Enter patient id" },
        { key: "changes", label: "Required updates", placeholder: "Describe updates" },
      ];
    case "ops-search-doctors":
      return [{ key: "query", label: "Doctor search value", placeholder: "Name or specialty" }];
    case "ops-create-doctor":
      return [
        { key: "name", label: "Doctor name", placeholder: "Enter doctor name" },
        { key: "specialty", label: "Specialty", placeholder: "Enter specialty" },
        { key: "clinic", label: "Clinic", placeholder: "Enter clinic id/name" },
      ];
    case "ops-update-doctor":
      return [
        { key: "doctor", label: "Doctor ID", placeholder: "Enter doctor id" },
        { key: "changes", label: "Required updates", placeholder: "Describe updates" },
      ];
    case "ops-search-clinics":
      return [{ key: "query", label: "Clinic search value", placeholder: "Name, city, or ID" }];
    case "ops-create-clinic":
      return [
        { key: "name", label: "Clinic name", placeholder: "Enter clinic name" },
        { key: "city", label: "City", placeholder: "Enter city" },
        { key: "phone", label: "Phone", placeholder: "Enter phone", optional: true },
      ];
    case "ops-update-clinic":
      return [
        { key: "clinic", label: "Clinic ID", placeholder: "Enter clinic id" },
        { key: "changes", label: "Required updates", placeholder: "Describe updates" },
      ];
    case "ops-search-cases":
      return [{ key: "query", label: "Case search value", placeholder: "Patient, order, or status" }];
    case "ops-change-workflow":
      return [
        { key: "order", label: "Order ID or number", placeholder: "Enter order id/number" },
        { key: "status", label: "New workflow status", placeholder: "e.g. In Production" },
      ];
    case "ops-change-scan-center":
      return [
        { key: "order", label: "Order ID or number", placeholder: "Enter order id/number" },
        { key: "scanCenter", label: "Scan center ID", placeholder: "Enter scan center id" },
      ];
    case "ops-change-settings":
      return [
        { key: "setting", label: "Setting key", placeholder: "e.g. theme" },
        { key: "value", label: "Setting value", placeholder: "e.g. dark" },
      ];
    case "ops-open-order-detail":
      return [
        {
          key: "orderLookup",
          label: "Order lookup value",
          placeholder: "Order number, order id, or patient name",
        },
      ];
    default:
      return [];
  }
}

function getWorkflowGuardrails(actionId: string): readonly string[] {
  switch (actionId) {
    case "ops-create-patient":
      return [
        "MANDATORY: MUST include a create_patient action in this same response.",
        "Do not call catalog/company info tools for this request.",
      ];
    default:
      return [];
  }
}

function isOrderWorkflowAction(actionId: string): boolean {
  return (
    actionId === "ops-create-order" ||
    actionId === "ops-update-order" ||
    actionId === "ops-open-order-detail"
  );
}

function buildInitialCreateOrderWorkflow(): AiOrderWorkflowState {
  return {
    mode: "create",
    step: "patient",
    input: "",
    loading: false,
    error: null,
    notice: null,
    services: AVAILABLE_SERVICES,
    create: {
      patient: null,
      doctor: null,
      clinic: null,
      patientReference: "",
      doctorReference: "",
      clinicReference: "",
      billToTarget: "doctor",
      selectedServiceIds: [],
      selectedTeeth: [],
      patientCandidates: [],
      doctorCandidates: [],
      clinicCandidates: [],
    },
    update: null,
  };
}

function buildInitialUpdateOrderWorkflow(): AiOrderWorkflowState {
  return {
    mode: "update",
    step: "lookupOrder",
    input: "",
    loading: false,
    error: null,
    notice: null,
    services: AVAILABLE_SERVICES,
    create: null,
    update: {
      orderCandidates: [],
      selectedOrder: null,
      orderReference: "",
      baselineServiceIds: [],
      selectedServiceIds: [],
      baselineTeeth: [],
      selectedTeeth: [],
      notes: "",
      billToTarget: "doctor",
    },
  };
}

function deriveConversationTitle(prompt: string): string {
  const normalized = prompt.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "New conversation";
  }

  return normalized.length > 40 ? `${normalized.slice(0, 37)}...` : normalized;
}

function isShowQuickActionsCommand(prompt: string): boolean {
  return /(show quick actions|show shortcuts|quick actions)/i.test(prompt) ||
    /(اظهر|أظهر).*(الاختصارات|الكويك|الاكشنز)/i.test(prompt);
}
