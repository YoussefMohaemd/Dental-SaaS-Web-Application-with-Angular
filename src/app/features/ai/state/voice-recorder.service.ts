import { Injectable, computed, signal } from "@angular/core";

import { type AssistantVoiceLanguageHint } from "@core/services/assistant-data.service";

type RecorderState = "idle" | "recording";

interface VoiceRecorderConfig {
  language: AssistantVoiceLanguageHint;
  speechRmsThreshold?: number;
  silenceMs?: number;
  maxDurationMs?: number;
  levelSource?: () => number;
}

@Injectable({ providedIn: "root" })
export class VoiceRecorderService {
  private readonly chunks: Blob[] = [];
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private monitorTimerId: ReturnType<typeof setInterval> | null = null;
  private maxDurationTimerId: ReturnType<typeof setTimeout> | null = null;
  private pendingStop: Promise<Blob | null> | null = null;
  private speechDetected = false;
  private lastSpeechAtMs = 0;
  private readonly stateSignal = signal<RecorderState>("idle");
  private readonly levelSignal = signal(0);
  private readonly configSignal = signal<Required<
    Pick<VoiceRecorderConfig, "speechRmsThreshold" | "silenceMs" | "maxDurationMs">
  >>({
    speechRmsThreshold: 0.06,
    silenceMs: 1_500,
    maxDurationMs: 60_000,
  });

  readonly state = computed(() => this.stateSignal());
  readonly level = computed(() => this.levelSignal());

  async start(config: VoiceRecorderConfig): Promise<void> {
    this.cancel();
    this.chunks.length = 0;
    this.speechDetected = false;
    this.lastSpeechAtMs = Date.now();
    this.levelSignal.set(0);
    this.configSignal.set({
      speechRmsThreshold: config.speechRmsThreshold ?? 0.06,
      silenceMs: config.silenceMs ?? 1_500,
      maxDurationMs: config.maxDurationMs ?? 60_000,
    });

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const mimeType = selectMimeType();
    this.mediaRecorder = mimeType
      ? new MediaRecorder(this.mediaStream, { mimeType })
      : new MediaRecorder(this.mediaStream);
    this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
        this.speechDetected = true;
        this.lastSpeechAtMs = Date.now();
      }
    };
    this.mediaRecorder.start();
    this.stateSignal.set("recording");

    this.monitorTimerId = setInterval(() => {
      const level = Math.max(
        0,
        Math.min(1, config.levelSource ? config.levelSource() : 0),
      );
      this.levelSignal.set(level);
      const runtimeConfig = this.configSignal();
      if (level >= runtimeConfig.speechRmsThreshold) {
        this.speechDetected = true;
        this.lastSpeechAtMs = Date.now();
        return;
      }
      if (
        this.speechDetected &&
        Date.now() - this.lastSpeechAtMs >= runtimeConfig.silenceMs
      ) {
        void this.stop();
      }
    }, 100);

    this.maxDurationTimerId = setTimeout(() => {
      void this.stop();
    }, this.configSignal().maxDurationMs);
  }

  async stop(): Promise<Blob | null> {
    if (this.pendingStop) {
      return this.pendingStop;
    }
    if (!this.mediaRecorder) {
      this.cleanup();
      return null;
    }

    this.pendingStop = this.finalizeStop();
    const result = await this.pendingStop;
    this.pendingStop = null;
    return result;
  }

  cancel(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      try {
        this.mediaRecorder.stop();
      } catch {
        // ignore cleanup errors
      }
    }
    this.cleanup();
    this.chunks.length = 0;
  }

  private async finalizeStop(): Promise<Blob | null> {
    const recorder = this.mediaRecorder;
    if (!recorder) {
      this.cleanup();
      return null;
    }

    if (recorder.state !== "inactive") {
      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
        recorder.stop();
      });
    }

    const blob = new Blob(this.chunks, {
      type: recorder.mimeType || "audio/webm",
    });
    this.cleanup();
    this.chunks.length = 0;
    if (!this.speechDetected) {
      return null;
    }
    if (blob.size <= 1_024) {
      return null;
    }
    return blob;
  }

  private cleanup(): void {
    if (this.monitorTimerId) {
      clearInterval(this.monitorTimerId);
      this.monitorTimerId = null;
    }
    if (this.maxDurationTimerId) {
      clearTimeout(this.maxDurationTimerId);
      this.maxDurationTimerId = null;
    }
    if (this.mediaStream) {
      for (const track of this.mediaStream.getTracks()) {
        track.stop();
      }
      this.mediaStream = null;
    }
    this.mediaRecorder = null;
    this.stateSignal.set("idle");
    this.levelSignal.set(0);
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
