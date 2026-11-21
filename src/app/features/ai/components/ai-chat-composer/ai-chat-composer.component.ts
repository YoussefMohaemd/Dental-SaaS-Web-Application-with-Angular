import { CommonModule } from "@angular/common";
import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  OnChanges,
  OnDestroy,
  output,
  signal,
  SimpleChanges,
  viewChild,
} from "@angular/core";

import { AppButtonComponent } from "@shared/components/button/button.component";
import {
  type AssistantVoiceLanguageHint,
  type AssistantTranscriptionResponseDto,
} from "@core/services/assistant-data.service";
import { VoiceInputService } from "../../state/voice-input.service";
import {
  readVoiceLanguagePreference,
  writeVoiceLanguagePreference,
} from "../../state/voice-language-preference";

@Component({
  selector: "app-ai-chat-composer",
  standalone: true,
  imports: [CommonModule, AppButtonComponent],
  templateUrl: "./ai-chat-composer.component.html",
  styleUrl: "./ai-chat-composer.component.scss",
})
export class AiChatComposerComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  readonly draft = input<string>("");
  readonly canSend = input<boolean>(false);
  readonly loading = input<boolean>(false);

  readonly draftChanged = output<string>();
  readonly submitted = output<string>();

  private readonly promptField =
    viewChild<ElementRef<HTMLTextAreaElement>>("promptField");
  private readonly voiceInput = inject(VoiceInputService);
  private readonly speechStatusText = signal("");
  private readonly selectedVoiceLanguageSignal = signal<AssistantVoiceLanguageHint>(
    readVoiceLanguagePreference(),
  );
  private readonly ambiguitiesSignal = signal<
    NonNullable<AssistantTranscriptionResponseDto["ambiguities"]>
  >([]);

  readonly voiceState = this.voiceInput.state;
  readonly elapsedSeconds = this.voiceInput.elapsedSeconds;
  readonly canRetryVoice = this.voiceInput.canRetry;
  readonly isRecording = computed(() => this.voiceState() === "recording");
  readonly isTranscribing = computed(() => this.voiceState() === "transcribing");
  readonly speechSupported = computed(() => supportsVoiceRecording());
  readonly speechStatus = computed(() => {
    if (this.voiceState() === "error") {
      return this.voiceInput.errorMessage();
    }
    return this.speechStatusText();
  });
  readonly selectedVoiceLanguage = computed(() => this.selectedVoiceLanguageSignal());
  readonly ambiguities = computed(() => this.ambiguitiesSignal());

  ngAfterViewInit(): void {
    this.syncFieldValue();
    this.resize();
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.syncFieldValue();
  }

  ngOnDestroy(): void {
    this.voiceInput.cancel();
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.draftChanged.emit(value);
    this.ambiguitiesSignal.set([]);
    this.resize();
  }

  onFormSubmit(event: Event): void {
    event.preventDefault();
    this.onSubmit();
  }

  onSubmit(): void {
    const field = this.promptField()?.nativeElement;
    const prompt = (field?.value ?? this.draft()).trim();
    if (!prompt || this.loading() || !this.canSend()) {
      return;
    }

    if (this.isRecording() || this.isTranscribing()) {
      this.voiceInput.cancel();
    }
    this.submitted.emit(prompt);
    if (field) {
      field.value = "";
      field.style.height = "auto";
      field.focus();
    }
    this.speechStatusText.set("");
    this.ambiguitiesSignal.set([]);
    this.draftChanged.emit("");
  }

  async onVoiceAction(): Promise<void> {
    if (!this.speechSupported() || this.loading() || this.isTranscribing()) {
      return;
    }

    const language = this.selectedVoiceLanguageSignal();
    if (this.isRecording()) {
      this.setSpeechStatus(
        "Transcribing...",
        "جاري تحويل الصوت إلى نص...",
      );
      const result = await this.voiceInput.stop(language);
      this.handleAmbiguities(result);
      if (result?.text.trim()) {
        this.insertTranscript(result.text);
      } else if (this.voiceState() !== "error") {
        this.speechStatusText.set("");
      }
      return;
    }

    await this.voiceInput.start(language);
    this.ambiguitiesSignal.set([]);
    if (this.voiceState() === "recording") {
      this.setSpeechStatus("Listening...", "جاري الاستماع...");
      return;
    }
    if (this.voiceState() !== "error") {
      this.speechStatusText.set("");
    }
  }

  async onVoiceRetry(): Promise<void> {
    if (this.loading() || this.isTranscribing()) {
      return;
    }
    this.setSpeechStatus("Transcribing...", "جاري تحويل الصوت إلى نص...");
    const result = await this.voiceInput.retry(this.selectedVoiceLanguageSignal());
    this.handleAmbiguities(result);
    if (result?.text.trim()) {
      this.insertTranscript(result.text);
    } else if (this.voiceState() !== "error") {
      this.speechStatusText.set("");
    }
  }

  voiceActionLabel(): string {
    if (this.isTranscribing()) {
      return this.speechMessage("Transcribing voice", "جاري تحويل الصوت");
    }
    if (this.isRecording()) {
      return this.speechMessage("Stop voice input", "إيقاف الإدخال الصوتي");
    }
    return this.speechMessage("Start voice input", "بدء الإدخال الصوتي");
  }

  recordingTimerLabel(): string {
    const seconds = this.elapsedSeconds().toString().padStart(2, "0");
    return `00:${seconds}`;
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }
    event.preventDefault();
    this.onSubmit();
  }

  onVoiceLanguageChange(event: Event): void {
    const nextValue = (event.target as HTMLSelectElement)
      .value as AssistantVoiceLanguageHint;
    if (!["auto", "ar", "en", "mixed"].includes(nextValue)) {
      return;
    }
    this.selectedVoiceLanguageSignal.set(nextValue);
    writeVoiceLanguagePreference(nextValue);
  }

  onAmbiguityCandidateSelected(label: string): void {
    this.insertTranscript(label);
    this.ambiguitiesSignal.set([]);
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

  private speechMessage(english: string, arabic: string): string {
    const language = this.selectedVoiceLanguageSignal();
    if (language === "ar" || language === "mixed") {
      return arabic;
    }
    return english;
  }

  private setSpeechStatus(english: string, arabic: string): void {
    this.speechStatusText.set(this.speechMessage(english, arabic));
  }

  private handleAmbiguities(
    result: AssistantTranscriptionResponseDto | null,
  ): void {
    if (result?.ambiguities?.length) {
      this.ambiguitiesSignal.set(result.ambiguities);
      return;
    }
    this.ambiguitiesSignal.set([]);
  }

  private insertTranscript(text: string): void {
    const normalized = text.trim();
    if (!normalized) {
      return;
    }

    const field = this.promptField()?.nativeElement;
    if (!field) {
      const current = this.draft();
      const withSpacing = [current.trim(), normalized].filter(Boolean).join(" ");
      this.draftChanged.emit(withSpacing);
      return;
    }

    const value = field.value;
    const selectionStart = field.selectionStart ?? value.length;
    const selectionEnd = field.selectionEnd ?? value.length;
    const before = value.slice(0, selectionStart);
    const after = value.slice(selectionEnd);
    const prefix = before.length > 0 && !/\s$/.test(before) ? " " : "";
    const suffix = after.length > 0 && !/^\s/.test(after) ? " " : "";
    const inserted = `${prefix}${normalized}${suffix}`;
    const nextValue = `${before}${inserted}${after}`;
    const caretPosition = before.length + inserted.length;

    field.value = nextValue;
    field.setSelectionRange(caretPosition, caretPosition);
    field.focus();
    this.resize();
    this.draftChanged.emit(nextValue);
  }
}

function supportsVoiceRecording(): boolean {
  if (typeof MediaRecorder === "undefined") {
    return false;
  }
  return typeof navigator.mediaDevices?.getUserMedia === "function";
}
