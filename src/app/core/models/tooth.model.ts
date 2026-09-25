export type ToothJaw = "upper" | "lower";

export interface DentalTooth {
  id: string;
  number: number;
  jaw: ToothJaw;
  quadrant: 1 | 2 | 3 | 4;
  type:
    | "central-incisor"
    | "lateral-incisor"
    | "canine"
    | "first-premolar"
    | "second-premolar"
    | "first-molar"
    | "second-molar"
    | "third-molar";
}

export const FDI_UPPER_NUMBERS = [
  18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
] as const;
export const FDI_LOWER_NUMBERS = [
  48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
] as const;

function toothTypeFromPosition(position: number): DentalTooth["type"] {
  const map: Record<number, DentalTooth["type"]> = {
    1: "central-incisor",
    2: "lateral-incisor",
    3: "canine",
    4: "first-premolar",
    5: "second-premolar",
    6: "first-molar",
    7: "second-molar",
    8: "third-molar",
  };
  return map[position];
}

export function buildTooth(number: number): DentalTooth {
  const numberText = String(number);
  const quadrant = Number(numberText.charAt(0)) as 1 | 2 | 3 | 4;
  const position = Number(numberText.charAt(1));
  return {
    id: numberText,
    number,
    jaw: quadrant === 1 || quadrant === 2 ? "upper" : "lower",
    quadrant,
    type: toothTypeFromPosition(position),
  };
}

export const PERMANENT_TEETH: DentalTooth[] = [
  ...FDI_UPPER_NUMBERS,
  ...FDI_LOWER_NUMBERS,
].map(buildTooth);
export const UPPER_JAW_TEETH = PERMANENT_TEETH.filter(
  (tooth) => tooth.jaw === "upper",
);
export const LOWER_JAW_TEETH = PERMANENT_TEETH.filter(
  (tooth) => tooth.jaw === "lower",
);
