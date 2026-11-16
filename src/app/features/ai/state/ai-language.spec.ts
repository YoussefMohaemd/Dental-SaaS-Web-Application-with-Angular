import { detectAiInputLanguage } from "./ai-language";

describe("detectAiInputLanguage", () => {
  it("detects Arabic input", () => {
    expect(detectAiInputLanguage("اعرض الطلبات 123!")).toBe("ar");
  });

  it("detects English input", () => {
    expect(detectAiInputLanguage("Show delayed orders")).toBe("en");
  });

  it("detects mixed input", () => {
    expect(detectAiInputLanguage("اعرض delayed orders")).toBe("mixed");
  });

  it("defaults non-letter input to English", () => {
    expect(detectAiInputLanguage("123 - ?")).toBe("en");
  });

  it("ignores Arabic-Indic digits and punctuation when detecting language", () => {
    expect(detectAiInputLanguage("Show order ١٢٣؟")).toBe("en");
  });
});
