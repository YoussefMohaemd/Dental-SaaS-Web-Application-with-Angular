import { signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";

import { AssistantDataService } from "@core/services/assistant-data.service";
import { VoiceRecorderService } from "./voice-recorder.service";
import { VoiceInputService } from "./voice-input.service";

describe("VoiceInputService", () => {
  let service: VoiceInputService;
  let assistantDataService: jasmine.SpyObj<AssistantDataService>;
  let recorder: FakeVoiceRecorderService;
  let nowMs: number;

  beforeEach(() => {
    assistantDataService = jasmine.createSpyObj<AssistantDataService>(
      "AssistantDataService",
      ["transcribe$"],
    );
    recorder = new FakeVoiceRecorderService();
    nowMs = 0;
    spyOn(Date, "now").and.callFake(() => nowMs);

    TestBed.configureTestingModule({
      providers: [
        VoiceInputService,
        { provide: AssistantDataService, useValue: assistantDataService },
        { provide: VoiceRecorderService, useValue: recorder },
      ],
    });
    service = TestBed.inject(VoiceInputService);
  });

  it("starts recorder with selected language", async () => {
    await service.start("ar");

    expect(recorder.start).toHaveBeenCalledWith({ language: "ar" });
    expect(service.state()).toBe("recording");
  });

  it("uploads blob on stop and transitions to idle", async () => {
    recorder.nextBlob = new Blob([new Uint8Array(2_048)], { type: "audio/webm" });
    assistantDataService.transcribe$.and.returnValue(
      of({ text: "عايز أعمل order", provider: "groq" }),
    );

    await service.start("en");
    nowMs = 1_000;
    const result = await service.stop("en");

    expect(assistantDataService.transcribe$).toHaveBeenCalledWith(
      jasmine.any(Blob),
      "en",
    );
    expect(result?.text).toBe("عايز أعمل order");
    expect(service.state()).toBe("idle");
  });

  it("keeps the recording after a 503 and retries without re-recording", async () => {
    recorder.nextBlob = new Blob([new Uint8Array(2_048)], { type: "audio/webm" });
    assistantDataService.transcribe$.and.returnValues(
      throwError(() => ({ status: 503 })),
      of({ text: "hello doctor", provider: "gemini" }),
    );

    await service.start("en");
    nowMs = 1_000;
    const first = await service.stop("en");

    expect(first).toBeNull();
    expect(service.state()).toBe("error");
    expect(service.canRetry()).toBeTrue();

    const second = await service.retry("en");

    expect(second?.text).toBe("hello doctor");
    expect(service.state()).toBe("idle");
    expect(service.canRetry()).toBeFalse();
    expect(recorder.start).toHaveBeenCalledTimes(1);
    expect(assistantDataService.transcribe$).toHaveBeenCalledTimes(2);
  });

  it("does not offer retry for non-transient errors", async () => {
    recorder.nextBlob = new Blob([new Uint8Array(2_048)], { type: "audio/webm" });
    assistantDataService.transcribe$.and.returnValue(
      throwError(() => ({ status: 415 })),
    );

    await service.start("en");
    nowMs = 1_000;
    await service.stop("en");

    expect(service.canRetry()).toBeFalse();
  });

  it("does not upload clips shorter than half second", async () => {
    recorder.nextBlob = new Blob([new Uint8Array(2_048)], { type: "audio/webm" });

    await service.start("ar");
    nowMs = 200;
    const result = await service.stop("ar");

    expect(result).toBeNull();
    expect(assistantDataService.transcribe$).not.toHaveBeenCalled();
  });

  it("maps rate-limit error to user friendly message", async () => {
    recorder.nextBlob = new Blob([new Uint8Array(2_048)], { type: "audio/webm" });
    assistantDataService.transcribe$.and.returnValue(
      throwError(() => ({
        status: 429,
        error: { error: { code: "RATE_LIMITED" } },
      })),
    );

    await service.start("en");
    nowMs = 1_000;
    await service.stop("en");

    expect(service.state()).toBe("error");
    expect(service.errorMessage()).toContain("limited");
  });

  it("returns null when recorder reports no speech", async () => {
    recorder.nextBlob = null;

    await service.start("ar");
    nowMs = 1_000;
    const result = await service.stop("ar");

    expect(result).toBeNull();
    expect(assistantDataService.transcribe$).not.toHaveBeenCalled();
    expect(service.state()).toBe("error");
  });
});

class FakeVoiceRecorderService {
  private readonly levelSignal = signal(0);
  private readonly stateSignal = signal<"idle" | "recording">("idle");
  readonly level = this.levelSignal.asReadonly();
  readonly state = this.stateSignal.asReadonly();
  nextBlob: Blob | null = null;
  readonly start = jasmine
    .createSpy("start")
    .and.callFake(async () => this.stateSignal.set("recording"));
  readonly stop = jasmine.createSpy("stop").and.callFake(async () => {
    this.stateSignal.set("idle");
    return this.nextBlob;
  });
  readonly cancel = jasmine
    .createSpy("cancel")
    .and.callFake(() => this.stateSignal.set("idle"));
}
