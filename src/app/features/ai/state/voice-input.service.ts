import { Injectable, OnDestroy, computed, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";

import {
  AssistantDataService,
  type AssistantTranscriptionResponseDto,
} from "@core/services/assistant-data.service";

export type VoiceInputState = "idle" | "recording" | "transcribing" | "error";
type VoiceLanguage = "ar" | "en" | "mixed";

@Injectable({ providedIn: "root" })
export class VoiceInputService implements OnDestroy {
  private readonly chunks: Blob[] = [];
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private startedAtMs = 0;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private autoStopTimerId: ReturnType<typeof setTimeout> | null = null;
  private readonly stateSignal = signal<VoiceInputState>("idle");
  private readonly elapsedSecondsSignal = signal(0);
  private readonly errorMessageSignal = signal("");
  private readonly activeLanguageSignal = signal<VoiceLanguage>("en");

  readonly state = computed(() => this.stateSignal());
  readonly elapsedSeconds = computed(() => this.elapsedSecondsSignal());
  readonly errorMessage = computed(() => this.errorMessageSignal());

  public constructor(private readonly assistantDataService: AssistantDataService) {}

  async start(language: VoiceLanguage = "en"): Promise<void> {
    this.activeLanguageSignal.set(language);
    this.clearError();
    this.stopTimers();
    this.chunks.length = 0;

    const mediaDevices = navigator.mediaDevices;
    if (!mediaDevices?.getUserMedia) {
      this.setError(localizedMessage(language, {
        en: "No microphone is available in this browser.",
        ar: "الميكروفون غير متاح في هذا المتصفح.",
      }));
      return;
    }

    try {
      this.mediaStream = await mediaDevices.getUserMedia({ audio: true });
    } catch {
      this.setError(localizedMessage(language, {
        en: "Microphone permission was denied.",
        ar: "تم رفض إذن الميكروفون.",
      }));
      return;
    }

    const mimeType = selectMimeType();
    try {
      this.mediaRecorder = mimeType
        ? new MediaRecorder(this.mediaStream, { mimeType })
        : new MediaRecorder(this.mediaStream);
    } catch {
      this.releaseMicrophone();
      this.setError(localizedMessage(language, {
        en: "Unable to start voice recording.",
        ar: "تعذر بدء تسجيل الصوت.",
      }));
      return;
    }

    this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
      }
    };

    this.startedAtMs = Date.now();
    this.elapsedSecondsSignal.set(0);
    this.stateSignal.set("recording");
    this.timerId = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.startedAtMs) / 1_000);
      this.elapsedSecondsSignal.set(Math.max(0, elapsed));
    }, 1_000);
    this.autoStopTimerId = setTimeout(() => {
      void this.stop();
    }, 60_000);
    this.mediaRecorder.start();
  }

  async stop(language: VoiceLanguage = this.activeLanguageSignal()): Promise<AssistantTranscriptionResponseDto | null> {
    this.activeLanguageSignal.set(language);
    const recorder = this.mediaRecorder;
    if (!recorder) {
      this.releaseMicrophone();
      this.stopTimers();
      this.stateSignal.set("idle");
      return null;
    }

    const recordingDurationMs = Date.now() - this.startedAtMs;
    if (recorder.state !== "inactive") {
      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
        recorder.stop();
      });
    }

    this.stopTimers();
    this.releaseMicrophone();
    this.mediaRecorder = null;

    if (recordingDurationMs < 500) {
      this.stateSignal.set("idle");
      this.chunks.length = 0;
      return null;
    }

    const audioBlob = new Blob(this.chunks, {
      type: recorder.mimeType || "audio/webm",
    });
    this.chunks.length = 0;
    if (audioBlob.size <= 1_024) {
      this.setError(
        localizedMessage(language, {
          en: "No clear speech was detected.",
          ar: "لم يتم التقاط كلام واضح.",
        }),
      );
      return null;
    }
    this.stateSignal.set("transcribing");
    try {
      const result = await firstValueFrom(
        this.assistantDataService.transcribe$(audioBlob, language),
      );
      if (!result.text?.trim()) {
        this.setError(localizedMessage(language, {
          en: "No clear speech was detected.",
          ar: "لم يتم التقاط كلام واضح.",
        }));
        return null;
      }
      this.stateSignal.set("idle");
      return result;
    } catch (error) {
      this.setError(mapVoiceError(error, language));
      return null;
    }
  }

  cancel(): void {
    try {
      if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
        this.mediaRecorder.stop();
      }
    } catch {
      // ignore stop failures, cleanup still runs
    }
    this.mediaRecorder = null;
    this.chunks.length = 0;
    this.stopTimers();
    this.releaseMicrophone();
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

  private clearError(): void {
    this.errorMessageSignal.set("");
  }

  private stopTimers(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.autoStopTimerId) {
      clearTimeout(this.autoStopTimerId);
      this.autoStopTimerId = null;
    }
  }

  private releaseMicrophone(): void {
    if (!this.mediaStream) {
      return;
    }
    for (const track of this.mediaStream.getTracks()) {
      track.stop();
    }
    this.mediaStream = null;
  }
}

function selectMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") {
    return undefined;
  }

  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
    return "audio/webm;codecs=opus";
  }
  if (MediaRecorder.isTypeSupported("audio/mp4")) {
    return "audio/mp4";
  }
  if (MediaRecorder.isTypeSupported("audio/webm")) {
    return "audio/webm";
  }

  return undefined;
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
