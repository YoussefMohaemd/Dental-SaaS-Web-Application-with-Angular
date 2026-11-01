import { CommonModule } from "@angular/common";
import {
  Component,
  effect,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from "@angular/core";
import { AiChatMessage, AiResultCard, AiShortcutAction } from "@core/interfaces";
import { AppButtonComponent } from "@shared/components/button/button.component";
import { AiResultCardComponent } from "@shared/components/ai-result-card/ai-result-card.component";
import { AiShortcutCardComponent } from "@shared/components/ai-shortcut-card/ai-shortcut-card.component";
import { SafeHtmlPipe } from "@shared/pipes/safe-html.pipe";
import { lucideSvg } from "@shared/icons/lucide-icons";

@Component({
  selector: "app-ai-chat-messages",
  standalone: true,
  imports: [
    CommonModule,
    AppButtonComponent,
    AiShortcutCardComponent,
    AiResultCardComponent,
    SafeHtmlPipe,
  ],
  templateUrl: "./ai-chat-messages.component.html",
  styleUrl: "./ai-chat-messages.component.scss",
})
export class AiChatMessagesComponent {
  readonly messages = input<readonly AiChatMessage[]>([]);

  readonly actionSelected = output<AiShortcutAction>();
  readonly copyRequested = output<string>();
  readonly scrollLatest = output<void>();

  private readonly scrollViewport =
    viewChild<ElementRef<HTMLDivElement>>("messagesViewport");
  readonly showScrollLatest = signal(false);
  private wasNearBottom = true;

  constructor() {
    effect(() => {
      this.messages();
      const shouldStickToBottom = this.wasNearBottom;
      setTimeout(() => {
        if (shouldStickToBottom) {
          this.scrollToBottom();
        } else {
          this.syncScrollButtonVisibility();
        }
      }, 0);
    });
  }

  onActionSelected(action: AiShortcutAction): void {
    this.actionSelected.emit(action);
  }

  onCopyMessage(messageId: string): void {
    this.copyRequested.emit(messageId);
  }

  onScrollLatest(): void {
    this.scrollToBottom();
    this.scrollLatest.emit();
  }

  onScroll(): void {
    this.syncScrollButtonVisibility();
  }

  onResultCardAction(result: AiResultCard): void {
    if (!("ctaIntent" in result) || !result.ctaIntent || !result.ctaLabel) {
      return;
    }

    this.actionSelected.emit({
      id: `${result.id}-cta`,
      title: result.ctaLabel,
      intent: result.ctaIntent,
      description: result.summary,
      badge: "Action",
    });
  }

  getIconSvg(name: "chevron-down"): string {
    return lucideSvg(name, 16);
  }

  renderMessage(message: AiChatMessage): string {
    if (!message.markdown) {
      return `<p>${this.escapeHtml(message.text)}</p>`;
    }

    return this.renderMarkdown(message.text);
  }

  private scrollToBottom(): void {
    const viewport = this.scrollViewport()?.nativeElement;
    if (!viewport) {
      return;
    }
    viewport.scrollTop = viewport.scrollHeight;
    this.showScrollLatest.set(false);
    this.wasNearBottom = true;
  }

  private syncScrollButtonVisibility(): void {
    const viewport = this.scrollViewport()?.nativeElement;
    if (!viewport) {
      return;
    }

    const threshold = 56;
    const distanceFromBottom =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    const isNearBottom = distanceFromBottom <= threshold;

    this.wasNearBottom = isNearBottom;
    this.showScrollLatest.set(!isNearBottom);
  }

  private renderMarkdown(input: string): string {
    const lines = input.replace(/\r/g, "").split("\n");
    const blocks: string[] = [];
    let index = 0;

    while (index < lines.length) {
      const line = lines[index];
      const trimmed = line.trim();

      if (!trimmed) {
        index += 1;
        continue;
      }

      if (trimmed.startsWith("```")) {
        const codeLines: string[] = [];
        index += 1;
        while (index < lines.length && !lines[index].trim().startsWith("```")) {
          codeLines.push(lines[index]);
          index += 1;
        }
        blocks.push(
          `<pre><code>${this.escapeHtml(codeLines.join("\n"))}</code></pre>`,
        );
        index += 1;
        continue;
      }

      if (this.isTableStart(lines, index)) {
        const tableLines: string[] = [];
        tableLines.push(lines[index]);
        index += 2;
        while (index < lines.length && lines[index].includes("|")) {
          tableLines.push(lines[index]);
          index += 1;
        }

        blocks.push(this.renderTable(tableLines));
        continue;
      }

      if (trimmed.startsWith("- ")) {
        const listItems: string[] = [];
        while (index < lines.length && lines[index].trim().startsWith("- ")) {
          listItems.push(lines[index].trim().slice(2));
          index += 1;
        }

        blocks.push(
          `<ul>${listItems
            .map((item) => `<li>${this.applyInline(item)}</li>`)
            .join("")}</ul>`,
        );
        continue;
      }

      if (/^#{1,3}\s+/.test(trimmed)) {
        const hashes = trimmed.match(/^#+/)?.[0].length ?? 1;
        const level = Math.min(hashes, 3);
        const text = trimmed.replace(/^#{1,3}\s+/, "");
        blocks.push(`<h${level}>${this.applyInline(text)}</h${level}>`);
        index += 1;
        continue;
      }

      const paragraphLines: string[] = [];
      while (
        index < lines.length &&
        lines[index].trim() &&
        !lines[index].trim().startsWith("- ") &&
        !lines[index].trim().startsWith("```") &&
        !/^#{1,3}\s+/.test(lines[index].trim()) &&
        !this.isTableStart(lines, index)
      ) {
        paragraphLines.push(lines[index].trim());
        index += 1;
      }

      blocks.push(`<p>${this.applyInline(paragraphLines.join(" "))}</p>`);
    }

    return blocks.join("");
  }

  private isTableStart(lines: string[], index: number): boolean {
    if (index + 1 >= lines.length) {
      return false;
    }

    const current = lines[index];
    const separator = lines[index + 1].trim();
    return current.includes("|") && /^\|?[\s:-]+\|[\s|:-]*\|?$/.test(separator);
  }

  private renderTable(lines: string[]): string {
    if (lines.length === 0) {
      return "";
    }

    const header = this.parseTableRow(lines[0]);
    const rows = lines.slice(1).map((line) => this.parseTableRow(line));
    const headerCells = header.map((cell) => `<th>${this.applyInline(cell)}</th>`).join("");
    const bodyRows = rows
      .map(
        (row) =>
          `<tr>${row.map((cell) => `<td>${this.applyInline(cell)}</td>`).join("")}</tr>`,
      )
      .join("");

    return `<div class="markdown-table-wrap"><table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table></div>`;
  }

  private parseTableRow(line: string): string[] {
    return line
      .split("|")
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0);
  }

  private applyInline(value: string): string {
    const escaped = this.escapeHtml(value);
    return escaped
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
}
