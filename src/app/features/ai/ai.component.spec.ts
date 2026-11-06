import { signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { AssistantDataService } from "@core/services/assistant-data.service";
import { AiComponent } from "./ai.component";
import { AuthorizationService } from "@core/services/authorization.service";
import { AuthService } from "@core/services/auth.service";
import { ClinicDataService } from "@core/services/clinic-data.service";
import { DoctorDataService } from "@core/services/doctor-data.service";
import { NavigationService } from "@core/services/navigation.service";
import { OrderDataService } from "@core/services/order-data.service";
import { PatientDataService } from "@core/services/patient-data.service";
import { SubOrderDataService } from "@core/services/sub-order-data.service";
import { of, throwError } from "rxjs";

describe("AiComponent", () => {
  let component: AiComponent;
  let fixture: ComponentFixture<AiComponent>;
  let authorizationService: jasmine.SpyObj<AuthorizationService>;
  let navigationService: jasmine.SpyObj<NavigationService>;
  let assistantDataService: jasmine.SpyObj<AssistantDataService>;
  let patientDataService: jasmine.SpyObj<PatientDataService>;
  let doctorDataService: jasmine.SpyObj<DoctorDataService>;
  let clinicDataService: jasmine.SpyObj<ClinicDataService>;
  let orderDataService: jasmine.SpyObj<OrderDataService>;
  let subOrderDataService: jasmine.SpyObj<SubOrderDataService>;

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
    assistantDataService.getSuggestions$.and.returnValue(of([]));
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
    patientDataService = jasmine.createSpyObj<PatientDataService>(
      "PatientDataService",
      ["loadPatients"],
      { patients: signal([]) },
    );
    doctorDataService = jasmine.createSpyObj<DoctorDataService>(
      "DoctorDataService",
      ["loadDoctors"],
      { doctors: signal([]) },
    );
    clinicDataService = jasmine.createSpyObj<ClinicDataService>(
      "ClinicDataService",
      ["loadClinics"],
      { clinics: signal([]) },
    );
    orderDataService = jasmine.createSpyObj<OrderDataService>(
      "OrderDataService",
      ["loadOrders", "getOrderById$", "createOrder$", "updateOrder$"],
      { orders: signal([]) },
    );
    orderDataService.getOrderById$.and.returnValue(
      throwError(() => new Error("not-found")),
    );
    orderDataService.createOrder$.and.returnValue(throwError(() => new Error("not-used")));
    orderDataService.updateOrder$.and.returnValue(throwError(() => new Error("not-used")));
    subOrderDataService = jasmine.createSpyObj<SubOrderDataService>(
      "SubOrderDataService",
      ["createForOrder$", "replaceForOrder$"],
    );
    subOrderDataService.createForOrder$.and.returnValue(of([]));
    subOrderDataService.replaceForOrder$.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [AiComponent],
      providers: [
        {
          provide: AuthService,
          useValue: {
            user: signal({
              userId: "user-1",
              tenantId: "tenant-1",
              fullName: "User",
              email: "user@example.com",
              roles: ["admin"],
            }),
          },
        },
        { provide: AuthorizationService, useValue: authorizationService },
        { provide: NavigationService, useValue: navigationService },
        { provide: AssistantDataService, useValue: assistantDataService },
        { provide: PatientDataService, useValue: patientDataService },
        { provide: DoctorDataService, useValue: doctorDataService },
        { provide: ClinicDataService, useValue: clinicDataService },
        { provide: OrderDataService, useValue: orderDataService },
        { provide: SubOrderDataService, useValue: subOrderDataService },
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
  });

  it("should render welcome panel and quick actions for a fresh chat", async () => {
    await fixture.whenStable();
    fixture.detectChanges();
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
    await fixture.whenStable();
    fixture.detectChanges();

    const activeId = component.activeConversationId();
    expect(component.conversations().length).toBeGreaterThan(1);
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
    await fixture.whenStable();
    fixture.detectChanges();

    const latest = component.messages().at(-1);
    expect(latest?.text.toLowerCase()).toContain("don't have access");
  });

  it("should hide quick actions while create workflow is active", async () => {
    const create = component
      .quickActions()
      .find((item) => item.id === "ops-create-order");
    expect(create).toBeDefined();
    if (!create) {
      throw new Error("Missing create quick action");
    }

    component.onQuickAction(create);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(
      fixture.debugElement.query(By.css("[data-testid='welcome-block']")),
    ).toBeNull();
    expect(
      fixture.debugElement.query(By.css("[data-testid='ai-order-workflow-panel']")),
    ).toBeTruthy();
  });

  it("should re-show quick actions when user asks to show quick actions", async () => {
    await component.submitPrompt("show services");
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(
      fixture.debugElement.query(By.css("[data-testid='welcome-block']")),
    ).toBeNull();

    await component.submitPrompt("show quick actions");
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(
      fixture.debugElement.query(By.css("[data-testid='welcome-block']")),
    ).toBeTruthy();
  });
});
