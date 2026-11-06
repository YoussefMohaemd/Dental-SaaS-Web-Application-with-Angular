import { CommonModule } from "@angular/common";
import { Component, computed, inject } from "@angular/core";
import { AiQuickAction, AiShortcutAction } from "@core/interfaces";
import { AppButtonComponent } from "@shared/components/button/button.component";
import { SafeHtmlPipe } from "@shared/pipes/safe-html.pipe";
import { lucideSvg } from "@shared/icons/lucide-icons";
import { AiChatComposerComponent } from "./components/ai-chat-composer/ai-chat-composer.component";
import { AiChatHistoryComponent } from "./components/ai-chat-history/ai-chat-history.component";
import { AiChatMessagesComponent } from "./components/ai-chat-messages/ai-chat-messages.component";
import { AiQuickActionsComponent } from "./components/ai-quick-actions/ai-quick-actions.component";
import { AiOrderWorkflowPanelComponent } from "./components/ai-order-workflow-panel/ai-order-workflow-panel.component";
import { AiChatFacade } from "./state/ai-chat.facade";

@Component({
  selector: "app-ai",
  standalone: true,
  imports: [
    CommonModule,
    AppButtonComponent,
    AiChatHistoryComponent,
    AiChatMessagesComponent,
    AiChatComposerComponent,
    AiQuickActionsComponent,
    AiOrderWorkflowPanelComponent,
    SafeHtmlPipe,
  ],
  templateUrl: "./ai.component.html",
  styleUrl: "./ai.component.scss",
})
export class AiComponent {
  private readonly facade = inject(AiChatFacade);

  readonly activeConversationId = this.facade.activeConversationId;
  readonly activeConversation = this.facade.activeConversation;
  readonly conversations = this.facade.conversationSummaries;
  readonly messages = this.facade.messages;
  readonly showWelcome = this.facade.showWelcome;
  readonly quickActions = this.facade.quickActions;
  readonly draft = computed(() => this.facade.promptDraft().prompt);
  readonly canSend = this.facade.canSend;
  readonly isResponding = this.facade.isResponding;
  readonly isHistoryOpen = this.facade.historyOpen;
  readonly orderWorkflow = this.facade.orderWorkflow;

  toggleHistory(): void {
    this.facade.toggleHistory();
  }

  closeHistory(): void {
    this.facade.closeHistory();
  }

  startNewChat(): void {
    this.facade.startNewChat();
  }

  selectConversation(conversationId: string): void {
    this.facade.selectConversation(conversationId);
  }

  onDraftChanged(prompt: string): void {
    this.facade.updateDraft(prompt);
  }

  async submitPrompt(prompt: string): Promise<void> {
    await this.facade.submitPrompt(prompt);
  }

  onShortcutAction(action: AiShortcutAction): void {
    this.facade.runShortcutAction(action);
  }

  onQuickAction(action: AiQuickAction): void {
    this.facade.runQuickAction(action);
  }

  onWorkflowInputChanged(value: string): void {
    this.facade.updateWorkflowInput(value);
  }

  async onWorkflowContinue(): Promise<void> {
    await this.facade.advanceOrderWorkflow();
  }

  onWorkflowCandidatePicked(id: string): void {
    this.facade.pickWorkflowCandidate(id);
  }

  onWorkflowBillToChanged(value: "doctor" | "scan-center"): void {
    this.facade.setWorkflowBillTo(value);
  }

  onWorkflowServiceToggled(serviceId: string): void {
    this.facade.toggleWorkflowService(serviceId);
  }

  onWorkflowToothToggled(tooth: number): void {
    this.facade.toggleWorkflowTooth(tooth);
  }

  onWorkflowNotesChanged(notes: string): void {
    this.facade.updateWorkflowNotes(notes);
  }

  async onWorkflowSubmit(): Promise<void> {
    await this.facade.submitOrderWorkflow();
  }

  onWorkflowCancel(): void {
    this.facade.cancelOrderWorkflow();
  }

  async copyMessage(messageId: string): Promise<void> {
    const text = this.facade.resolveCopyMessage(messageId);
    if (!text) {
      return;
    }

    if (typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
  }

  getIconSvg(name: "history" | "file-plus"): string {
    const size = name === "file-plus" ? 16 : 17;
    return lucideSvg(name, size);
  }
}
