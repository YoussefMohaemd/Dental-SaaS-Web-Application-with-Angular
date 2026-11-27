export type AiInputLanguage = "ar" | "en";

const ARABIC_LETTER_PATTERN =
  /[\u0621-\u063a\u0641-\u064a\u0671-\u06d3\u06fa-\u06ff]/u;

export function detectAiInputLanguage(value: string): AiInputLanguage {
  return ARABIC_LETTER_PATTERN.test(value) ? "ar" : "en";
}
