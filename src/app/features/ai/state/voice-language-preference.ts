import { type AssistantVoiceLanguageHint } from "@core/services/assistant-data.service";

const STORAGE_KEY = "ai.voice.language";
const ALLOWED_VALUES: AssistantVoiceLanguageHint[] = ["auto", "ar", "en", "mixed"];

export function readVoiceLanguagePreference(): AssistantVoiceLanguageHint {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value && ALLOWED_VALUES.includes(value as AssistantVoiceLanguageHint)) {
      return value as AssistantVoiceLanguageHint;
    }
  } catch {
    // ignore localStorage read failures
  }
  return "auto";
}

export function writeVoiceLanguagePreference(value: AssistantVoiceLanguageHint): void {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // ignore localStorage write failures
  }
}

export const voiceLanguageStorageKey = STORAGE_KEY;
