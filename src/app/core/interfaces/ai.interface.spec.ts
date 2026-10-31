import { AiPromptDraft, AiResultCard, AiShortcutAction } from "./ai.interface";

describe("ai.interface", () => {
  it("should expose AI UI contract types", () => {
    const shortcut: AiShortcutAction = {
      id: "create-order",
      title: "Create Order",
      intent: "createOrder",
    };
    const result: AiResultCard = {
      id: "report-1",
      title: "Orders Summary",
      summary: "3 overdue orders detected",
      tone: "info",
    };
    const prompt: AiPromptDraft = {
      search: "overdue",
      prompt: "Show overdue orders from this week.",
    };

    expect(shortcut.id).toBe("create-order");
    expect(result.tone).toBe("info");
    expect(prompt.search).toBe("overdue");
  });
});
