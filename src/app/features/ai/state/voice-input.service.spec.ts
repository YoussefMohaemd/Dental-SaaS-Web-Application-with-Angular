import { TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";

import { AssistantDataService } from "@core/services/assistant-data.service";
import { VoiceInputService } from "./voice-input.service";

describe("VoiceInputService", () => {
  let service: VoiceInputService;
  let assistantDataService: jasmine.SpyObj<AssistantDataService>;
  let fakeTrack: { stop: jasmine.Spy };
  let mediaRecorderFactory: ((stream: MediaStream, options?: MediaRecorderOptions) => MediaRecorder) | null;
  let nowMs: number;
  let scheduledAutoStop: (() => void) | null;

  beforeEach(() => {
    assistantDataService = jasmine.createSpyObj<AssistantDataService>(
      "AssistantDataService",
      ["transcribe$"],
    );
    fakeTrack = { stop: jasmine.createSpy("stop") };
    mediaRecorderFactory = null;
    nowMs = 0;
    scheduledAutoStop = null;
    spyOn(Date, "now").and.callFake(() => nowMs);
    spyOn(window, "setTimeout").and.callFake(
      ((handler: TimerHandler) => {
        scheduledAutoStop =
          typeof handler === "function" ? (handler as () => void) : null;
        return 1;
      }) as typeof window.setTimeout,
    );

    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: jasmine
          .createSpy("getUserMedia")
          .and.resolveTo({ getTracks: () => [fakeTrack] }),
      },
    });

    (window as unknown as { MediaRecorder: typeof MediaRecorder }).MediaRecorder =
      class FakeMediaRecorder {
        static isTypeSupported(type: string): boolean {
          return type === "audio/webm;codecs=opus";
        }

        public ondataavailable: ((event: BlobEvent) => void) | null = null;
        public onstop: (() => void) | null = null;
        public state: RecordingState = "inactive";

        constructor(
          stream: MediaStream,
          options?: MediaRecorderOptions,
        ) {
          if (!mediaRecorderFactory) {
            return;
          }
          return mediaRecorderFactory(stream, options) as unknown as FakeMediaRecorder;
        }

        start(): void {}
        stop(): void {}
      } as unknown as typeof MediaRecorder;

    TestBed.configureTestingModule({
      providers: [
        VoiceInputService,
        { provide: AssistantDataService, useValue: assistantDataService },
      ],
    });
    service = TestBed.inject(VoiceInputService);
  });

  it("prefers audio/webm;codecs=opus when supported", async () => {
    const recorder = createRecorderSpy();
    mediaRecorderFactory = (_stream, options) => {
      recorder.capturedOptions = options;
      return recorder.instance;
    };

    await service.start();
    expect(recorder.capturedOptions?.mimeType).toBe("audio/webm;codecs=opus");
    expect(service.state()).toBe("recording");
  });

  it("uploads blob on stop and transitions to idle", async () => {
    const recorder = createRecorderSpy();
    mediaRecorderFactory = () => recorder.instance;
    assistantDataService.transcribe$.and.returnValue(
      of({ text: "عايز أعمل order", provider: "groq" }),
    );

    await service.start();
    nowMs = 1_000;
    recorder.emitData(new Blob([new Uint8Array(2_048)], { type: "audio/webm" }));
    const result = await service.stop();

    expect(assistantDataService.transcribe$).toHaveBeenCalled();
    expect(result?.text).toBe("عايز أعمل order");
    expect(service.state()).toBe("idle");
    expect(fakeTrack.stop).toHaveBeenCalled();
  });

  it("does not upload clips shorter than half second", async () => {
    const recorder = createRecorderSpy();
    mediaRecorderFactory = () => recorder.instance;

    await service.start();
    nowMs = 200;
    recorder.emitData(new Blob(["a"], { type: "audio/webm" }));
    const result = await service.stop();

    expect(result).toBeNull();
    expect(assistantDataService.transcribe$).not.toHaveBeenCalled();
  });

  it("maps rate-limit error to user friendly message", async () => {
    const recorder = createRecorderSpy();
    mediaRecorderFactory = () => recorder.instance;
    assistantDataService.transcribe$.and.returnValue(
      throwError(() => ({
        status: 429,
        error: { error: { code: "RATE_LIMITED" } },
      })),
    );

    await service.start();
    nowMs = 1_000;
    recorder.emitData(new Blob([new Uint8Array(2_048)], { type: "audio/webm" }));
    await service.stop();

    expect(service.state()).toBe("error");
    expect(service.errorMessage()).toContain("limit");
    expect(fakeTrack.stop).toHaveBeenCalled();
  });

  it("does not call backend when recorder produced no audio data", async () => {
    const recorder = createRecorderSpy();
    mediaRecorderFactory = () => recorder.instance;

    await service.start();
    nowMs = 1_000;
    const result = await service.stop();

    expect(result).toBeNull();
    expect(assistantDataService.transcribe$).not.toHaveBeenCalled();
    expect(service.state()).toBe("error");
    expect(service.errorMessage()).toContain("speech");
  });

  it("auto-stops after 60 seconds", async () => {
    const recorder = createRecorderSpy();
    mediaRecorderFactory = () => recorder.instance;
    assistantDataService.transcribe$.and.returnValue(of({ text: "ready", provider: "groq" }));

    await service.start();
    nowMs = 1_000;
    recorder.emitData(new Blob(["voice-data-more-than-half-second"], { type: "audio/webm" }));
    scheduledAutoStop?.();
    await Promise.resolve();

    expect(recorder.stop).toHaveBeenCalled();
    expect(fakeTrack.stop).toHaveBeenCalled();
  });
});

function createRecorderSpy(): {
  instance: MediaRecorder;
  stop: jasmine.Spy;
  emitData: (blob: Blob) => void;
  capturedOptions?: MediaRecorderOptions;
} {
  const state = { value: "inactive" as RecordingState };
  const listeners: {
    ondataavailable: ((event: BlobEvent) => void) | null;
    onstop: (() => void) | null;
  } = { ondataavailable: null, onstop: null };

  const stop = jasmine.createSpy("stop").and.callFake(() => {
    state.value = "inactive";
    listeners.onstop?.();
  });

  const instance = {
    start: jasmine.createSpy("start").and.callFake(() => {
      state.value = "recording";
    }),
    stop,
    get state() {
      return state.value;
    },
    set ondataavailable(handler: ((event: BlobEvent) => void) | null) {
      listeners.ondataavailable = handler;
    },
    get ondataavailable() {
      return listeners.ondataavailable;
    },
    set onstop(handler: (() => void) | null) {
      listeners.onstop = handler;
    },
    get onstop() {
      return listeners.onstop;
    },
  } as unknown as MediaRecorder;

  return {
    instance,
    stop,
    emitData: (blob: Blob) =>
      listeners.ondataavailable?.({ data: blob } as BlobEvent),
  };
}
