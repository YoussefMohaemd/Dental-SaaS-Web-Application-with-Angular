import { CommonModule } from "@angular/common";
import { Component, computed, inject } from "@angular/core";
import { AiQuickAction, AiShortcutAction } from "@core/interfaces";
import { AppButtonComponent } from "@shared/components/button/button.component";
import { SafeHtmlPipe } from "@shared/pipes/safe-html.pipe";
import { lucideSvg } from "@shared/icons/lucide-icons";
import { AiChatComposerComponent } from "./components/ai-chat-composer/ai-chat-composer.component";
import { AiChatHistoryComponent } from "./components/ai-chat-history/ai-chat-history.component";
import { AiChatMessagesComponent } from "./components/ai-chat-messages/ai-chat-messages.component";
import { AiOrderWorkflowPanelComponent } from "./components/ai-order-workflow-panel/ai-order-workflow-panel.component";
import { AiQuickActionsComponent } from "./components/ai-quick-actions/ai-quick-actions.component";
import { AiWorkflowPanelComponent } from "./components/ai-workflow-panel/ai-workflow-panel.component";
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
    AiOrderWorkflowPanelComponent,
    AiQuickActionsComponent,
    AiWorkflowPanelComponent,
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
  readonly activeWorkflow = this.facade.activeWorkflow;
  readonly activeOrderWorkflow = this.facade.activeOrderWorkflow;
  readonly activeWorkflowField = this.facade.activeWorkflowField;
  readonly draft = computed(() => this.facade.promptDraft().prompt);
  readonly canSend = this.facade.canSend;
  readonly isResponding = this.facade.isResponding;
  readonly isHistoryOpen = this.facade.historyOpen;

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

  showQuickActions(): void {
    this.facade.showQuickActions();
  }

  onWorkflowValueChanged(value: string): void {
    this.facade.updateWorkflowInput(value);
  }

  onWorkflowContinue(): void {
    this.facade.continueWorkflow();
  }

  onWorkflowCancel(): void {
    this.facade.cancelWorkflow();
  }

  onOrderWorkflowInputChanged(value: string): void {
    this.facade.updateOrderWorkflowInput(value);
  }

  onOrderWorkflowContinue(): void {
    this.facade.continueOrderWorkflow();
  }

  onOrderWorkflowCandidatePick(id: string): void {
    this.facade.pickOrderWorkflowCandidate(id);
  }

  onOrderWorkflowBillToChanged(target: "doctor" | "scan-center"): void {
    this.facade.setOrderWorkflowBillTo(target);
  }

  onOrderWorkflowServiceToggled(serviceId: string): void {
    this.facade.toggleOrderWorkflowService(serviceId);
  }

  onOrderWorkflowActiveServiceChanged(serviceId: string): void {
    this.facade.setOrderWorkflowActiveService(serviceId);
  }

  onOrderWorkflowToothToggled(tooth: number): void {
    this.facade.toggleOrderWorkflowTooth(tooth);
  }

  onOrderWorkflowNotesChanged(value: string): void {
    this.facade.updateOrderWorkflowNotes(value);
  }

  onOrderWorkflowSubmit(): void {
    this.facade.submitOrderWorkflow();
  }

  async copyMessage(messageId: string): Promise<void> {
    const text = this.facade.resolveCopyMessage(messageId);
    if (!text) {
      return;
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
      }

      if (typeof document === "undefined") {
        throw new Error("Clipboard API and document are unavailable in this environment.");
      }

      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "true");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      textarea.style.pointerEvents = "none";
      document.body.appendChild(textarea);
      textarea.select();

      const copied = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (!copied) {
        throw new Error("Document copy command failed.");
      }
    } catch (error) {
      console.error("Failed to copy assistant message:", error);
    }
  }

  getIconSvg(name: "history" | "file-plus"): string {
    const size = name === "file-plus" ? 16 : 17;
    return lucideSvg(name, size);
  }
}
