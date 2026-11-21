import { Injectable, OnDestroy, computed, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";

import {
  AssistantDataService,
  type AssistantVoiceLanguageHint,
  type AssistantTranscriptionResponseDto,
} from "@core/services/assistant-data.service";
import { VoiceRecorderService } from "./voice-recorder.service";

export type VoiceInputState = "idle" | "recording" | "transcribing" | "error";
type VoiceLanguage = AssistantVoiceLanguageHint;

@Injectable({ providedIn: "root" })
export class VoiceInputService implements OnDestroy {
  private startedAtMs = 0;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private readonly stateSignal = signal<VoiceInputState>("idle");
  private readonly elapsedSecondsSignal = signal(0);
  private readonly errorMessageSignal = signal("");
  private readonly activeLanguageSignal = signal<VoiceLanguage>("auto");
  /** Last recording that failed to transcribe for a transient reason, kept so the user can retry without re-speaking. */
  private pendingAudio: Blob | null = null;
  private readonly canRetrySignal = signal(false);

  readonly state = computed(() => this.stateSignal());
  readonly elapsedSeconds = computed(() => this.elapsedSecondsSignal());
  readonly errorMessage = computed(() => this.errorMessageSignal());
  readonly canRetry = computed(() => this.canRetrySignal());
  readonly level = this.recorder.level;

  public constructor(
    private readonly assistantDataService: AssistantDataService,
    private readonly recorder: VoiceRecorderService,
  ) {}

  async start(language: VoiceLanguage = "auto"): Promise<void> {
    this.activeLanguageSignal.set(language);
    this.clearError();
    this.discardPendingAudio();
    this.stopTimers();

    this.startedAtMs = Date.now();
    this.elapsedSecondsSignal.set(0);
    try {
      await this.recorder.start({ language });
      this.stateSignal.set("recording");
      this.timerId = setInterval(() => {
        const elapsed = Math.floor((Date.now() - this.startedAtMs) / 1_000);
        this.elapsedSecondsSignal.set(Math.max(0, elapsed));
      }, 1_000);
    } catch {
      this.setError(
        localizedMessage(language, {
          en: "Microphone permission was denied.",
          ar: "تم رفض إذن الميكروفون.",
        }),
      );
    }
  }

  async stop(language: VoiceLanguage = this.activeLanguageSignal()): Promise<AssistantTranscriptionResponseDto | null> {
    this.activeLanguageSignal.set(language);
    const recordingDurationMs = Date.now() - this.startedAtMs;
    this.stopTimers();

    if (recordingDurationMs < 500) {
      this.stateSignal.set("idle");
      await this.recorder.stop();
      return null;
    }

    const audioBlob = await this.recorder.stop();
    if (!audioBlob) {
      this.setError(
        localizedMessage(language, {
          en: "No clear speech was detected.",
          ar: "لم يتم التقاط كلام واضح.",
        }),
      );
      return null;
    }
    return this.transcribeBlob(audioBlob, language);
  }

  /** Re-sends the last recording after a transient failure (no need to speak again). */
  async retry(
    language: VoiceLanguage = this.activeLanguageSignal(),
  ): Promise<AssistantTranscriptionResponseDto | null> {
    const audioBlob = this.pendingAudio;
    if (!audioBlob || this.stateSignal() === "transcribing") {
      return null;
    }
    this.activeLanguageSignal.set(language);
    this.clearError();
    return this.transcribeBlob(audioBlob, language);
  }

  private async transcribeBlob(
    audioBlob: Blob,
    language: VoiceLanguage,
  ): Promise<AssistantTranscriptionResponseDto | null> {
    this.stateSignal.set("transcribing");
    this.canRetrySignal.set(false);
    try {
      const result = await firstValueFrom(
        this.assistantDataService.transcribe$(audioBlob, language),
      );
      if (!result.text?.trim()) {
        this.discardPendingAudio();
        this.setError(localizedMessage(language, {
          en: "No clear speech was detected.",
          ar: "لم يتم التقاط كلام واضح.",
        }));
        return null;
      }
      this.discardPendingAudio();
      this.stateSignal.set("idle");
      return result;
    } catch (error) {
      if (isTransientVoiceError(error)) {
        this.pendingAudio = audioBlob;
        this.canRetrySignal.set(true);
      } else {
        this.discardPendingAudio();
      }
      this.setError(mapVoiceError(error, language));
      return null;
    }
  }

  cancel(): void {
    this.discardPendingAudio();
    this.recorder.cancel();
    this.stopTimers();
    this.clearError();
    this.stateSignal.set("idle");
  }

  ngOnDestroy(): void {
    this.cancel();
  }

  private setError(message: string): void {
    this.errorMessageSignal.set(message);
    this.stateSignal.set("error");
  }

  private discardPendingAudio(): void {
    this.pendingAudio = null;
    this.canRetrySignal.set(false);
  }

  private clearError(): void {
    this.errorMessageSignal.set("");
  }

  private stopTimers(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}

function isTransientVoiceError(error: unknown): boolean {
  const status =
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status?: unknown }).status === "number"
      ? (error as { status: number }).status
      : 0;
  return status === 0 || status === 429 || status >= 500;
}

function mapVoiceError(error: unknown, language: VoiceLanguage): string {
  const status =
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status?: unknown }).status === "number"
      ? (error as { status: number }).status
      : 0;
  const errorCode =
    typeof error === "object" &&
    error !== null &&
    "error" in error &&
    typeof (error as { error?: unknown }).error === "object" &&
    (error as { error?: { error?: { code?: unknown } } }).error?.error &&
    typeof (error as { error?: { error?: { code?: unknown } } }).error?.error?.code === "string"
      ? (error as { error: { error: { code: string } } }).error.error.code
      : "";
  if (status === 400 && errorCode === "VALIDATION_ERROR") {
    return localizedMessage(language, {
      en: "No clear speech was detected.",
      ar: "لم يتم التقاط كلام واضح.",
    });
  }
  if (status === 429) {
    return localizedMessage(language, {
      en: "Voice requests are limited right now. Try again shortly.",
      ar: "طلبات الإدخال الصوتي كثيرة الآن. حاول مرة أخرى بعد قليل.",
    });
  }
  if (status >= 500) {
    return localizedMessage(language, {
      en: "Voice transcription is temporarily unavailable.",
      ar: "خدمة تحويل الصوت إلى نص غير متاحة مؤقتًا.",
    });
  }
  if (status === 0) {
    return localizedMessage(language, {
      en: "Network error while transcribing voice input.",
      ar: "حدث خطأ في الشبكة أثناء تحويل الصوت إلى نص.",
    });
  }
  return localizedMessage(language, {
    en: "Voice input failed. Try again.",
    ar: "فشل الإدخال الصوتي. حاول مرة أخرى.",
  });
}

function localizedMessage(
  language: VoiceLanguage,
  value: { en: string; ar: string },
): string {
  return language === "ar" || language === "mixed" ? value.ar : value.en;
}
