import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { signal } from "@angular/core";

import { VoiceInputService } from "../../state/voice-input.service";
import { AiChatComposerComponent } from "./ai-chat-composer.component";

describe("AiChatComposerComponent", () => {
  let fixture: ComponentFixture<AiChatComposerComponent>;
  let component: AiChatComposerComponent;
  let voiceInputService: FakeVoiceInputService;

  beforeEach(async () => {
    localStorage.clear();
    voiceInputService = new FakeVoiceInputService();
    await TestBed.configureTestingModule({
      imports: [AiChatComposerComponent],
      providers: [{ provide: VoiceInputService, useValue: voiceInputService }],
    }).compileComponents();

    fixture = TestBed.createComponent(AiChatComposerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("canSend", true);
    fixture.componentRef.setInput("loading", false);
    fixture.componentRef.setInput("draft", "");
    fixture.detectChanges();
  });

  it("starts recording from voice button", async () => {
    const button = getVoiceButton();

    button.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(voiceInputService.start).toHaveBeenCalled();
  });

  it("persists selected voice language and uses it for next recording", async () => {
    const languageSelect = getLanguageSelect();
    languageSelect.value = "ar";
    languageSelect.dispatchEvent(new Event("change"));
    fixture.detectChanges();

    getVoiceButton().click();
    await fixture.whenStable();

    expect(localStorage.getItem("ai.voice.language")).toBe("ar");
    expect(voiceInputService.start).toHaveBeenCalledWith("ar");
  });

  it("stops recording then inserts transcript at cursor without auto submit", async () => {
    const submittedSpy = spyOn(component.submitted, "emit");
    const draftSpy = spyOn(component.draftChanged, "emit");
    const field = getTextarea();
    field.value = "عايز أعمل جديد للمريض";
    field.setSelectionRange(10, 10);
    voiceInputService.stateSignal.set("recording");
    voiceInputService.nextStopResult = {
      text: "order",
      provider: "groq",
    };
    fixture.detectChanges();

    getVoiceButton().click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(voiceInputService.stop).toHaveBeenCalled();
    expect(submittedSpy).not.toHaveBeenCalled();
    expect(draftSpy).toHaveBeenCalledWith("عايز أعمل order جديد للمريض");
  });

  it("keeps submit via Enter unchanged", () => {
    const submittedSpy = spyOn(component.submitted, "emit");
    const field = getTextarea();
    field.value = "hello";

    field.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );
    fixture.detectChanges();

    expect(submittedSpy).toHaveBeenCalledWith("hello");
  });

  it("shows stop icon + timer while recording", () => {
    voiceInputService.stateSignal.set("recording");
    voiceInputService.elapsedSignal.set(7);
    fixture.detectChanges();

    const timer = fixture.debugElement.query(By.css(".composer__recording-time"))
      .nativeElement as HTMLSpanElement;
    expect(timer.textContent?.trim()).toBe("00:07");
    expect(getVoiceButton().getAttribute("aria-pressed")).toBe("true");
  });

  it("shows spinner and disables voice button while transcribing", () => {
    voiceInputService.stateSignal.set("transcribing");
    fixture.detectChanges();

    expect(getVoiceButton().disabled).toBeTrue();
    expect(fixture.debugElement.query(By.css(".composer__spinner"))).not.toBeNull();
  });

  it("renders error status from voice service", () => {
    voiceInputService.stateSignal.set("error");
    voiceInputService.errorSignal.set("Voice requests are limited right now.");
    fixture.detectChanges();

    const status = fixture.debugElement.query(By.css(".composer__speech-status"))
      .nativeElement as HTMLSpanElement;
    expect(status.textContent).toContain("limited");
  });

  it("renders listening/transcribing status based on selected voice language not empty draft", async () => {
    fixture.componentRef.setInput("draft", "");
    fixture.detectChanges();
    const languageSelect = getLanguageSelect();
    languageSelect.value = "ar";
    languageSelect.dispatchEvent(new Event("change"));
    fixture.detectChanges();

    getVoiceButton().click();
    await fixture.whenStable();
    fixture.detectChanges();

    const status = fixture.debugElement.query(By.css(".composer__speech-status"))
      .nativeElement as HTMLSpanElement;
    expect(status.textContent).toContain("الاستماع");
  });

  it("renders ambiguity chips and inserts selected candidate", async () => {
    const field = getTextarea();
    field.value = "احجز مع ";
    field.setSelectionRange(field.value.length, field.value.length);
    voiceInputService.stateSignal.set("recording");
    voiceInputService.nextStopResult = {
      text: "",
      provider: "groq",
      ambiguities: [
        {
          kind: "doctor",
          candidates: [
            { id: "d1", label: "Dr Ahmed" },
            { id: "d2", label: "Dr Amr" },
          ],
        },
      ],
    };
    fixture.detectChanges();

    getVoiceButton().click();
    await fixture.whenStable();
    fixture.detectChanges();

    const ambiguityButton = fixture.debugElement.query(
      By.css('[data-testid="ambiguity-chip"]'),
    )?.nativeElement as HTMLButtonElement;
    expect(ambiguityButton).toBeTruthy();
    ambiguityButton.click();
    fixture.detectChanges();

    expect(field.value).toContain("Dr Ahmed");
  });

  function getVoiceButton(): HTMLButtonElement {
    return fixture.debugElement.query(By.css('[data-testid="ai-voice"] button'))
      .nativeElement as HTMLButtonElement;
  }

  function getTextarea(): HTMLTextAreaElement {
    return fixture.debugElement.query(By.css("#ai-prompt"))
      .nativeElement as HTMLTextAreaElement;
  }

  function getLanguageSelect(): HTMLSelectElement {
    return fixture.debugElement.query(By.css('[data-testid="voice-language"]'))
      .nativeElement as HTMLSelectElement;
  }
});

class FakeVoiceInputService {
  readonly stateSignal = signal<"idle" | "recording" | "transcribing" | "error">(
    "idle",
  );
  readonly elapsedSignal = signal(0);
  readonly errorSignal = signal("");
  readonly canRetrySignal = signal(false);
  readonly state = this.stateSignal.asReadonly();
  readonly elapsedSeconds = this.elapsedSignal.asReadonly();
  readonly errorMessage = this.errorSignal.asReadonly();
  readonly canRetry = this.canRetrySignal.asReadonly();
  nextStopResult:
    | {
        text: string;
        provider: string;
        ambiguities?: Array<{
          kind: "doctor" | "clinic" | "service" | "patient";
          candidates: Array<{ id: string; label: string }>;
        }>;
      }
    | null = null;

  readonly start = jasmine
    .createSpy("start")
    .and.callFake(async () => this.stateSignal.set("recording"));
  readonly stop = jasmine
    .createSpy("stop")
    .and.callFake(async () => {
      this.stateSignal.set("idle");
      return this.nextStopResult;
    });
  readonly cancel = jasmine.createSpy("cancel");
}
