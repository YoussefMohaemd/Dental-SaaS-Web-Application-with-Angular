export type AiInputLanguage = "ar" | "en" | "mixed";

const ARABIC_LETTER_PATTERN =
  /[\u0621-\u063a\u0641-\u064a\u0671-\u06d3\u06fa-\u06ff]/u;
const LATIN_LETTER_PATTERN = /[A-Za-z]/u;

export function detectAiInputLanguage(value: string): AiInputLanguage {
  const hasArabic = ARABIC_LETTER_PATTERN.test(value);
  const hasLatin = LATIN_LETTER_PATTERN.test(value);

  if (hasArabic && hasLatin) {
    return "mixed";
  }
  return hasArabic ? "ar" : "en";
}
