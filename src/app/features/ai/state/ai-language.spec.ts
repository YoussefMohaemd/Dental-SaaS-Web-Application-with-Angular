import { detectAiInputLanguage } from "./ai-language";

describe("detectAiInputLanguage", () => {
  it("detects Arabic input", () => {
    expect(detectAiInputLanguage("اعرض الطلبات 123!")).toBe("ar");
  });

  it("detects English input", () => {
    expect(detectAiInputLanguage("Show delayed orders")).toBe("en");
  });

  it("treats Arabic-English mixed input as Arabic", () => {
    expect(detectAiInputLanguage("اعرض delayed orders")).toBe("ar");
  });

  it("defaults non-letter input to English", () => {
    expect(detectAiInputLanguage("123 - ?")).toBe("en");
  });

  it("ignores Arabic-Indic digits and punctuation when detecting language", () => {
    expect(detectAiInputLanguage("Show order ١٢٣؟")).toBe("en");
  });
});
