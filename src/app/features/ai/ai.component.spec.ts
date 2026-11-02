import { signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { AssistantDataService } from "@core/services/assistant-data.service";
import { AiComponent } from "./ai.component";
import { AuthorizationService } from "@core/services/authorization.service";
import { NavigationService } from "@core/services/navigation.service";
import { of, throwError } from "rxjs";

describe("AiComponent", () => {
  let component: AiComponent;
  let fixture: ComponentFixture<AiComponent>;
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

    await TestBed.configureTestingModule({
      imports: [AiComponent],
      providers: [
        { provide: AuthorizationService, useValue: authorizationService },
        { provide: NavigationService, useValue: navigationService },
        { provide: AssistantDataService, useValue: assistantDataService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AiComponent);
    component = fixture.componentInstance;
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
  });

  it("should render welcome panel and quick actions for a fresh chat", () => {
    expect(
      fixture.debugElement.query(By.css("[data-testid='welcome-block']")),
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

  it("should create new conversation and keep previous conversations in history", async () => {
    const initialCount = component.conversations().length;
    await component.submitPrompt("show services");
    fixture.detectChanges();

    component.startNewChat();
    fixture.detectChanges();

    expect(component.conversations().length).toBe(initialCount + 1);
    expect(component.showWelcome()).toBeTrue();
  });

  it("should switch to selected historical conversation", async () => {
    await component.submitPrompt("show services");
    component.startNewChat();
    fixture.detectChanges();

    const activeId = component.activeConversationId();
    const previous = component.conversations().find((item) => item.id !== activeId);
    expect(previous).toBeDefined();

    component.selectConversation(previous!.id);
    fixture.detectChanges();

    expect(component.activeConversationId()).toBe(previous!.id);
    expect(component.messages().length).toBeGreaterThan(0);
  });

  it("should show backend permission-denied message when assistant API returns 403", async () => {
    assistantDataService.postMessage$.and.returnValue(
      throwError(() => ({
        status: 403,
        error: { error: { message: "Assistant tool permission denied" } },
      })),
    );
    await component.submitPrompt("delete order ord-500");
    fixture.detectChanges();

    const latest = component.messages().at(-1);
    expect(latest?.text.toLowerCase()).toContain("don't have access");
  });
});
