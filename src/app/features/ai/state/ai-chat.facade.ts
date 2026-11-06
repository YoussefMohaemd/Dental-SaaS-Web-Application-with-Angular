import { computed, effect, Injectable, inject, signal, untracked } from "@angular/core";
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
import { AuthService } from "@core/services/auth.service";
import { AuthorizationService } from "@core/services/authorization.service";
import { NavigationService } from "@core/services/navigation.service";
import { DentalCapability } from "@core/security/capabilities";
import { firstValueFrom } from "rxjs";
import { AI_QUICK_ACTIONS, AI_WELCOME_MESSAGE } from "../data/ai-chat.config";

@Injectable({ providedIn: "root" })
export class AiChatFacade {
  private readonly authService = inject(AuthService);
  private readonly authorizationService = inject(AuthorizationService);
  private readonly navigationService = inject(NavigationService);
  private readonly assistantDataService = inject(AssistantDataService);

  private messageSequence = 0;
  private localConversationSequence = 0;
  private readonly backendConversationByLocalId = new Map<string, string>();
  private backendAllowedSuggestionIds = new Set<string>();
  // Identifies the signed-in user this state belongs to. This facade is a root
  // singleton, so without it chats would leak across logout/login in the SPA.
  private currentUserId: string | null = null;
  // Bumped on every session change so late async responses from the previous
  // user are discarded instead of being written into the new user's state.
  private sessionGeneration = 0;

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
    if (this.navigationService.isMobile()) {
      this.historyOpen.set(false);
    }

    void this.loadConversationMessages(conversationId);
  }

  startNewChat(): void {
    const active = this.activeConversation();
    if (active && active.showWelcomeActions && !this.backendConversationByLocalId.has(active.id)) {
      // Already on an untouched new chat; don't stack empty ones.
      this.promptDraft.update((state) => ({ ...state, prompt: "" }));
      this.closeHistory();
      return;
    }

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

    if (action.id === "ops-open-order-detail") {
      this.updateDraft(action.prefillPrompt);
      this.appendAssistantText(
        "Please enter the order ID or order number (example: DL-026015), and I'll open its details.",
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
    }

    this.seedConversationHistory(summaries);
  }

  // Every visit starts on a brand-new chat; previous chats are only reachable
  // from the history panel and are loaded lazily when selected.
  private seedConversationHistory(summaries: AssistantConversationSummaryDto[]): void {
    const localId = this.nextLocalConversationId();
    const fresh = this.createConversationShell(localId, "New conversation");
    const history = summaries.map((summary) => {
      this.backendConversationByLocalId.set(summary.id, summary.id);
      return this.fromConversationSummary(summary);
    });
    this.conversations.set([fresh, ...history]);
    this.activeConversationId.set(localId);
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

    const generation = this.sessionGeneration;
    try {
      const conversation = await firstValueFrom(
        this.assistantDataService.getConversation$(backendConversationId),
      );
      if (generation !== this.sessionGeneration) {
        return;
      }
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
      text: response.result.text,
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
