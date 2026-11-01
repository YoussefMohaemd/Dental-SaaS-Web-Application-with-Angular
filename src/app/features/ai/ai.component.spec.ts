import { signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { AiComponent } from "./ai.component";
import { AuthorizationService } from "@core/services/authorization.service";
import { NavigationService } from "@core/services/navigation.service";

describe("AiComponent", () => {
  let component: AiComponent;
  let fixture: ComponentFixture<AiComponent>;
  let authorizationService: jasmine.SpyObj<AuthorizationService>;
  let navigationService: jasmine.SpyObj<NavigationService>;

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

    await TestBed.configureTestingModule({
      imports: [AiComponent],
      providers: [
        { provide: AuthorizationService, useValue: authorizationService },
        { provide: NavigationService, useValue: navigationService },
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
    component.submitPrompt("show services");
    await new Promise((resolve) => setTimeout(resolve, 700));
    fixture.detectChanges();

    component.startNewChat();
    fixture.detectChanges();

    expect(component.conversations().length).toBe(initialCount + 1);
    expect(component.showWelcome()).toBeTrue();
  });

  it("should switch to selected historical conversation", async () => {
    component.submitPrompt("show services");
    await new Promise((resolve) => setTimeout(resolve, 700));
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

  it("should block delete request before capability checks", async () => {
    authorizationService.has.and.callFake((capability: string) =>
      capability === "reports.read" ? false : true,
    );
    component.submitPrompt("delete order ord-500");
    await new Promise((resolve) => setTimeout(resolve, 700));
    fixture.detectChanges();

    const latest = component.messages().at(-1);
    expect(latest?.text.toLowerCase()).toContain("can't delete");
    expect(latest?.text.toLowerCase()).not.toContain("don't have access");
  });
});
