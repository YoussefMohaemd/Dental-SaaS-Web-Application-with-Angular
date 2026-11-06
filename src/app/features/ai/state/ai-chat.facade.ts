import { computed, Injectable, inject, signal } from "@angular/core";
import {
  AiChatMessage,
  AiConversation,
  AiConversationSummary,
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
  AssistantSuggestionDto,
} from "@core/services/assistant-data.service";
import { AuthorizationService } from "@core/services/authorization.service";
import { NavigationService } from "@core/services/navigation.service";
import { DentalCapability } from "@core/security/capabilities";
import { firstValueFrom } from "rxjs";
import { AI_QUICK_ACTIONS, AI_WELCOME_MESSAGE } from "../data/ai-chat.mock";

@Injectable({ providedIn: "root" })
export class AiChatFacade {
  private readonly authorizationService = inject(AuthorizationService);
  private readonly navigationService = inject(NavigationService);
  private readonly assistantDataService = inject(AssistantDataService);

  private messageSequence = 0;
  private localConversationSequence = 0;
  private readonly backendConversationByLocalId = new Map<string, string>();
  private backendAllowedSuggestionIds = new Set<string>();

  readonly promptDraft = signal<AiPromptDraft>({
    search: "",
    prompt: "",
  });
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

  readonly canSend = computed(
    () => this.promptDraft().prompt.trim().length > 0 && !this.isResponding(),
  );

  public constructor() {
    void this.bootstrap();
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

    void this.loadConversationMessages(conversationId);
  }

  startNewChat(): void {
    const localId = this.nextLocalConversationId();
    const conversation = this.createConversationShell(localId, "New conversation");
    this.conversations.update((state) => [conversation, ...state]);
    this.activeConversationId.set(localId);
    this.promptDraft.update((state) => ({ ...state, prompt: "" }));
    this.closeHistory();
  }

  updateDraft(prompt: string): void {
    this.promptDraft.update((state) => ({ ...state, prompt }));
  }

  async submitPrompt(rawPrompt?: string): Promise<void> {
    const prompt = (rawPrompt ?? this.promptDraft().prompt).trim();
    const conversationId = this.activeConversationId();
    if (!prompt || !conversationId || this.isResponding()) {
      return;
    }

    this.promptDraft.update((state) => ({ ...state, prompt: "" }));
    this.setWelcomeActions(conversationId, false);
    this.appendMessage(conversationId, {
      id: this.nextMessageId(),
      role: "user",
      text: prompt,
      createdAt: new Date().toISOString(),
      type: "text",
    });

    const loadingMessageId = this.nextMessageId();
    this.appendMessage(conversationId, {
      id: loadingMessageId,
      role: "thinking",
      text: "Thinking through your request...",
      createdAt: new Date().toISOString(),
      type: "loading",
    });

    this.refreshConversationTitle(conversationId, prompt);
    this.isResponding.set(true);
    try {
      const response = await this.postMessageWithConversationRecovery(conversationId, prompt);
      this.replaceMessage(
        conversationId,
        loadingMessageId,
        this.toAssistantMessage(response),
      );
      this.touchConversation(conversationId);
    } catch (error) {
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
      this.isResponding.set(false);
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

    const mapped = AI_QUICK_ACTIONS.find((item) => item.intent === action.intent);
    if (mapped) {
      this.runQuickAction(mapped);
    }
  }

  resolveCopyMessage(messageId: string): string | null {
    return (
      this.messages().find((message) => message.id === messageId && message.role === "assistant")
        ?.text ?? null
    );
  }

  private async bootstrap(): Promise<void> {
    try {
      const [suggestions, summaries] = await Promise.all([
        firstValueFrom(this.assistantDataService.getSuggestions$()),
        firstValueFrom(this.assistantDataService.listConversations$()),
      ]);
      this.backendAllowedSuggestionIds = new Set(
        suggestions.filter((item) => item.enabled).map((item) => item.id),
      );
      this.seedConversationHistory(summaries);
    } catch {
      const localId = this.nextLocalConversationId();
      const fallback = this.createConversationShell(localId, "New conversation");
      this.conversations.set([fallback]);
      this.activeConversationId.set(localId);
    }
  }

  private seedConversationHistory(summaries: AssistantConversationSummaryDto[]): void {
    if (summaries.length === 0) {
      const localId = this.nextLocalConversationId();
      const fresh = this.createConversationShell(localId, "New conversation");
      this.conversations.set([fresh]);
      this.activeConversationId.set(localId);
      return;
    }

    const mapped = summaries.map((summary) => {
      this.backendConversationByLocalId.set(summary.id, summary.id);
      return this.fromConversationSummary(summary);
    });
    this.conversations.set(mapped);
    this.activeConversationId.set(mapped[0]?.id ?? null);
    if (mapped[0]) {
      void this.loadConversationMessages(mapped[0].id);
    }
  }

  private fromConversationSummary(summary: AssistantConversationSummaryDto): AiConversation {
    return {
      id: summary.id,
      title: summary.title,
      updatedAt: summary.updatedAt,
      showWelcomeActions: false,
      messages: [],
    };
  }

  private async loadConversationMessages(localConversationId: string): Promise<void> {
    const backendConversationId = this.backendConversationByLocalId.get(localConversationId);
    if (!backendConversationId) {
      return;
    }

    try {
      const conversation = await firstValueFrom(
        this.assistantDataService.getConversation$(backendConversationId),
      );
      this.updateConversation(localConversationId, () =>
        this.fromBackendConversation(conversation, localConversationId),
      );
    } catch {
      return;
    }
  }

  private fromBackendConversation(
    conversation: AssistantConversationViewDto,
    localId: string,
  ): AiConversation {
    return {
      id: localId,
      title: conversation.title,
      updatedAt: conversation.updatedAt,
      showWelcomeActions: conversation.messages.length <= 1,
      messages: conversation.messages.map((message) => ({
        id: message.id,
        role: message.role,
        text: message.text,
        createdAt: message.createdAt,
        type:
          message.resultType === "confirmation"
            ? "confirmation"
            : message.resultType === "error"
              ? "error"
              : "text",
        markdown: true,
        canCopy: message.role === "assistant",
      })),
    };
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
      text:
        response.result.executions.length > 0
          ? `${response.result.text}\n\n${this.formatExecutionResults(response.result.executions)}`
          : response.result.text,
      createdAt: new Date().toISOString(),
      type: "text",
      markdown: true,
      canCopy: true,
    };
  }

  private async confirmPendingAction(
    actionId: string,
    confirmationToken: string,
  ): Promise<void> {
    const conversationId = this.activeConversationId();
    if (!conversationId || this.isResponding()) {
      return;
    }

    this.isResponding.set(true);
    try {
      const result = await firstValueFrom(
        this.assistantDataService.confirmAction$(actionId, confirmationToken),
      );
      this.appendConfirmationResultMessage(conversationId, result);
      this.touchConversation(conversationId);
      await this.loadConversationMessages(conversationId);
    } catch (error) {
      this.appendAssistantText(this.resolveAssistantErrorText(error), "error");
    } finally {
      this.isResponding.set(false);
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

  private resolveAssistantErrorText(error: unknown): string {
    const candidate = error as
      | {
          status?: number;
          error?: {
            error?: {
              message?: string;
            };
          };
        }
      | undefined;
    const message = candidate?.error?.error?.message?.toLowerCase() ?? "";
    if (candidate?.status === 403 || message.includes("permission denied")) {
      return "You don't have access for that action in this account.";
    }

    if (candidate?.status === 409 || message.includes("expired")) {
      return "This pending action is no longer valid. Please send a new request.";
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
              message?: string;
            };
          };
        }
      | undefined;
    const message = candidate?.error?.error?.message?.toLowerCase() ?? "";
    return candidate?.status === 404 && message.includes("conversation was not found");
  }

  private isQuickActionVisible(action: AiQuickAction): boolean {
    if (action.requiredCapability) {
      const hasCapability = this.authorizationService.has(
        action.requiredCapability as DentalCapability,
      );
      if (!hasCapability) {
        return false;
      }
    }

    const suggestionDependency = quickActionSuggestionDependency(action.id);
    if (suggestionDependency && this.backendAllowedSuggestionIds.size > 0) {
      return this.backendAllowedSuggestionIds.has(suggestionDependency);
    }

    return true;
  }

  private createConversationShell(id: string, title: string): AiConversation {
    return {
      id,
      title,
      updatedAt: new Date().toISOString(),
      showWelcomeActions: true,
      messages: [
        {
          id: this.nextMessageId(),
          role: "assistant",
          text: AI_WELCOME_MESSAGE,
          createdAt: new Date().toISOString(),
          type: "text",
          markdown: true,
          canCopy: true,
        },
      ],
    };
  }

  private nextLocalConversationId(): string {
    this.localConversationSequence += 1;
    return `local-conv-${this.localConversationSequence}`;
  }

  private nextMessageId(): string {
    this.messageSequence += 1;
    return `msg-${this.messageSequence}`;
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

  private touchConversation(conversationId: string): void {
    this.updateConversation(conversationId, (conversation) => ({
      ...conversation,
      updatedAt: new Date().toISOString(),
    }));
  }

  private appendMessage(conversationId: string, message: AiChatMessage): void {
    this.updateConversation(conversationId, (conversation) => ({
      ...conversation,
      updatedAt: message.createdAt,
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
      updatedAt: replacement.createdAt,
      messages: conversation.messages.map((message) =>
        message.id === targetMessageId ? replacement : message,
      ),
    }));
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

  private appendAssistantText(text: string, type: AiChatMessage["type"] = "text"): void {
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

  private formatExecutionResults(
    executions: Array<{ tool: string; result?: unknown }>,
  ): string {
    const lines = executions.map((execution) => {
      if (!execution.result) {
        return `- ${execution.tool}: executed`;
      }
      return `- ${execution.tool}: executed with result`;
    });
    return `Tool execution results:\n${lines.join("\n")}`;
  }
}

function quickActionSuggestionDependency(actionId: string): string | undefined {
  switch (actionId) {
    case "ops-search-orders":
      return "assistant-search-orders";
    case "ops-create-order":
      return "assistant-create-order";
    case "ops-search-patients":
      return "assistant-search-patients";
    default:
      return undefined;
  }
}
