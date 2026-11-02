import { computed, Injectable, inject, OnDestroy, signal } from "@angular/core";
import {
  AiChatMessage,
  AiConversation,
  AiConversationSummary,
  AiFaqTopic,
  AiPromptDraft,
  AiQuickAction,
  AiShortcutAction,
} from "@core/interfaces";
import {
  AssistantDataService,
  AssistantMessageResponseDto,
} from "@core/services/assistant-data.service";
import { AuthorizationService } from "@core/services/authorization.service";
import { NavigationService } from "@core/services/navigation.service";
import { DentalCapability } from "@core/security/capabilities";
import { firstValueFrom } from "rxjs";
import {
  AI_FAQ_PROMPTS,
  AI_QUICK_ACTIONS,
  AI_WELCOME_MESSAGE,
  createInitialConversations,
} from "../data/ai-chat.mock";

@Injectable({ providedIn: "root" })
export class AiChatFacade implements OnDestroy {
  private readonly authorizationService = inject(AuthorizationService);
  private readonly navigationService = inject(NavigationService);
  private readonly assistantDataService = inject(AssistantDataService);

  private conversationSequence = 0;
  private messageSequence = 0;
  private pendingReplyTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly backendConversationByLocalId = new Map<string, string>();

  private readonly initialConversation = this.createFreshConversation();

  readonly promptDraft = signal<AiPromptDraft>({
    search: "",
    prompt: "",
  });
  readonly isResponding = signal(false);
  readonly historyOpen = signal(false);
  readonly conversations = signal<AiConversation[]>([
    this.initialConversation,
    ...createInitialConversations(),
  ]);
  readonly activeConversationId = signal(this.initialConversation.id);

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
    AI_QUICK_ACTIONS.filter((action) => this.hasRequiredCapability(action)),
  );

  readonly isPromptValid = computed(
    () => this.promptDraft().prompt.trim().length > 0 && !this.isResponding(),
  );

  readonly canSend = computed(() => this.isPromptValid());

  ngOnDestroy(): void {
    this.clearPendingTimer();
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
    if (this.navigationService.isMobile()) {
      this.historyOpen.set(false);
    }
  }

  startNewChat(): void {
    const fresh = this.createFreshConversation();
    this.conversations.update((state) => [fresh, ...state]);
    this.backendConversationByLocalId.delete(fresh.id);
    this.activeConversationId.set(fresh.id);
    this.promptDraft.update((state) => ({ ...state, prompt: "" }));
    this.closeHistory();
  }

  clearCurrentConversation(): void {
    const activeId = this.activeConversationId();
    this.backendConversationByLocalId.delete(activeId);
    this.updateConversation(activeId, () => {
      const fresh = this.createFreshConversation(activeId);
      return {
        ...fresh,
        title: "New conversation",
      };
    });
    this.promptDraft.update((state) => ({ ...state, prompt: "" }));
  }

  updateDraft(prompt: string): void {
    this.promptDraft.update((state) => ({ ...state, prompt }));
  }

  async submitPrompt(rawPrompt?: string): Promise<void> {
    const prompt = (rawPrompt ?? this.promptDraft().prompt).trim();
    if (!prompt || this.isResponding()) {
      return;
    }

    const conversationId = this.activeConversationId();
    this.promptDraft.update((state) => ({ ...state, prompt: "" }));
    this.setWelcomeActions(conversationId, false);
    this.appendMessage(conversationId, {
      id: this.nextMessageId(),
      role: "user",
      text: prompt,
      createdAt: new Date().toISOString(),
      type: "text",
    });

    const thinkingId = this.nextMessageId();
    this.appendMessage(conversationId, {
      id: thinkingId,
      role: "thinking",
      text: "Thinking through your request...",
      createdAt: new Date().toISOString(),
      type: "loading",
    });

    this.refreshConversationTitle(conversationId, prompt);
    this.isResponding.set(true);
    try {
      const backendConversationId = await this.ensureBackendConversationId(
        conversationId,
      );
      const response = await firstValueFrom(
        this.assistantDataService.postMessage$(backendConversationId, prompt),
      );
      this.replaceMessage(
        conversationId,
        thinkingId,
        this.toAssistantMessage(response),
      );
    } catch {
      this.replaceMessage(conversationId, thinkingId, {
        id: this.nextMessageId(),
        role: "assistant",
        text: "Assistant service is currently unavailable. Please try again.",
        createdAt: new Date().toISOString(),
        type: "error",
        markdown: true,
        canCopy: true,
      });
    } finally {
      this.isResponding.set(false);
    }
  }

  runQuickAction(action: AiQuickAction): void {
    if (!this.hasRequiredCapability(action)) {
      this.appendAssistantText(
        "You don't have access for that action in this account.",
        "error",
      );
      return;
    }

    if (action.intent === "openReports") {
      this.navigationService.navigate("reports");
      this.appendAssistantText(
        "Opening Reports now. You can review throughput and trend details there.",
        "confirmation",
      );
      return;
    }

    if (action.intent === "openOrders" || action.intent === "searchOrders") {
      this.navigationService.navigate("orders");
      this.appendAssistantText(
        "Opening Orders now. You can apply search filters from the toolbar.",
        "confirmation",
      );
      return;
    }

    if (action.intent === "searchPatients") {
      this.navigationService.navigate("patients");
      this.appendAssistantText(
        "Opening Patients now. Use search to find matching records.",
        "confirmation",
      );
      return;
    }

    this.submitPrompt(action.prompt);
  }

  runShortcutAction(action: AiShortcutAction): void {
    const quickAction: AiQuickAction = {
      id: action.id,
      title: action.title,
      description: action.description ?? "",
      intent: action.intent,
      prompt: action.title,
    };
    this.runQuickAction(quickAction);
  }

  runFaq(topic: AiFaqTopic): void {
    this.submitPrompt(AI_FAQ_PROMPTS[topic]);
  }

  resolveCopyMessage(messageId: string): string | null {
    return (
      this.messages().find((message) => message.id === messageId && message.role === "assistant")
        ?.text ?? null
    );
  }

  private resolveAssistantReply(prompt: string): AiChatMessage {
    const lowered = prompt.toLowerCase();
    if (this.isDeleteIntent(lowered)) {
      return {
        id: this.nextMessageId(),
        role: "assistant",
        text:
          "I can't delete records from chat. If this order must be removed, ask a Director or Admin to open Orders, verify ownership, and run the approved deletion process with an audit note.",
        createdAt: new Date().toISOString(),
        type: "error",
        markdown: true,
        canCopy: true,
      };
    }

    const capabilityDenied = this.resolveCapabilityDenial(lowered);
    if (capabilityDenied) {
      return capabilityDenied;
    }

    if (this.matchesAny(lowered, ["service", "services"])) {
      const actions: AiShortcutAction[] = [];
      if (this.authorizationService.has("orders.read")) {
        actions.push({
          id: "open-orders",
          title: "Open Orders",
          description: "Go to active orders to start a case.",
          intent: "openOrders",
          badge: "Navigate",
        });
      }

      return {
        id: this.nextMessageId(),
        role: "assistant",
        text:
          "### Service catalog\n- Crowns and bridges\n- Veneers and esthetic restorations\n- Implant restorations\n- Aligner support workflows\n\nIf you want, I can open Orders now and prepare a draft request.",
        createdAt: new Date().toISOString(),
        type: "text",
        markdown: true,
        canCopy: true,
        resultCards: [
          {
            id: "service-card-restorative",
            title: "Restorative services",
            summary: "Crowns, bridges, and implant restorations are available.",
            details: "Suitable for most fixed prosthetic case requests.",
            tone: "info",
          },
          {
            id: "service-card-esthetic",
            title: "Esthetic services",
            summary: "Veneers and smile-design workflows are supported.",
            details: "Share target shade and prep notes for better planning.",
            tone: "success",
          },
        ],
        actions: actions.length > 0 ? actions : undefined,
      };
    }

    if (this.matchesAny(lowered, ["price", "pricing", "cost"])) {
      return {
        id: this.nextMessageId(),
        role: "assistant",
        text:
          "### Service pricing guide\n| Service | Price |\n|---|---|\n| Crown | 120 USD |\n| Bridge unit | 95 USD |\n| Veneer | 85 USD |\n| Implant abutment | 150 USD |\n\nPricing can vary by material, urgency, and insurance policy.",
        createdAt: new Date().toISOString(),
        type: "table",
        markdown: true,
        canCopy: true,
        resultCards: [
          {
            id: "pricing-card-base",
            title: "Base pricing",
            summary: "Use this as an estimate before case-level adjustments.",
            details: "Final quote is confirmed after material and timeline review.",
            tone: "info",
          },
        ],
      };
    }

    if (this.matchesAny(lowered, ["standard", "requirements", "submission"])) {
      return {
        id: this.nextMessageId(),
        role: "assistant",
        text:
          "### Submission standards checklist\n- Clear patient identifier\n- Restoration type\n- Due date\n- Shade and material\n- Scan quality check\n- Doctor approval notes before production",
        createdAt: new Date().toISOString(),
        type: "confirmation",
        markdown: true,
        canCopy: true,
        resultCards: [
          {
            id: "standards-card",
            title: "Before you submit",
            summary: "Confirm patient ID, restoration details, and due date first.",
            details: "Cases with full scan + doctor notes move faster to production.",
            tone: "warning",
          },
        ],
      };
    }

    if (this.matchesAny(lowered, ["company", "about", "who are you"])) {
      return {
        id: this.nextMessageId(),
        role: "assistant",
        text:
          "### About DentaLab\nDentaLab is the operational workspace for handling dental orders, clinical coordination, and performance tracking across teams.",
        createdAt: new Date().toISOString(),
        type: "text",
        markdown: true,
        canCopy: true,
        resultCards: [
          {
            id: "company-card",
            title: "What it helps with",
            summary: "Order tracking, reporting, and team workflow coordination.",
            details: "Designed for clinics, doctors, and lab operations teams.",
            tone: "info",
          },
        ],
      };
    }

    if (this.matchesAny(lowered, ["report", "performance", "analytics"])) {
      const actions: AiShortcutAction[] = [];
      if (this.authorizationService.has("reports.read")) {
        actions.push({
          id: "open-reports",
          title: "Open Reports",
          description: "View team and service metrics.",
          intent: "openReports",
          badge: "Navigate",
        });
      }

      return {
        id: this.nextMessageId(),
        role: "assistant",
        text:
          "### Performance support\nI can guide weekly and quarterly performance reviews.\nOpen Reports to inspect throughput, delays, and turnaround trends.",
        createdAt: new Date().toISOString(),
        type: "reportCard",
        markdown: true,
        canCopy: true,
        resultCards: [
          {
            id: "report-card",
            title: "Recommended review flow",
            summary: "Check throughput, delay reasons, and revenue trend in one pass.",
            details: "Start with weekly summary, then drill down by service line.",
            tone: "info",
          },
        ],
        actions: actions.length > 0 ? actions : undefined,
      };
    }

    return {
      id: this.nextMessageId(),
      role: "assistant",
      text:
        "I can help with service details, pricing, submission standards, order requests, and reporting guidance.\n\nTell me your exact task and I will format the answer step by step.",
      createdAt: new Date().toISOString(),
      type: "text",
      markdown: true,
      canCopy: true,
      resultCards: [
        {
          id: "fallback-services",
          title: "Services and pricing",
          summary: "Ask about available services or current pricing guidance.",
          tone: "info",
        },
        {
          id: "fallback-standards",
          title: "Submission standards",
          summary: "Get the full checklist before case submission.",
          tone: "success",
        },
      ],
      actions: this.availableFallbackActions(),
    };
  }

  private resolveCapabilityDenial(promptLowered: string): AiChatMessage | null {
    if (
      this.matchesAny(promptLowered, ["update", "edit"]) &&
      !this.authorizationService.has("orders.update")
    ) {
      return {
        id: this.nextMessageId(),
        role: "assistant",
        text:
          "You don't have access to update orders in this account. Please contact your manager to request the orders.update permission.",
        createdAt: new Date().toISOString(),
        type: "error",
        canCopy: true,
      };
    }

    if (
      this.matchesAny(promptLowered, ["create", "new order"]) &&
      !this.authorizationService.has("orders.create")
    ) {
      return {
        id: this.nextMessageId(),
        role: "assistant",
        text:
          "You don't have access to create orders in this account. Ask an Admin to grant orders.create access.",
        createdAt: new Date().toISOString(),
        type: "error",
        canCopy: true,
      };
    }

    if (
      this.matchesAny(promptLowered, ["report", "analytics"]) &&
      !this.authorizationService.has("reports.read")
    ) {
      return {
        id: this.nextMessageId(),
        role: "assistant",
        text:
          "You don't have access to reports in this account. A manager can grant reports.read permission.",
        createdAt: new Date().toISOString(),
        type: "error",
        canCopy: true,
      };
    }

    return null;
  }

  private isDeleteIntent(promptLowered: string): boolean {
    return this.matchesAny(promptLowered, [
      "delete",
      "remove",
      "archive",
      "archiving",
      "erase",
      "drop order",
      "cancel permanently",
    ]);
  }

  private matchesAny(input: string, terms: readonly string[]): boolean {
    return terms.some((term) => input.includes(term));
  }

  private nextConversationId(): string {
    this.conversationSequence += 1;
    return `conv-new-${this.conversationSequence}`;
  }

  private nextMessageId(): string {
    this.messageSequence += 1;
    return `ai-msg-${this.messageSequence}`;
  }

  private createWelcomeMessage(): AiChatMessage {
    return {
      id: this.nextMessageId(),
      role: "assistant",
      text: AI_WELCOME_MESSAGE,
      createdAt: new Date().toISOString(),
      type: "text",
      markdown: true,
      canCopy: true,
    };
  }

  private createFreshConversation(id?: string): AiConversation {
    return {
      id: id ?? this.nextConversationId(),
      title: "New conversation",
      updatedAt: new Date().toISOString(),
      showWelcomeActions: true,
      messages: [this.createWelcomeMessage()],
    };
  }

  private updateConversation(
    conversationId: string,
    updater: (conversation: AiConversation) => AiConversation,
  ): void {
    this.conversations.update((state) =>
      state.map((conversation) =>
        conversation.id === conversationId ? updater(conversation) : conversation,
      ),
    );
  }

  private appendMessage(conversationId: string, message: AiChatMessage): void {
    this.updateConversation(conversationId, (conversation) => ({
      ...conversation,
      updatedAt: new Date().toISOString(),
      messages: [...conversation.messages, message],
    }));
  }

  private replaceMessage(
    conversationId: string,
    targetMessageId: string,
    replacement: AiChatMessage,
  ): void {
    this.updateConversation(conversationId, (conversation) => ({
      ...conversation,
      updatedAt: new Date().toISOString(),
      messages: conversation.messages.map((message) =>
        message.id === targetMessageId ? replacement : message,
      ),
    }));
  }

  private setWelcomeActions(conversationId: string, showWelcomeActions: boolean): void {
    this.updateConversation(conversationId, (conversation) => ({
      ...conversation,
      showWelcomeActions,
    }));
  }

  private refreshConversationTitle(conversationId: string, prompt: string): void {
    this.updateConversation(conversationId, (conversation) => {
      if (conversation.title !== "New conversation") {
        return conversation;
      }

      return {
        ...conversation,
        title: prompt.slice(0, 42),
      };
    });
  }

  private hasRequiredCapability(action: AiQuickAction): boolean {
    if (!action.requiredCapability) {
      return true;
    }
    return this.authorizationService.has(
      action.requiredCapability as DentalCapability,
    );
  }

  private availableFallbackActions(): AiShortcutAction[] | undefined {
    const actions: AiShortcutAction[] = [];
    if (this.authorizationService.has("orders.create")) {
      actions.push({
        id: "suggest-create",
        title: "Create order draft",
        description: "Prepare a new order request template.",
        intent: "createOrder",
        badge: "Shortcut",
      });
    }
    if (this.authorizationService.has("orders.update")) {
      actions.push({
        id: "suggest-update",
        title: "Update existing order",
        description: "Prepare an order update request template.",
        intent: "updateOrder",
        badge: "Shortcut",
      });
    }
    return actions.length > 0 ? actions : undefined;
  }

  private appendAssistantText(text: string, type: AiChatMessage["type"] = "text"): void {
    this.appendMessage(this.activeConversationId(), {
      id: this.nextMessageId(),
      role: "assistant",
      text,
      createdAt: new Date().toISOString(),
      type,
      markdown: true,
      canCopy: true,
    });
  }

  private async ensureBackendConversationId(
    localConversationId: string,
  ): Promise<string> {
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

  private toAssistantMessage(response: AssistantMessageResponseDto): AiChatMessage {
    if (response.result.type === "confirmation") {
      return {
        id: this.nextMessageId(),
        role: "assistant",
        text: response.result.text,
        createdAt: new Date().toISOString(),
        type: "confirmation",
        markdown: true,
        canCopy: true,
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
    };
  }

  private clearPendingTimer(): void {
    if (!this.pendingReplyTimer) {
      return;
    }
    clearTimeout(this.pendingReplyTimer);
    this.pendingReplyTimer = null;
  }
}
