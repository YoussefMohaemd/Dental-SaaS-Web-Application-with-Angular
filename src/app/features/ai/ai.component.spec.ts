import { signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { AssistantDataService } from "@core/services/assistant-data.service";
import { AiComponent } from "./ai.component";
import { AuthorizationService } from "@core/services/authorization.service";
import { AuthService } from "@core/services/auth.service";
import { NavigationService } from "@core/services/navigation.service";
import { of, throwError } from "rxjs";

describe("AiComponent", () => {
  let component: AiComponent;
  let fixture: ComponentFixture<AiComponent>;
  let currentUser: ReturnType<typeof signal>;
  let authorizationService: jasmine.SpyObj<AuthorizationService>;
  let navigationService: jasmine.SpyObj<NavigationService>;
  let assistantDataService: jasmine.SpyObj<AssistantDataService>;

  beforeEach(async () => {
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
        "createConversation$",
        "postMessage$",
        "getSuggestions$",
        "listConversations$",
        "getConversation$",
        "confirmAction$",
      ],
    );
    assistantDataService.getSuggestions$.and.returnValue(of([{ id: "assistant-create-order", title: "Create order", description: "", category: "orders", template: "", requiredCapabilities: [], resultType: "text", enabled: true }]));
    assistantDataService.listConversations$.and.returnValue(of([]));
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
    assistantDataService.confirmAction$.and.returnValue(
      of({
        actionId: "a1",
        conversationId: "conv-backend-1",
        status: "confirmed",
        message: "confirmed",
      }),
    );

    currentUser = signal({
      userId: "user-1",
      tenantId: "tenant-1",
      fullName: "User",
      email: "user@example.com",
      roles: ["admin"],
    });

    await TestBed.configureTestingModule({
      imports: [AiComponent],
      providers: [
        {
          provide: AuthService,
          useValue: {
            user: currentUser,
          },
        },
        { provide: AuthorizationService, useValue: authorizationService },
        { provide: NavigationService, useValue: navigationService },
        { provide: AssistantDataService, useValue: assistantDataService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should render chat layout actions", () => {
    expect(
      fixture.debugElement.query(By.css("[data-testid='open-history']")),
    ).toBeTruthy();
    expect(
      fixture.debugElement.query(By.css("[data-testid='new-chat']")),
    ).toBeTruthy();
    expect(
      fixture.debugElement.query(By.css("[data-testid='show-quick-actions']")),
    ).toBeTruthy();
  });

  it("should render welcome panel and quick actions for a fresh chat", async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    expect(
      fixture.debugElement.query(By.css("app-ai-quick-actions")),
    ).toBeTruthy();

    const quickActions = fixture.debugElement.queryAll(
      By.css("[data-testid='quick-action']"),
    );
    expect(quickActions.length).toBeGreaterThan(0);
  });

  it("should open and close history drawer", () => {
    component.toggleHistory();
    fixture.detectChanges();
    expect(component.isHistoryOpen()).toBeTrue();

    component.closeHistory();
    fixture.detectChanges();
    expect(component.isHistoryOpen()).toBeFalse();
  });

  it("should append backend response after submit", async () => {
    await component.submitPrompt("show services");
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const latest = component.messages().at(-1);
    expect(latest?.text).toContain("Live backend response");
  });

  it("should show backend permission denied message", async () => {
    assistantDataService.postMessage$.and.returnValue(
      throwError(() => ({
        status: 403,
        error: { error: { message: "Assistant tool permission denied" } },
      })),
    );
    await component.submitPrompt("delete order ord-500");
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const latest = component.messages().at(-1);
    expect(latest?.text.toLowerCase()).toContain("don't have access");
  });

  it("should re-show quick actions when user asks to show quick actions", async () => {
    await component.submitPrompt("show services");
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(
      fixture.debugElement.query(By.css("app-ai-quick-actions")),
    ).toBeNull();

    await component.submitPrompt("show quick actions");
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(
      fixture.debugElement.query(By.css("app-ai-quick-actions")),
    ).toBeTruthy();
  });

  it("should re-show quick actions when quick actions button is pressed", async () => {
    await component.submitPrompt("show services");
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(
      fixture.debugElement.query(By.css("app-ai-quick-actions")),
    ).toBeNull();

    component.showQuickActions();
    fixture.detectChanges();

    expect(
      fixture.debugElement.query(By.css("app-ai-quick-actions")),
    ).toBeTruthy();
  });

  it("should show order workflow panel when create-order quick action is selected", () => {
    const action = component.quickActions().find((item) => item.id === "ops-create-order");
    expect(action).toBeDefined();
    if (!action) {
      throw new Error("Missing ops-create-order quick action");
    }

    component.onQuickAction(action);
    fixture.detectChanges();

    expect(
      fixture.debugElement.query(By.css("app-ai-order-workflow-panel")),
    ).toBeTruthy();
  });

  it("should keep composer outside scroll viewport in the chat shell", () => {
    const shell = fixture.debugElement.query(By.css(".chat-shell"));
    const body = fixture.debugElement.query(By.css("[data-testid='chat-body']"));
    const messagesViewport = fixture.debugElement.query(
      By.css("[data-testid='messages-viewport']"),
    );
    const composer = fixture.debugElement.query(By.css(".chat-composer app-ai-chat-composer"));

    expect(shell).toBeTruthy();
    expect(body).toBeTruthy();
    expect(messagesViewport).toBeTruthy();
    expect(composer).toBeTruthy();
  });

  it("should open with a fresh chat while preserving and loading history conversations", async () => {
    const updatedAt = new Date().toISOString();
    assistantDataService.listConversations$.and.returnValue(
      of([
        {
          id: "conv-existing-1",
          title: "Existing chat",
          status: "active",
          createdAt: updatedAt,
          updatedAt,
          preview: "History preview",
        },
      ]),
    );
    assistantDataService.getConversation$.and.returnValue(
      of({
        id: "conv-existing-1",
        title: "Existing chat",
        status: "active",
        createdAt: updatedAt,
        updatedAt,
        messages: [
          {
            id: "m-existing-1",
            role: "assistant",
            text: "Existing message",
            createdAt: updatedAt,
            resultType: "text",
          },
        ],
      }),
    );

    currentUser.set({
      userId: "user-2",
      tenantId: "tenant-1",
      fullName: "User 2",
      email: "user2@example.com",
      roles: ["admin"],
    });

    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.activeConversation()?.title).toBe("New conversation");
    expect(component.showWelcome()).toBeTrue();
    expect(
      component.conversations().some((conversation) => conversation.id === "conv-existing-1"),
    ).toBeTrue();

    component.selectConversation("conv-existing-1");
    await fixture.whenStable();
    fixture.detectChanges();

    expect(assistantDataService.getConversation$).toHaveBeenCalledWith(
      "conv-existing-1",
    );
    expect(component.messages().at(-1)?.text).toContain("Existing message");
  });
});
