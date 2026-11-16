import {
  matchesBilingualEntityName,
  matchesBilingualText,
} from "./bilingual-lookup";

describe("bilingual lookup", () => {
  it("matches Arabic references against stored Latin names", () => {
    expect(matchesBilingualEntityName("عمر خليل", "Omar Khalil")).toBeTrue();
    expect(matchesBilingualText("عمر", "Omar Khalil")).toBeTrue();
  });

  it("matches common Latin transliteration variants", () => {
    expect(matchesBilingualEntityName("sief", "Saif")).toBeTrue();
    expect(matchesBilingualText("sief", "Saif")).toBeTrue();
  });

  it("normalizes Arabic-Indic digits in local lookups", () => {
    expect(matchesBilingualEntityName("DL-٠١", "DL-01")).toBeTrue();
  });

  it("does not match unrelated Latin names through optional vowels", () => {
    expect(matchesBilingualEntityName("عمر", "Amir")).toBeFalse();
    expect(matchesBilingualEntityName("عمر", "Mary")).toBeFalse();
  });
});
