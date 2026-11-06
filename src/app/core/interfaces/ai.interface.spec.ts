import {
  AiChatMessage,
  AiConversation,
  AiConversationSummary,
  AiFaqTopic,
  AiPromptDraft,
  AiQuickAction,
  AiResultCard,
  AiShortcutAction,
} from "./ai.interface";

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

  it("should expose AI chat transcript contract types", () => {
    const message: AiChatMessage = {
      id: "msg-1",
      role: "assistant",
      text: "I can help with orders and reports.",
      createdAt: "2026-10-31T12:00:00Z",
      markdown: true,
      canCopy: true,
    };
    const topic: AiFaqTopic = "services";

    expect(message.role).toBe("assistant");
    expect(topic).toBe("services");
  });

  it("should expose AI conversation and quick action types", () => {
    const action: AiQuickAction = {
      id: "search-orders",
      title: "Search orders",
      description: "Open orders list",
      icon: "search",
      intent: "searchOrders",
      prefillPrompt: "search orders",
      behavior: "prefill",
      category: "operational",
      requiredCapability: "orders.read",
    };

    const conversation: AiConversation = {
      id: "chat-1",
      title: "New conversation",
      updatedAt: "2026-11-01T12:00:00Z",
      showWelcomeActions: true,
      messages: [],
    };

    const summary: AiConversationSummary = {
      id: "chat-1",
      title: "New conversation",
      updatedAt: "2026-11-01T12:00:00Z",
      preview: "Welcome",
      isActive: true,
    };

    expect(action.intent).toBe("searchOrders");
    expect(conversation.showWelcomeActions).toBeTrue();
    expect(summary.isActive).toBeTrue();
  });

  it("should expose open-order-details shortcut intent metadata", () => {
    const shortcut: AiShortcutAction = {
      id: "open-order",
      title: "Open order details",
      intent: "openOrderDetails",
      orderId: "ord-1",
    };

    expect(shortcut.intent).toBe("openOrderDetails");
    expect(shortcut.orderId).toBe("ord-1");
  });
});
