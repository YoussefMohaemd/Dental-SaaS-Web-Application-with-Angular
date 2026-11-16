import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { AiChatComposerComponent } from "./ai-chat-composer.component";

describe("AiChatComposerComponent", () => {
  let component: AiChatComposerComponent;
  let fixture: ComponentFixture<AiChatComposerComponent>;
  let recognition: FakeSpeechRecognition | null;

  beforeEach(async () => {
    recognition = null;
    FakeSpeechRecognition.instances = [];
    FakeSpeechRecognition.latest = null;
    FakeSpeechRecognition.throwOnStart = false;
    FakeSpeechRecognition.throwOnStartLanguages = [];
    FakeSpeechRecognition.throwOnStop = false;
    await TestBed.configureTestingModule({
      imports: [AiChatComposerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AiChatComposerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("draft", "");
    fixture.componentRef.setInput("canSend", true);
    fixture.componentRef.setInput("loading", false);
    fixture.detectChanges();
  });

  it("should emit submit on Enter", () => {
    spyOn(component.submitted, "emit");
    const textarea = fixture.debugElement.query(By.css("#ai-prompt"))
      .nativeElement as HTMLTextAreaElement;
    textarea.value = "Show services";
    textarea.dispatchEvent(new Event("input"));
    fixture.detectChanges();

    textarea.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", shiftKey: false }),
    );

    expect(component.submitted.emit).toHaveBeenCalledWith("Show services");
  });

  it("should not emit submit on Shift+Enter", () => {
    spyOn(component.submitted, "emit");
    const textarea = fixture.debugElement.query(By.css("#ai-prompt"))
      .nativeElement as HTMLTextAreaElement;
    textarea.value = "Line 1";
    textarea.dispatchEvent(new Event("input"));
    fixture.detectChanges();

    textarea.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", shiftKey: true }),
    );

    expect(component.submitted.emit).not.toHaveBeenCalled();
  });

  it("merges interim and final speech text without duplicating the final transcript", () => {
    Object.defineProperty(window, "SpeechRecognition", {
      configurable: true,
      value: FakeSpeechRecognition,
    });
    fixture.detectChanges();

    const textarea = fixture.debugElement.query(By.css("#ai-prompt"))
      .nativeElement as HTMLTextAreaElement;
    textarea.value = "Show";
    textarea.dispatchEvent(new Event("input"));
    fixture.detectChanges();
    const draftChanges: string[] = [];
    component.draftChanged.subscribe((value) => draftChanges.push(value));

    component.toggleSpeechInput();
    recognition = FakeSpeechRecognition.instances[0] ?? null;
    expect(recognition?.start).toHaveBeenCalled();
    expect(recognition?.lang).toBe("ar-EG");
    recognition?.onresult?.({
      resultIndex: 0,
      results: [speechResult(" services", false)],
    });
    recognition?.onresult?.({
      resultIndex: 0,
      results: [speechResult(" services", true)],
    });

    expect(draftChanges.at(-2)).toBe("Show services");
    expect(draftChanges.at(-1)).toBe("Show services");
    expect(component.isListening()).toBeTrue();

    recognition?.onend?.();
    FakeSpeechRecognition.instances[1]?.onend?.();
    expect(component.isListening()).toBeFalse();
  });

  it("keeps interim text that follows finalized speech", () => {
    Object.defineProperty(window, "SpeechRecognition", {
      configurable: true,
      value: FakeSpeechRecognition,
    });
    fixture.detectChanges();
    const textarea = fixture.debugElement.query(By.css("#ai-prompt"))
      .nativeElement as HTMLTextAreaElement;

    component.toggleSpeechInput();
    recognition = FakeSpeechRecognition.instances[0] ?? null;
    recognition?.onresult?.({
      resultIndex: 0,
      results: [speechResult("Hello", true)],
    });
    recognition?.onresult?.({
      resultIndex: 0,
      results: [
        speechResult("Hello", true),
        speechResult(" world", false),
      ],
    });

    expect(textarea.value).toBe("Hello world");
  });

  it("prefers the transcript script over incomparable cross-language confidence", () => {
    Object.defineProperty(window, "SpeechRecognition", {
      configurable: true,
      value: FakeSpeechRecognition,
    });
    fixture.detectChanges();
    const textarea = fixture.debugElement.query(By.css("#ai-prompt"))
      .nativeElement as HTMLTextAreaElement;

    component.toggleSpeechInput();
    const [arabic, english] = FakeSpeechRecognition.instances;

    expect(FakeSpeechRecognition.instances.map((item) => item.lang)).toEqual([
      "ar-EG",
      "en-US",
    ]);
    expect(arabic?.start).toHaveBeenCalled();
    expect(english?.start).toHaveBeenCalled();

    arabic?.onresult?.({
      resultIndex: 0,
      results: [speechResult("عمر خليل", true, 0.55)],
    });
    english?.onresult?.({
      resultIndex: 0,
      results: [speechResult("Omar Khalil", true, 0.95)],
    });
    expect(textarea.value).toBe("عمر خليل");

    english?.onresult?.({
      resultIndex: 0,
      results: [speechResult("omar khalil", true, 0.4)],
    });
    arabic?.onresult?.({
      resultIndex: 0,
      results: [speechResult("عمر خليل", true, 0.98)],
    });
    expect(textarea.value).toBe("عمر خليل");

    arabic?.onend?.();
    expect(component.isListening()).toBeTrue();
    english?.onend?.();
    expect(component.isListening()).toBeFalse();
  });

  it("uses the same button to stop recognition without submitting", () => {
    Object.defineProperty(window, "SpeechRecognition", {
      configurable: true,
      value: FakeSpeechRecognition,
    });
    fixture.detectChanges();
    spyOn(component.submitted, "emit");

    const button = fixture.debugElement.query(
      By.css('[data-testid="ai-voice"] button'),
    ).nativeElement as HTMLButtonElement;

    component.toggleSpeechInput();
    fixture.detectChanges();
    recognition = FakeSpeechRecognition.latest;

    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(button.querySelector("svg")).not.toBeNull();

    component.toggleSpeechInput();
    FakeSpeechRecognition.instances.forEach((item) => item.onend?.());

    expect(
      FakeSpeechRecognition.instances.every((item) => item.stop),
    ).toBeTrue();
    expect(component.isListening()).toBeFalse();
    expect(component.submitted.emit).not.toHaveBeenCalled();
  });

  it("removes interim speech text when recognition stops", () => {
    Object.defineProperty(window, "SpeechRecognition", {
      configurable: true,
      value: FakeSpeechRecognition,
    });
    fixture.detectChanges();
    const textarea = fixture.debugElement.query(By.css("#ai-prompt"))
      .nativeElement as HTMLTextAreaElement;

    component.toggleSpeechInput();
    recognition = FakeSpeechRecognition.latest;
    recognition?.onresult?.({
      resultIndex: 0,
      results: [speechResult("مرحبا", true), speechResult(" بالخدمات", false)],
    });
    recognition?.onend?.();

    expect(textarea.value).toBe("مرحبا");
  });

  it("preserves finalized text when both recognition sessions end", () => {
    Object.defineProperty(window, "SpeechRecognition", {
      configurable: true,
      value: FakeSpeechRecognition,
    });
    fixture.detectChanges();
    const textarea = fixture.debugElement.query(By.css("#ai-prompt"))
      .nativeElement as HTMLTextAreaElement;

    component.toggleSpeechInput();
    const [arabic, english] = FakeSpeechRecognition.instances;
    arabic?.onresult?.({
      resultIndex: 0,
      results: [
        speechResult("مرحبا", true, 0.9),
        speechResult(" بالخدمات", false, 0.3),
      ],
    });
    english?.onresult?.({
      resultIndex: 0,
      results: [speechResult("hello", true, 0.4)],
    });

    arabic?.onend?.();
    expect(textarea.value).toBe("مرحبا");
    english?.onend?.();
    expect(textarea.value).toBe("مرحبا");
  });

  it("ignores callbacks from a previous recognition session", () => {
    Object.defineProperty(window, "SpeechRecognition", {
      configurable: true,
      value: FakeSpeechRecognition,
    });
    fixture.detectChanges();

    component.toggleSpeechInput();
    const firstRecognition = FakeSpeechRecognition.latest;
    const staleEnd = firstRecognition?.onend;
    firstRecognition?.onerror?.({ error: "network" });

    component.toggleSpeechInput();
    recognition = FakeSpeechRecognition.latest;
    recognition?.onresult?.({
      resultIndex: 0,
      results: [speechResult("الجلسة الجديدة", true)],
    });
    staleEnd?.();

    expect(component.isListening()).toBeTrue();
    const textarea = fixture.debugElement.query(By.css("#ai-prompt"))
      .nativeElement as HTMLTextAreaElement;
    expect(textarea.value).toBe("الجلسة الجديدة");
  });

  it("does not repopulate the draft after submitting during recognition", () => {
    Object.defineProperty(window, "SpeechRecognition", {
      configurable: true,
      value: FakeSpeechRecognition,
    });
    fixture.detectChanges();
    spyOn(component.submitted, "emit");

    component.toggleSpeechInput();
    recognition = FakeSpeechRecognition.latest;
    const staleEnd = recognition?.onend;
    recognition?.onresult?.({
      resultIndex: 0,
      results: [speechResult("النص المرسل", true)],
    });

    component.onSubmit();
    staleEnd?.();

    const textarea = fixture.debugElement.query(By.css("#ai-prompt"))
      .nativeElement as HTMLTextAreaElement;
    expect(component.submitted.emit).toHaveBeenCalledWith("النص المرسل");
    expect(textarea.value).toBe("");
  });

  it("stops recognition and ignores callbacks when the composer is destroyed", () => {
    Object.defineProperty(window, "SpeechRecognition", {
      configurable: true,
      value: FakeSpeechRecognition,
    });
    fixture.detectChanges();
    const draftChanges: string[] = [];
    component.draftChanged.subscribe((value) => draftChanges.push(value));

    component.toggleSpeechInput();
    recognition = FakeSpeechRecognition.latest;
    const staleResult = recognition?.onresult;
    const staleEnd = recognition?.onend;

    fixture.destroy();
    staleResult?.({
      resultIndex: 0,
      results: [speechResult("بعد الإغلاق", true)],
    });
    staleEnd?.();

    expect(recognition?.stop).toHaveBeenCalled();
    expect(draftChanges).toEqual([]);
  });

  it("disables speech input when the browser does not support recognition", () => {
    delete (window as Window & { SpeechRecognition?: unknown })
      .SpeechRecognition;
    delete (window as Window & { webkitSpeechRecognition?: unknown })
      .webkitSpeechRecognition;
    fixture = TestBed.createComponent(AiChatComposerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("draft", "");
    fixture.componentRef.setInput("canSend", true);
    fixture.componentRef.setInput("loading", false);
    fixture.detectChanges();

    const button = fixture.debugElement.query(
      By.css('[data-testid="ai-voice"] button'),
    ).nativeElement as HTMLButtonElement;

    expect(button.disabled).toBeTrue();
    expect(component.speechStatus()).toContain("not supported");
  });

  it("keeps captured text and reports recognition errors without submitting", () => {
    Object.defineProperty(window, "SpeechRecognition", {
      configurable: true,
      value: FakeSpeechRecognition,
    });
    fixture.detectChanges();
    spyOn(component.submitted, "emit");
    const draftChanges: string[] = [];
    component.draftChanged.subscribe((value) => draftChanges.push(value));

    component.toggleSpeechInput();
    recognition = FakeSpeechRecognition.latest;
    recognition?.onresult?.({
      resultIndex: 0,
      results: [speechResult("hello", true), speechResult(" services", false)],
    });
    recognition?.onerror?.({ error: "network" });
    recognition?.onend?.();
    FakeSpeechRecognition.instances[0]?.onerror?.({ error: "network" });
    FakeSpeechRecognition.instances[0]?.onend?.();

    expect(draftChanges.at(-1)).toBe("hello");
    expect(component.isListening()).toBeFalse();
    expect(component.speechStatus()).toContain("failed");
    expect(component.submitted.emit).not.toHaveBeenCalled();
  });

  it("keeps a successful transcript when the other recognizer errors", () => {
    Object.defineProperty(window, "SpeechRecognition", {
      configurable: true,
      value: FakeSpeechRecognition,
    });
    fixture.detectChanges();

    component.toggleSpeechInput();
    const [arabic, english] = FakeSpeechRecognition.instances;
    arabic?.onerror?.({ error: "no-speech" });
    english?.onresult?.({
      resultIndex: 0,
      results: [speechResult("Hello", true, 0.9)],
    });
    english?.onend?.();

    const textarea = fixture.debugElement.query(By.css("#ai-prompt"))
      .nativeElement as HTMLTextAreaElement;
    expect(textarea.value).toBe("Hello");
    expect(component.speechStatus()).not.toContain("failed");
  });

  it("waits for all recognizers before showing a failure status", () => {
    Object.defineProperty(window, "SpeechRecognition", {
      configurable: true,
      value: FakeSpeechRecognition,
    });
    fixture.detectChanges();

    component.toggleSpeechInput();
    const [arabic, english] = FakeSpeechRecognition.instances;
    arabic?.onerror?.({ error: "no-speech" });

    expect(component.speechStatus()).toBe("Listening...");

    english?.onresult?.({
      resultIndex: 0,
      results: [speechResult("Hello", true, 0.9)],
    });
    english?.onend?.();

    expect(component.speechStatus()).toBe("Voice input stopped.");
  });

  it("keeps finalized English text over Arabic interim text", () => {
    Object.defineProperty(window, "SpeechRecognition", {
      configurable: true,
      value: FakeSpeechRecognition,
    });
    fixture.detectChanges();

    component.toggleSpeechInput();
    const [arabic, english] = FakeSpeechRecognition.instances;
    arabic?.onresult?.({
      resultIndex: 0,
      results: [speechResult("اعرض الطلبات", false, 0.99)],
    });
    english?.onresult?.({
      resultIndex: 0,
      results: [speechResult("Show orders", true, 0.1)],
    });

    const textarea = fixture.debugElement.query(By.css("#ai-prompt"))
      .nativeElement as HTMLTextAreaElement;
    expect(textarea.value).toBe("Show orders");
  });

  it("prefers Arabic-script alternatives from the same recognition result", () => {
    Object.defineProperty(window, "SpeechRecognition", {
      configurable: true,
      value: FakeSpeechRecognition,
    });
    fixture.detectChanges();

    component.toggleSpeechInput();
    const [arabic] = FakeSpeechRecognition.instances;
    arabic?.onresult?.({
      resultIndex: 0,
      results: [
        speechResultWithAlternatives(
          [
            { transcript: "salam", confidence: 0.95 },
            { transcript: "سلام", confidence: 0.4 },
          ],
          true,
        ),
      ],
    });

    const textarea = fixture.debugElement.query(By.css("#ai-prompt"))
      .nativeElement as HTMLTextAreaElement;
    expect(textarea.value).toBe("سلام");
  });

  it("normalizes Arabic transcript output before it is written", () => {
    Object.defineProperty(window, "SpeechRecognition", {
      configurable: true,
      value: FakeSpeechRecognition,
    });
    fixture.detectChanges();

    component.toggleSpeechInput();
    const [arabic] = FakeSpeechRecognition.instances;
    arabic?.onresult?.({
      resultIndex: 0,
      results: [speechResult("الــــسَّلامُ   عليكم", true, 0.9)],
    });

    const textarea = fixture.debugElement.query(By.css("#ai-prompt"))
      .nativeElement as HTMLTextAreaElement;
    expect(textarea.value).toBe("السلام عليكم");
  });

  it("reports a retryable failure when both recognizers end without text", () => {
    Object.defineProperty(window, "SpeechRecognition", {
      configurable: true,
      value: FakeSpeechRecognition,
    });
    fixture.detectChanges();

    component.toggleSpeechInput();
    FakeSpeechRecognition.instances.forEach((item) => item.onend?.());

    expect(component.isListening()).toBeFalse();
    expect(component.speechStatus()).toBe("Voice input failed. Try again.");
  });

  it("uses Arabic status copy for an Arabic draft", () => {
    fixture.componentRef.setInput("draft", "اعرض الطلبات");
    fixture.detectChanges();
    Object.defineProperty(window, "SpeechRecognition", {
      configurable: true,
      value: FakeSpeechRecognition,
    });
    fixture.detectChanges();

    component.toggleSpeechInput();
    expect(component.speechStatus()).toBe("جاري الاستماع...");

    FakeSpeechRecognition.instances.forEach((item) => item.onend?.());
    expect(component.speechStatus()).toBe("تم إيقاف الإدخال الصوتي.");
  });

  it("uses Arabic unsupported-browser status for an Arabic draft", () => {
    delete (window as Window & { SpeechRecognition?: unknown })
      .SpeechRecognition;
    delete (window as Window & { webkitSpeechRecognition?: unknown })
      .webkitSpeechRecognition;
    fixture = TestBed.createComponent(AiChatComposerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("draft", "اعرض الطلبات");
    fixture.componentRef.setInput("canSend", true);
    fixture.componentRef.setInput("loading", false);
    fixture.detectChanges();

    expect(component.speechStatus()).toBe(
      "الإدخال الصوتي غير مدعوم في هذا المتصفح.",
    );
  });

  it("cleans up when recognition start fails synchronously", () => {
    Object.defineProperty(window, "SpeechRecognition", {
      configurable: true,
      value: FakeSpeechRecognition,
    });
    fixture.detectChanges();

    FakeSpeechRecognition.throwOnStart = true;

    component.toggleSpeechInput();

    expect(component.isListening()).toBeFalse();
    expect(component.speechStatus()).toContain("failed");
  });

  it("keeps the other recognizer active when one language fails to start", () => {
    Object.defineProperty(window, "SpeechRecognition", {
      configurable: true,
      value: FakeSpeechRecognition,
    });
    fixture.detectChanges();
    FakeSpeechRecognition.throwOnStartLanguages = ["ar-EG"];

    component.toggleSpeechInput();

    expect(FakeSpeechRecognition.instances[0]?.start).toHaveBeenCalled();
    expect(FakeSpeechRecognition.instances[1]?.start).toHaveBeenCalled();
    expect(component.isListening()).toBeTrue();

    FakeSpeechRecognition.instances[1]?.onend?.();
    expect(component.isListening()).toBeFalse();
  });

  it("does not throw when stopping recognition fails", () => {
    Object.defineProperty(window, "SpeechRecognition", {
      configurable: true,
      value: FakeSpeechRecognition,
    });
    fixture.detectChanges();
    FakeSpeechRecognition.throwOnStop = true;

    component.toggleSpeechInput();

    expect(() => component.toggleSpeechInput()).not.toThrow();
    expect(component.isListening()).toBeFalse();
  });
});

class FakeSpeechRecognition {
  static instances: FakeSpeechRecognition[] = [];
  static latest: FakeSpeechRecognition | null = null;
  static throwOnStart = false;
  static throwOnStartLanguages: string[] = [];
  static throwOnStop = false;

  lang = "";
  interimResults = false;
  continuous = true;
  start = jasmine.createSpy("start").and.callFake(() => {
    if (
      FakeSpeechRecognition.throwOnStart ||
      FakeSpeechRecognition.throwOnStartLanguages.includes(this.lang)
    ) {
      throw new Error("permission denied");
    }
  });
  stop = jasmine.createSpy("stop").and.callFake(() => {
    if (FakeSpeechRecognition.throwOnStop) {
      throw new Error("stop failed");
    }
  });
  onresult: ((event: SpeechRecognitionEventLike) => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null = null;

  constructor() {
    FakeSpeechRecognition.instances.push(this);
    FakeSpeechRecognition.latest = this;
  }
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string; confidence?: number };
  }>;
}

interface SpeechRecognitionErrorEventLike {
  error?: string;
}

function speechResult(
  transcript: string,
  isFinal: boolean,
  confidence?: number,
): {
  isFinal: boolean;
  0: { transcript: string; confidence?: number };
  length: number;
} {
  return {
    isFinal,
    0: { transcript, confidence },
    length: 1,
  };
}

function speechResultWithAlternatives(
  alternatives: Array<{ transcript: string; confidence?: number }>,
  isFinal: boolean,
): {
  isFinal: boolean;
  0: { transcript: string; confidence?: number };
  length: number;
  [index: number]: { transcript: string; confidence?: number };
} {
  const fallback = alternatives[0] ?? { transcript: "" };
  return {
    isFinal,
    0: fallback,
    length: Math.max(1, alternatives.length),
    ...Object.fromEntries(
      alternatives.map((alternative, index) => [index, alternative]),
    ),
  };
}
