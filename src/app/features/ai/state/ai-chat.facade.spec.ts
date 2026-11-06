import { signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { AuthService, type AuthenticatedUser } from "@core/services/auth.service";
import { AuthorizationService } from "@core/services/authorization.service";
import { AssistantDataService } from "@core/services/assistant-data.service";
import { NavigationService } from "@core/services/navigation.service";
import { of, throwError } from "rxjs";
import { AiChatFacade } from "./ai-chat.facade";

describe("AiChatFacade", () => {
  let facade: AiChatFacade;
  let currentUser: ReturnType<typeof signal<AuthenticatedUser | null>>;
  let authorizationService: jasmine.SpyObj<AuthorizationService>;
  let navigationService: jasmine.SpyObj<NavigationService>;
  let assistantDataService: jasmine.SpyObj<AssistantDataService>;

  const makeUser = (userId: string): AuthenticatedUser => ({
    userId,
    tenantId: "tenant-1",
    fullName: userId,
    email: `${userId}@example.com`,
    roles: ["admin"],
  });

  beforeEach(async () => {
    currentUser = signal<AuthenticatedUser | null>(makeUser("user-doctor"));
    authorizationService = jasmine.createSpyObj<AuthorizationService>(
      "AuthorizationService",
      ["has"],
    );
    authorizationService.has.and.returnValue(true);

    navigationService = jasmine.createSpyObj<NavigationService>(
      "NavigationService",
      ["navigate"],
      { isMobile: signal(false) },
    );
    assistantDataService = jasmine.createSpyObj<AssistantDataService>(
      "AssistantDataService",
      [
        "getSuggestions$",
        "listConversations$",
        "getConversation$",
        "createConversation$",
        "postMessage$",
        "confirmAction$",
      ],
    );
    assistantDataService.getSuggestions$.and.returnValue(
      of([
        {
          id: "assistant-search-orders",
          title: "Search",
          description: "Search",
          category: "orders",
          template: "Search",
          requiredCapabilities: ["orders.read"],
          resultType: "order-list",
          enabled: true,
        },
      ]),
    );
    assistantDataService.listConversations$.and.returnValue(of([]));
    assistantDataService.getConversation$.and.returnValue(
      of({
        id: "conv-backend-1",
        title: "Backend",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      }),
    );
    assistantDataService.createConversation$.and.returnValue(
      of({
        id: "conv-backend-1",
        title: "Backend",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      }),
    );
    assistantDataService.confirmAction$.and.returnValue(
      of({
        actionId: "a1",
        conversationId: "conv-backend-1",
        status: "confirmed",
        message: "Action confirmed and executed",
      }),
    );
    assistantDataService.postMessage$.and.returnValue(
      of({
        conversationId: "conv-backend-1",
        messageId: "m1",
        result: {
          type: "text",
          text: "Live backend response",
          plannedActions: 0,
          executions: [],
        },
      }),
    );

    TestBed.configureTestingModule({
      providers: [
        AiChatFacade,
        { provide: AuthService, useValue: { user: currentUser.asReadonly() } },
        { provide: AuthorizationService, useValue: authorizationService },
        { provide: NavigationService, useValue: navigationService },
        { provide: AssistantDataService, useValue: assistantDataService },
      ],
    });

    facade = TestBed.inject(AiChatFacade);
    await flushAsyncFacadeInit();
  });

  it("should start with welcome state", () => {
    expect(assistantDataService.listConversations$).toHaveBeenCalled();
    expect(facade.showWelcome()).toBeTrue();
    expect(facade.messages().length).toBeGreaterThan(0);
    expect(facade.quickActions().length).toBeGreaterThan(0);
    expect(facade.quickActions().some((action) => action.id === "nav-open-doctors")).toBeTrue();
    expect(facade.quickActions().some((action) => action.id === "nav-open-clinics")).toBeTrue();
  });

  it("should append backend assistant reply and hide welcome after submit", async () => {
    const pending = facade.submitPrompt("show services");
    expect(facade.messages().at(-1)?.role).toBe("thinking");
    await pending;

    expect(facade.showWelcome()).toBeFalse();
    expect(facade.messages().at(-1)?.role).toBe("assistant");
    expect(facade.messages().at(-1)?.text).toContain("Live backend response");
    expect(assistantDataService.createConversation$).toHaveBeenCalled();
    expect(assistantDataService.postMessage$).toHaveBeenCalled();
  });

  async function flushAsyncFacadeInit(): Promise<void> {
    TestBed.tick();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  }

  it("should always open on a brand-new chat even when history exists", async () => {
    currentUser.set(makeUser("user-with-history"));
    assistantDataService.listConversations$.and.returnValue(
      of([
        {
          id: "old-1",
          title: "Old chat",
          preview: "Old preview",
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]),
    );
    TestBed.tick();
    await flushAsyncFacadeInit();

    expect(facade.activeConversation()?.title).toBe("New conversation");
    expect(facade.showWelcome()).toBeTrue();
    expect(facade.conversations().some((item) => item.id === "old-1")).toBeTrue();
    expect(facade.activeConversationId()).not.toBe("old-1");
  });

  it("should drop the previous user's chats when another user signs in", async () => {
    await facade.submitPrompt("doctor private message");
    expect(
      facade.messages().some((message) => message.text === "doctor private message"),
    ).toBeTrue();

    currentUser.set(makeUser("user-admin"));
    TestBed.tick();
    await flushAsyncFacadeInit();

    expect(
      facade.conversations().flatMap((item) => item.messages.map((m) => m.text)),
    ).not.toContain("doctor private message");
    expect(facade.showWelcome()).toBeTrue();
  });

  it("should clear everything on logout", async () => {
    currentUser.set(null);
    TestBed.tick();
    await flushAsyncFacadeInit();

    expect(facade.conversations().length).toBe(0);
    expect(facade.activeConversationId()).toBeNull();
  });

  it("should route quick action denial before backend call", async () => {
    authorizationService.has.and.callFake((capability: string) =>
      capability === "reports.read" ? false : true,
    );

    facade.runQuickAction({
      id: "qa-create-report",
      title: "Create report",
      description: "Generate report",
      icon: "chart-column",
      intent: "generateReport",
      prefillPrompt: "generate report",
      behavior: "prefill",
      category: "operational",
      requiredCapability: "reports.read",
    });

    const latest = facade.messages().at(-1)?.text.toLowerCase() ?? "";
    expect(latest).toContain("don't have access");
    expect(assistantDataService.postMessage$).not.toHaveBeenCalled();
  });

  it("should prompt for order id when open-order-detail quick action is used", () => {
    const quick = facade.quickActions().find((action) => action.id === "ops-open-order-detail");
    expect(quick).toBeDefined();
    if (!quick) {
      throw new Error("Expected ops-open-order-detail action");
    }

    facade.runQuickAction(quick);

    expect(facade.promptDraft().prompt.toLowerCase()).toContain("open order details");
    expect(facade.messages().at(-1)?.text.toLowerCase()).toContain("order id");
  });

  it("should show permission-denied message from backend 403", async () => {
    assistantDataService.postMessage$.and.returnValue(
      throwError(() => ({
        status: 403,
        error: {
          error: {
            message: "Assistant tool permission denied",
          },
        },
      })),
    );

    await facade.submitPrompt("update order");

    const latest = facade.messages().at(-1)?.text.toLowerCase() ?? "";
    expect(latest).toContain("don't have access");
  });

  it("should show explicit confirmation affordance for write responses", async () => {
    assistantDataService.postMessage$.and.returnValue(
      of({
        conversationId: "conv-backend-1",
        messageId: "m2",
        result: {
          type: "confirmation",
          text: "Please confirm before execution.",
          pendingActions: [
            {
              actionId: "a1",
              tool: "update_order",
              expiresAt: new Date().toISOString(),
              confirmationToken: "token",
            },
          ],
        },
      }),
    );

    await facade.submitPrompt("update order");

    const latest = facade.messages().at(-1);
    expect(latest?.type).toBe("confirmation");
    expect(latest?.actions?.length).toBe(1);
  });

  it("recreates backend conversation and retries when message post returns conversation not found", async () => {
    assistantDataService.createConversation$.and.returnValues(
      of({
        id: "conv-backend-stale",
        title: "Stale",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      }),
      of({
        id: "conv-backend-fresh",
        title: "Fresh",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      }),
    );
    assistantDataService.postMessage$.and.callFake((conversationId: string) => {
      if (conversationId === "conv-backend-stale") {
        return throwError(() => ({
          status: 404,
          error: {
            error: {
              message: "Conversation was not found",
            },
          },
        }));
      }

      return of({
        conversationId: "conv-backend-fresh",
        messageId: "m3",
        result: {
          type: "text" as const,
          text: "Recovered from stale conversation",
          plannedActions: 0,
          executions: [],
        },
      });
    });

    await facade.submitPrompt("retry message");

    expect(assistantDataService.createConversation$).toHaveBeenCalledTimes(2);
    expect(assistantDataService.postMessage$).toHaveBeenCalledTimes(2);
    expect(assistantDataService.postMessage$.calls.argsFor(0)[0]).toBe("conv-backend-stale");
    expect(assistantDataService.postMessage$.calls.argsFor(1)[0]).toBe("conv-backend-fresh");
    expect(facade.messages().at(-1)?.text).toContain("Recovered from stale conversation");
  });
});
