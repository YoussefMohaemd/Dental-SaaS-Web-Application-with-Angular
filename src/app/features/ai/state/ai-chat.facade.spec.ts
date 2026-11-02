import { signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { AuthorizationService } from "@core/services/authorization.service";
import { AssistantDataService } from "@core/services/assistant-data.service";
import { NavigationService } from "@core/services/navigation.service";
import { of } from "rxjs";
import { AiChatFacade } from "./ai-chat.facade";

describe("AiChatFacade", () => {
  let facade: AiChatFacade;
  let authorizationService: jasmine.SpyObj<AuthorizationService>;
  let navigationService: jasmine.SpyObj<NavigationService>;
  let assistantDataService: jasmine.SpyObj<AssistantDataService>;

  beforeEach(() => {
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
      ["createConversation$", "postMessage$"],
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
        { provide: AuthorizationService, useValue: authorizationService },
        { provide: NavigationService, useValue: navigationService },
        { provide: AssistantDataService, useValue: assistantDataService },
      ],
    });

    facade = TestBed.inject(AiChatFacade);
  });

  it("should start with welcome state", () => {
    expect(facade.showWelcome()).toBeTrue();
    expect(facade.messages().length).toBeGreaterThan(0);
    expect(facade.quickActions().length).toBeGreaterThan(0);
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

  it("should route quick action denial before backend call", async () => {
    authorizationService.has.and.callFake((capability: string) =>
      capability === "reports.read" ? false : true,
    );

    facade.runQuickAction({
      id: "qa-create-report",
      title: "Create report",
      description: "Generate report",
      intent: "generateReport",
      prompt: "generate report",
      requiredCapability: "reports.read",
    });

    const latest = facade.messages().at(-1)?.text.toLowerCase() ?? "";
    expect(latest).toContain("don't have access");
    expect(assistantDataService.postMessage$).not.toHaveBeenCalled();
  });
});
