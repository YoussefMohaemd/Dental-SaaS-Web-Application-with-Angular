import { TestBed } from "@angular/core/testing";

import { VoiceRecorderService } from "./voice-recorder.service";

describe("VoiceRecorderService", () => {
  let service: VoiceRecorderService;
  let getUserMediaSpy: jasmine.Spy;
  let latestRecorder: { emitData: (blob: Blob) => void } | null;

  beforeEach(() => {
    latestRecorder = null;
    getUserMediaSpy = jasmine
      .createSpy("getUserMedia")
      .and.resolveTo({ getTracks: () => [{ stop: jasmine.createSpy("stop") }] });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: getUserMediaSpy,
      },
    });

    class FakeMediaRecorder {
        static isTypeSupported(): boolean {
          return true;
        }

        public ondataavailable: ((event: BlobEvent) => void) | null = null;
        public onstop: (() => void) | null = null;
        public state: RecordingState = "inactive";
        public mimeType = "audio/webm";
        public constructor() {
          latestRecorder = this;
        }

        start(): void {
          this.state = "recording";
        }

        emitData(blob: Blob): void {
          this.ondataavailable?.({ data: blob } as BlobEvent);
        }

        stop(): void {
          this.state = "inactive";
          this.onstop?.();
        }
      }
    (window as unknown as { MediaRecorder: typeof MediaRecorder }).MediaRecorder =
      FakeMediaRecorder as unknown as typeof MediaRecorder;

    TestBed.configureTestingModule({
      providers: [VoiceRecorderService],
    });
    service = TestBed.inject(VoiceRecorderService);
  });

  it("requests getUserMedia with echoCancellation + noiseSuppression + autoGainControl", async () => {
    await service.start({ language: "ar" });

    expect(getUserMediaSpy).toHaveBeenCalledWith({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
  });

  it("returns null when RMS never exceeds speech threshold", async () => {
    await service.start({
      language: "en",
      speechRmsThreshold: 0.2,
      levelSource: () => 0.01,
    });

    const blob = await service.stop();
    expect(blob).toBeNull();
  });

  it("returns recorded blob when audio data exists even without levelSource", async () => {
    await service.start({ language: "en" });
    latestRecorder?.emitData(
      new Blob([new Uint8Array(2_048)], { type: "audio/webm" }),
    );

    const blob = await service.stop();
    expect(blob).toBeTruthy();
  });

  it("stops after silenceMs once speech ended", async () => {
    let ticks = 0;
    await service.start({
      language: "en",
      speechRmsThreshold: 0.1,
      silenceMs: 300,
      levelSource: () => {
        ticks += 1;
        return ticks < 3 ? 0.25 : 0;
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 900));
    expect(service.state()).toBe("idle");
  });
});
