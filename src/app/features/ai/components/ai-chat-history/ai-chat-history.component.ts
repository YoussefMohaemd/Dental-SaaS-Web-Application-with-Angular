import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { AiConversationSummary } from "@core/interfaces";
import { AppButtonComponent } from "@shared/components/button/button.component";
import { SafeHtmlPipe } from "@shared/pipes/safe-html.pipe";
import { lucideSvg } from "@shared/icons/lucide-icons";

@Component({
  selector: "app-ai-chat-history",
  standalone: true,
  imports: [CommonModule, AppButtonComponent, SafeHtmlPipe],
  templateUrl: "./ai-chat-history.component.html",
  styleUrl: "./ai-chat-history.component.scss",
})
export class AiChatHistoryComponent {
  readonly open = input<boolean>(false);
  readonly conversations = input<readonly AiConversationSummary[]>([]);

  readonly close = output<void>();
  readonly conversationSelected = output<string>();
  readonly createConversation = output<void>();

  onClose(): void {
    this.close.emit();
  }

  onSelect(conversationId: string): void {
    this.conversationSelected.emit(conversationId);
  }

  onCreateConversation(): void {
    this.createConversation.emit();
  }

  getIconSvg(name: "x" | "file-plus"): string {
    return lucideSvg(name, 16);
  }
}
