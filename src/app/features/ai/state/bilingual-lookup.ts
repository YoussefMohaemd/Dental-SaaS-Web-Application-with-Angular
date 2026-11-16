const ARABIC_LETTER_PATTERN = /[\u0600-\u06ff]/;
const MAX_SEARCH_LENGTH = 128;
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const LATIN_TRANSLITERATION_VARIANTS: Record<string, string> = {
  ae: "(?:ae|ai|ay|ea|ei|ey|ie)",
  ai: "(?:ae|ai|ay|ea|ei|ey|ie)",
  ay: "(?:ae|ai|ay|ea|ei|ey|ie)",
  ea: "(?:ae|ai|ay|ea|ei|ey|ie)",
  ei: "(?:ae|ai|ay|ea|ei|ey|ie)",
  ey: "(?:ae|ai|ay|ea|ei|ey|ie)",
  ie: "(?:ae|ai|ay|ea|ei|ey|ie)",
};

const ARABIC_TO_LATIN_VARIANTS: Record<string, string[]> = {
  ا: ["a"],
  ب: ["b", "p"],
  ت: ["t"],
  ث: ["th"],
  ج: ["j", "g"],
  ح: ["h"],
  خ: ["kh"],
  د: ["d"],
  ذ: ["dh", "z"],
  ر: ["r"],
  ز: ["z"],
  س: ["s"],
  ش: ["sh"],
  ص: ["s"],
  ض: ["d"],
  ط: ["t"],
  ظ: ["z"],
  ع: ["a", "e", "i", "o", "u"],
  غ: ["gh"],
  ف: ["f"],
  ق: ["q", "k"],
  ك: ["c", "k"],
  ل: ["l"],
  م: ["m"],
  ن: ["n", "ni"],
  ه: ["h"],
  و: ["w", "o", "u"],
  ي: ["y", "i", "e", "a"],
  ء: [""],
};

export function matchesBilingualEntityName(
  query: string,
  candidate: string,
): boolean {
  const normalizedQuery = normalizeArabic(query).slice(0, MAX_SEARCH_LENGTH);
  const normalizedCandidate = normalizeArabic(candidate);
  if (!normalizedQuery || !normalizedCandidate) {
    return false;
  }
  if (normalizedQuery === normalizedCandidate) {
    return true;
  }
  if (ARABIC_LETTER_PATTERN.test(normalizedQuery)) {
    return matchesArabicTransliteration(
      normalizedQuery,
      normalizedCandidate,
      true,
    );
  }
  return new RegExp(
    buildLatinTransliterationPattern(normalizedQuery, true),
    "i",
  ).test(normalizedCandidate);
}

export function matchesBilingualText(
  query: string,
  candidate: string,
): boolean {
  const normalizedQuery = normalizeArabic(query).slice(0, MAX_SEARCH_LENGTH);
  const normalizedCandidate = normalizeArabic(candidate);
  if (!normalizedQuery || !normalizedCandidate) {
    return false;
  }
  if (normalizedQuery === normalizedCandidate) {
    return true;
  }
  if (ARABIC_LETTER_PATTERN.test(normalizedQuery)) {
    return matchesArabicTransliteration(
      normalizedQuery,
      normalizedCandidate,
      false,
    );
  }
  return new RegExp(
    buildLatinTransliterationPattern(normalizedQuery),
    "i",
  ).test(normalizedCandidate);
}

function buildLatinTransliterationPattern(
  normalized: string,
  anchored = false,
): string {
  let pattern = anchored ? "^" : "";
  for (let index = 0; index < normalized.length; index += 1) {
    const pair = normalized.slice(index, index + 2);
    const variant = LATIN_TRANSLITERATION_VARIANTS[pair];
    if (variant) {
      pattern += variant;
      index += 1;
      continue;
    }
    pattern += escapeRegex(normalized[index] ?? "");
  }
  return `${pattern}${anchored ? "$" : ""}`;
}

function matchesArabicTransliteration(
  normalizedQuery: string,
  normalizedCandidate: string,
  anchored: boolean,
): boolean {
  const queryWords = normalizedQuery.split(" ");
  const candidateWords = normalizedCandidate.split(" ");
  if (anchored && queryWords.length !== candidateWords.length) {
    return false;
  }

  const end = anchored
    ? 1
    : Math.max(0, candidateWords.length - queryWords.length + 1);
  for (let wordIndex = 0; wordIndex < end; wordIndex += 1) {
    if (
      queryWords.every((queryWord, queryIndex) =>
        matchesArabicWord(
          queryWord,
          candidateWords[wordIndex + queryIndex] ?? "",
        ),
      )
    ) {
      return true;
    }
  }
  return false;
}

function matchesArabicWord(query: string, candidate: string): boolean {
  let positions = new Set<number>([0]);
  const characters = [...query];
  for (let index = 0; index < characters.length; index += 1) {
    const character = characters[index] ?? "";
    const variants = ARABIC_TO_LATIN_VARIANTS[character] ?? [character];
    const nextPositions = new Set<number>();
    for (const position of positions) {
      for (const variant of variants) {
        const startsAt = index === 0 ? [position] : [position, position + 1];
        for (const start of startsAt) {
          if (
            start > position &&
            !isEpentheticVowel(candidate[position] ?? "")
          ) {
            continue;
          }
          if (candidate.startsWith(variant, start)) {
            nextPositions.add(start + variant.length);
          }
        }
      }
    }
    positions = nextPositions;
    if (positions.size === 0) {
      return false;
    }
  }

  return Array.from(positions).some(
    (position) =>
      position === candidate.length ||
      (position + 1 === candidate.length &&
        isEpentheticVowel(candidate[position] ?? "")),
  );
}

function isEpentheticVowel(character: string): boolean {
  return character.length === 1 && "aeou".includes(character);
}

function normalizeArabic(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[\u064b-\u065f\u0670\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)))
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
