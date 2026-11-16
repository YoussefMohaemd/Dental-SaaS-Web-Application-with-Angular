import { CommonModule } from "@angular/common";
import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  input,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  output,
  signal,
  viewChild,
} from "@angular/core";
import { AppButtonComponent } from "@shared/components/button/button.component";
import {
  detectAiInputLanguage,
  type AiInputLanguage,
} from "../../state/ai-language";

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence?: number;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorEventLike {
  error?: string;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  start(): void;
  stop(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

const SPEECH_LANGUAGES = ["ar-EG", "en-US"] as const;
type SpeechLanguage = (typeof SPEECH_LANGUAGES)[number];
const ARABIC_SCRIPT_PATTERN = /[\u0600-\u06ff]/;
const LATIN_SCRIPT_PATTERN = /[A-Za-z]/;
const ARABIC_DIACRITICS_PATTERN = /[\u064b-\u065f\u0670]/g;
const ARABIC_TATWEEL_PATTERN = /\u0640/g;
const SPACE_BEFORE_PUNCTUATION_PATTERN = /\s+([،,.!?؟:;])/g;

interface SpeechCandidate {
  finalizedText: string;
  interimText: string;
  confidence: number | null;
  updateOrder: number;
}

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
  private speechRecognitions: SpeechRecognitionLike[] = [];
  private speechFinishedRecognitions = new Set<SpeechRecognitionLike>();
  private speechCandidates: Record<SpeechLanguage, SpeechCandidate> =
    this.createSpeechCandidates();
  private activeSpeechRecognitionCount = 0;
  private speechUpdateOrder = 0;
  private speechBaseDraft = "";
  private speechStopping = false;
  private speechStarting = false;
  private speechErroredRecognitions = new Set<SpeechRecognitionLike>();
  private speechSuccessfulRecognitions = new Set<SpeechRecognitionLike>();
  private speechSessionId = 0;
  private readonly speechStatusText = signal("");

  readonly isListening = signal(false);
  readonly speechSupported = computed(
    () => getSpeechRecognitionConstructor() !== null,
  );
  readonly speechStatus = computed(
    () =>
      this.speechStatusText() ||
      (!this.speechSupported()
        ? this.speechMessage(
            "Voice input is not supported in this browser.",
            "الإدخال الصوتي غير مدعوم في هذا المتصفح.",
          )
        : ""),
  );

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

    if (this.isListening()) {
      this.cancelSpeechInput();
    }
    this.submitted.emit(prompt);
    if (field) {
      field.value = "";
      field.style.height = "auto";
      field.focus();
    }
    this.draftChanged.emit("");
  }

  toggleSpeechInput(): void {
    if (this.isListening()) {
      this.speechStopping = true;
      for (const recognition of this.speechRecognitions) {
        if (this.speechFinishedRecognitions.has(recognition)) {
          continue;
        }
        this.stopSpeechRecognition(recognition, true);
      }
      return;
    }

    const Recognition = getSpeechRecognitionConstructor();
    if (!Recognition) {
      this.setSpeechStatus(
        "Voice input is not supported in this browser.",
        "الإدخال الصوتي غير مدعوم في هذا المتصفح.",
      );
      return;
    }

    this.speechBaseDraft = this.currentDraftValue().trim();
    this.speechCandidates = this.createSpeechCandidates();
    this.speechRecognitions = [];
    this.speechFinishedRecognitions.clear();
    this.activeSpeechRecognitionCount = 0;
    this.speechStopping = false;
    this.speechStarting = true;
    this.speechErroredRecognitions.clear();
    this.speechSuccessfulRecognitions.clear();
    const sessionId = ++this.speechSessionId;
    this.isListening.set(true);
    this.setSpeechStatus("Listening...", "جاري الاستماع...");

    for (const language of SPEECH_LANGUAGES) {
      let recognition: SpeechRecognitionLike;
      try {
        recognition = new Recognition();
      } catch {
        this.setSpeechStatus(
          "Voice input failed. Try again.",
          "فشل الإدخال الصوتي. حاول مرة أخرى.",
        );
        continue;
      }
      recognition.lang = language;
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.onresult = (event) => {
        if (this.isCurrentSpeechSession(sessionId, recognition)) {
          this.onSpeechResult(language, event);
        }
      };
      recognition.onend = () => {
        if (this.isCurrentSpeechSession(sessionId, recognition)) {
          this.onSpeechEndForRecognition(language, recognition);
        }
      };
      recognition.onerror = () => {
        if (this.isCurrentSpeechSession(sessionId, recognition)) {
          this.onSpeechErrorForRecognition(recognition);
        }
      };
      this.speechRecognitions.push(recognition);
      this.activeSpeechRecognitionCount += 1;
      try {
        recognition.start();
      } catch {
        this.onSpeechErrorForRecognition(recognition);
      }
    }

    this.speechStarting = false;
    if (this.activeSpeechRecognitionCount === 0) {
      this.completeSpeechSession();
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }
    event.preventDefault();
    this.onSubmit();
  }

  ngOnDestroy(): void {
    const recognitions = this.releaseSpeechSession();
    recognitions.forEach((recognition) =>
      this.stopSpeechRecognition(recognition),
    );
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

  private currentDraftValue(): string {
    return this.promptField()?.nativeElement.value ?? this.draft();
  }

  private onSpeechResult(
    language: SpeechLanguage,
    event: SpeechRecognitionEventLike,
  ): void {
    let finalized = "";
    let interim = "";
    let strongestConfidence: number | null = null;
    for (let index = 0; index < event.results.length; index += 1) {
      const result = event.results[index];
      if (!result) {
        continue;
      }
      const bestAlternative = this.pickBestAlternative(result, language);
      const transcript = this.normalizeSpeechFragment(
        bestAlternative.transcript,
      );
      if (transcript.length === 0) {
        continue;
      }
      const confidence = bestAlternative.confidence;
      if (
        typeof confidence === "number" &&
        Number.isFinite(confidence) &&
        (strongestConfidence === null || confidence > strongestConfidence)
      ) {
        strongestConfidence = confidence;
      }
      if (result.isFinal) {
        finalized = this.appendSpeechChunk(finalized, transcript);
      } else {
        interim = this.appendSpeechChunk(interim, transcript);
      }
    }

    const candidate = this.speechCandidates[language];
    candidate.finalizedText = finalized;
    candidate.interimText = interim;
    candidate.confidence =
      strongestConfidence === null
        ? candidate.confidence
        : candidate.confidence === null
          ? strongestConfidence
          : Math.max(candidate.confidence, strongestConfidence);
    candidate.updateOrder = ++this.speechUpdateOrder;
    this.emitSpeechDraft(true);
    this.setSpeechStatus("Listening...", "جاري الاستماع...");
  }

  private onSpeechEndForRecognition(
    language: SpeechLanguage,
    recognition: SpeechRecognitionLike,
  ): void {
    this.speechCandidates[language].interimText = "";
    if (
      !this.speechErroredRecognitions.has(recognition) &&
      this.speechCandidates[language].finalizedText.length > 0
    ) {
      this.speechSuccessfulRecognitions.add(recognition);
    }
    this.finishSpeechRecognition(recognition);
  }

  private onSpeechErrorForRecognition(recognition: SpeechRecognitionLike): void {
    this.speechErroredRecognitions.add(recognition);
    const language = this.languageForRecognition(recognition);
    if (language) {
      this.speechCandidates[language].interimText = "";
    }
    this.finishSpeechRecognition(recognition);
  }

  private cancelSpeechInput(): void {
    const recognitions = this.releaseSpeechSession();
    this.speechBaseDraft = "";
    this.speechCandidates = this.createSpeechCandidates();
    recognitions.forEach((recognition) =>
      this.stopSpeechRecognition(recognition),
    );
  }

  private stopSpeechRecognition(
    recognition: SpeechRecognitionLike,
    reportSessionError = false,
  ): void {
    try {
      recognition.stop();
    } catch {
      if (reportSessionError) {
        this.onSpeechErrorForRecognition(recognition);
      } else {
        this.setSpeechStatus(
          "Voice input failed. Try again.",
          "فشل الإدخال الصوتي. حاول مرة أخرى.",
        );
      }
    }
  }

  private isCurrentSpeechSession(
    sessionId: number,
    recognition: SpeechRecognitionLike,
  ): boolean {
    return (
      this.speechSessionId === sessionId &&
      this.speechRecognitions.includes(recognition)
    );
  }

  private releaseSpeechSession(): SpeechRecognitionLike[] {
    const recognitions = this.speechRecognitions;
    this.speechSessionId += 1;
    this.speechRecognitions = [];
    this.speechFinishedRecognitions.clear();
    this.speechErroredRecognitions.clear();
    this.speechSuccessfulRecognitions.clear();
    this.activeSpeechRecognitionCount = 0;
    this.speechStarting = false;
    this.isListening.set(false);
    for (const recognition of recognitions) {
      recognition.onresult = null;
      recognition.onend = null;
      recognition.onerror = null;
    }
    return recognitions;
  }

  private emitSpeechDraft(includeInterim: boolean): void {
    const speechText = this.selectSpeechText(includeInterim);
    const nextDraft = [
      this.speechBaseDraft,
      speechText,
    ]
      .filter((value) => value.length > 0)
      .join(" ");
    this.draftChanged.emit(nextDraft);
    const field = this.promptField()?.nativeElement;
    if (field) {
      field.value = nextDraft;
      this.resize();
    }
  }

  private finishSpeechRecognition(recognition: SpeechRecognitionLike): void {
    if (this.speechFinishedRecognitions.has(recognition)) {
      return;
    }
    this.speechFinishedRecognitions.add(recognition);
    this.activeSpeechRecognitionCount = Math.max(
      0,
      this.activeSpeechRecognitionCount - 1,
    );
    this.emitSpeechDraft(true);
    if (this.activeSpeechRecognitionCount === 0 && !this.speechStarting) {
      this.completeSpeechSession();
    }
  }

  private completeSpeechSession(): void {
    this.isListening.set(false);
    this.emitSpeechDraft(false);
    if (
      this.speechSuccessfulRecognitions.size > 0 ||
      this.speechBaseDraft.length > 0
    ) {
      this.setSpeechStatus("Voice input stopped.", "تم إيقاف الإدخال الصوتي.");
    } else {
      this.setSpeechStatus(
        "Voice input failed. Try again.",
        "فشل الإدخال الصوتي. حاول مرة أخرى.",
      );
    }
    for (const recognition of this.speechRecognitions) {
      recognition.onresult = null;
      recognition.onend = null;
      recognition.onerror = null;
    }
    this.speechRecognitions = [];
    this.speechFinishedRecognitions.clear();
    this.speechErroredRecognitions.clear();
    this.speechSuccessfulRecognitions.clear();
    this.activeSpeechRecognitionCount = 0;
    this.speechStarting = false;
  }

  private languageForRecognition(
    recognition: SpeechRecognitionLike,
  ): SpeechLanguage | null {
    return SPEECH_LANGUAGES.includes(recognition.lang as SpeechLanguage)
      ? (recognition.lang as SpeechLanguage)
      : null;
  }

  private selectSpeechText(includeInterim: boolean): string {
    const candidates = SPEECH_LANGUAGES.map((language) => ({
      language,
      candidate: this.speechCandidates[language],
      text: includeInterim
        ? [
            this.speechCandidates[language].finalizedText,
            this.speechCandidates[language].interimText,
          ]
            .filter((value) => value.length > 0)
            .join(" ")
        : this.speechCandidates[language].finalizedText,
    })).filter(({ text }) => text.length > 0);
    if (candidates.length === 0) {
      return "";
    }

    const finalizedCandidates = candidates.filter(
      ({ candidate }) => candidate.finalizedText.length > 0,
    );
    const preferredCandidates =
      finalizedCandidates.length > 0 ? finalizedCandidates : candidates;
    const arabicScriptMatch = preferredCandidates.filter(({ text }) =>
      /[\u0600-\u06ff]/.test(text),
    );
    const latinScriptMatch = preferredCandidates.filter(({ text }) =>
      /[A-Za-z]/.test(text) && !/[\u0600-\u06ff]/.test(text),
    );
    const scriptMatch =
      arabicScriptMatch.length > 0
        ? arabicScriptMatch
        : latinScriptMatch;
    const languageCandidates =
      scriptMatch.length > 0 ? scriptMatch : preferredCandidates;
    const hasConfidence = languageCandidates.some(
      ({ candidate }) => candidate.confidence !== null,
    );
    if (hasConfidence) {
      const strongestConfidence = Math.max(
        ...languageCandidates.map(
          ({ candidate }) => candidate.confidence ?? -1,
        ),
      );
      const strongest = languageCandidates.filter(
        ({ candidate }) => (candidate.confidence ?? -1) === strongestConfidence,
      );
      if (strongest.length === 1) {
        return strongest[0].text;
      }
      return [...strongest].sort(
        (left, right) =>
          right.candidate.updateOrder - left.candidate.updateOrder,
      )[0]?.text ?? "";
    }

    const fallback = languageCandidates.sort(
      (left, right) => right.candidate.updateOrder - left.candidate.updateOrder,
    );
    return fallback[0].text;
  }

  voiceActionLabel(): string {
    const isArabic =
      detectAiInputLanguage(this.currentDraftValue().trim()) !== "en";
    if (isArabic) {
      return this.isListening() ? "إيقاف الإدخال الصوتي" : "بدء الإدخال الصوتي";
    }
    return this.isListening() ? "Stop voice input" : "Start voice input";
  }

  voiceButtonTitle(): string {
    if (!this.speechSupported()) {
      return this.speechMessage(
        "Voice input is not supported in this browser",
        "الإدخال الصوتي غير مدعوم في هذا المتصفح",
      );
    }
    return this.voiceActionLabel();
  }

  private setSpeechStatus(english: string, arabic: string): void {
    this.speechStatusText.set(this.speechMessage(english, arabic));
  }

  private speechMessage(english: string, arabic: string): string {
    return this.speechLanguage() === "en" ? english : arabic;
  }

  private speechLanguage(): AiInputLanguage {
    const baseDraft =
      this.speechBaseDraft || this.draft().trim() || this.currentDraftValue();
    const value = [baseDraft, this.selectSpeechText(true)]
      .filter((item) => item.length > 0)
      .join(" ");
    return detectAiInputLanguage(value);
  }

  private createSpeechCandidates(): Record<SpeechLanguage, SpeechCandidate> {
    return {
      "ar-EG": {
        finalizedText: "",
        interimText: "",
        confidence: null,
        updateOrder: 0,
      },
      "en-US": {
        finalizedText: "",
        interimText: "",
        confidence: null,
        updateOrder: 0,
      },
    };
  }

  private pickBestAlternative(
    result: SpeechRecognitionResultLike,
    language: SpeechLanguage,
  ): SpeechRecognitionAlternativeLike {
    let bestAlternative = result[0];
    let bestScore = Number.NEGATIVE_INFINITY;
    for (let index = 0; index < result.length; index += 1) {
      const alternative = result[index];
      if (!alternative) {
        continue;
      }
      const score = this.scoreAlternative(alternative, language);
      if (score > bestScore) {
        bestScore = score;
        bestAlternative = alternative;
      }
    }
    return bestAlternative;
  }

  private scoreAlternative(
    alternative: SpeechRecognitionAlternativeLike,
    language: SpeechLanguage,
  ): number {
    const normalizedTranscript = this.normalizeSpeechFragment(
      alternative.transcript,
    );
    const confidence =
      typeof alternative.confidence === "number" &&
      Number.isFinite(alternative.confidence)
        ? alternative.confidence
        : 0;
    const hasArabic = ARABIC_SCRIPT_PATTERN.test(normalizedTranscript);
    const hasLatin = LATIN_SCRIPT_PATTERN.test(normalizedTranscript);
    const scriptScore =
      language === "ar-EG"
        ? hasArabic
          ? 1
          : hasLatin
            ? -0.5
            : 0
        : hasLatin && !hasArabic
          ? 0.5
          : hasArabic
            ? -0.5
            : 0;
    return confidence + scriptScore;
  }

  private appendSpeechChunk(base: string, chunk: string): string {
    return [base, chunk].filter((value) => value.length > 0).join(" ");
  }

  private normalizeSpeechFragment(value: string): string {
    return value
      .normalize("NFKC")
      .replace(ARABIC_TATWEEL_PATTERN, "")
      .replace(ARABIC_DIACRITICS_PATTERN, "")
      .replace(/\s+/g, " ")
      .replace(SPACE_BEFORE_PUNCTUATION_PATTERN, "$1")
      .trim();
  }
}

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") {
    return null;
  }

  const speechWindow = window as SpeechRecognitionWindow;
  return (
    speechWindow.SpeechRecognition ??
    speechWindow.webkitSpeechRecognition ??
    null
  );
}
