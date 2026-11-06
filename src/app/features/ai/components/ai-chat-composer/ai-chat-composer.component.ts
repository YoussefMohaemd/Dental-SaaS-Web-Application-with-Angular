import { CommonModule } from "@angular/common";
import {
  AfterViewInit,
  Component,
  ElementRef,
  input,
  OnChanges,
  SimpleChanges,
  output,
  viewChild,
} from "@angular/core";
import { AppButtonComponent } from "@shared/components/button/button.component";

@Component({
  selector: "app-ai-chat-composer",
  standalone: true,
  imports: [CommonModule, AppButtonComponent],
  templateUrl: "./ai-chat-composer.component.html",
  styleUrl: "./ai-chat-composer.component.scss",
})
export class AiChatComposerComponent implements AfterViewInit, OnChanges {
  readonly draft = input<string>("");
  readonly canSend = input<boolean>(false);
  readonly loading = input<boolean>(false);

  readonly draftChanged = output<string>();
  readonly submitted = output<string>();

  private readonly promptField = viewChild<ElementRef<HTMLTextAreaElement>>("promptField");

  ngAfterViewInit(): void {
    this.syncFieldValue();
    this.resize();
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.syncFieldValue();
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.draftChanged.emit(value);
    this.resize();
  }

  onFormSubmit(event: Event): void {
    // Native form submission reloads the page; the chat must stay in the SPA.
    event.preventDefault();
    this.onSubmit();
  }

  onSubmit(): void {
    const field = this.promptField()?.nativeElement;
    const prompt = (field?.value ?? this.draft()).trim();
    if (!prompt || this.loading() || !this.canSend()) {
      return;
    }

    this.submitted.emit(prompt);
    if (field) {
      field.value = "";
      field.style.height = "auto";
      field.focus();
    }
    this.draftChanged.emit("");
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }
    event.preventDefault();
    this.onSubmit();
  }

  syncFieldValue(): void {
    const field = this.promptField()?.nativeElement;
    if (!field) {
      return;
    }
    if (field.value !== this.draft()) {
      field.value = this.draft();
    }
    this.resize();
  }

  private resize(): void {
    const field = this.promptField()?.nativeElement;
    if (!field) {
      return;
    }

    field.style.height = "auto";
    const maxHeight = 152;
    const next = Math.min(field.scrollHeight, maxHeight);
    field.style.height = `${next}px`;
    field.style.overflowY = field.scrollHeight > maxHeight ? "auto" : "hidden";
  }
}
