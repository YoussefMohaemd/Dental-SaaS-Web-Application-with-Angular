import { signal, type Signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { AuthService, type AuthenticatedUser } from "@core/services/auth.service";
import { AuthorizationService } from "@core/services/authorization.service";
import { AssistantDataService } from "@core/services/assistant-data.service";
import { ClinicDataService } from "@core/services/clinic-data.service";
import { DoctorDataService } from "@core/services/doctor-data.service";
import { NavigationService } from "@core/services/navigation.service";
import { OrderDataService } from "@core/services/order-data.service";
import { PatientDataService } from "@core/services/patient-data.service";
import { SubOrderDataService } from "@core/services/sub-order-data.service";
import { Clinic, Doctor, Order, Patient } from "@core/interfaces";
import { of, throwError } from "rxjs";
import { AiChatFacade } from "./ai-chat.facade";

describe("AiChatFacade", () => {
  let facade: AiChatFacade;
  let currentUser: ReturnType<typeof signal<AuthenticatedUser | null>>;
  let authorizationService: jasmine.SpyObj<AuthorizationService>;
  let navigationService: jasmine.SpyObj<NavigationService>;
  let assistantDataService: jasmine.SpyObj<AssistantDataService>;
  let patientsState: ReturnType<typeof signal<Patient[]>>;
  let doctorsState: ReturnType<typeof signal<Doctor[]>>;
  let clinicsState: ReturnType<typeof signal<Clinic[]>>;
  let ordersState: ReturnType<typeof signal<Order[]>>;
  let patientDataServiceMock: { patients: Signal<Patient[]>; loadPatients: jasmine.Spy };
  let doctorDataServiceMock: { doctors: Signal<Doctor[]>; loadDoctors: jasmine.Spy };
  let clinicDataServiceMock: { clinics: Signal<Clinic[]>; loadClinics: jasmine.Spy };
  let orderDataServiceMock: { orders: Signal<Order[]>; loadOrders: jasmine.Spy };
  let subOrderDataServiceMock: { load: jasmine.Spy };

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
    assistantDataService.getSuggestions$.and.returnValue(of([{ id: "assistant-create-order", title: "Create order", description: "", category: "orders", template: "", requiredCapabilities: [], resultType: "text", enabled: true }]));
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
    patientsState = signal<Patient[]>([
      {
        id: "patient-1",
        name: "youssef",
        dob: "1999-01-01",
        gender: "M",
        phone: "01151711722",
        email: "y@example.com",
        clinicId: "clinic-2",
        clinicName: "Dental Care Clinic 2",
        doctorId: "doctor-1",
        doctorName: "Omar Khalil",
        status: "Active",
        ordersCount: 0,
        lastVisit: "2026-10-01",
      },
      {
        id: "patient-2",
        name: "yousseff",
        dob: "1998-04-11",
        gender: "M",
        phone: "01151711723",
        email: "yy@example.com",
        clinicId: "clinic-2",
        clinicName: "Dental Care Clinic 2",
        doctorId: "doctor-1",
        doctorName: "Omar Khalil",
        status: "Active",
        ordersCount: 0,
        lastVisit: "2026-10-05",
      },
      {
        id: "patient-3",
        name: "youssef",
        dob: "1997-02-20",
        gender: "M",
        phone: "01151711724",
        email: "yyy@example.com",
        clinicId: "clinic-3",
        clinicName: "Dental Care Clinic 3",
        doctorId: "doctor-2",
        doctorName: "Dr Other",
        status: "Active",
        ordersCount: 0,
        lastVisit: "2026-10-08",
      },
    ]);
    doctorsState = signal<Doctor[]>([
      {
        id: "doctor-1",
        name: "Omar Khalil",
        specialty: "Orthodontics",
        clinicId: "clinic-2",
        clinicName: "Dental Care Clinic 2",
        email: "omar@example.com",
        phone: "01000000001",
        status: "Active",
        ordersCount: 0,
        joinedDate: "2024-01-01",
        avatar: "",
      },
      {
        id: "doctor-2",
        name: "Dr Other",
        specialty: "Surgery",
        clinicId: "clinic-3",
        clinicName: "Dental Care Clinic 3",
        email: "other@example.com",
        phone: "01000000002",
        status: "Active",
        ordersCount: 0,
        joinedDate: "2024-01-01",
        avatar: "",
      },
    ]);
    clinicsState = signal<Clinic[]>([
      {
        id: "clinic-2",
        name: "Dental Care Clinic 2",
        address: "Giza",
        city: "Giza",
        phone: "0105555002",
        email: "clinic2@example.com",
        doctorsCount: 1,
        patientsCount: 2,
        ordersCount: 0,
        status: "Active",
        accountManager: "A",
      },
      {
        id: "clinic-3",
        name: "Dental Care Clinic 3",
        address: "Cairo",
        city: "Cairo",
        phone: "0105555003",
        email: "clinic3@example.com",
        doctorsCount: 1,
        patientsCount: 1,
        ordersCount: 0,
        status: "Active",
        accountManager: "B",
      },
    ]);
    ordersState = signal<Order[]>([
      {
        id: "order-1",
        orderNumber: "ORD-1",
        patientId: "patient-1",
        patientName: "youssef",
        doctorId: "doctor-1",
        doctorName: "Omar Khalil",
        clinicId: "clinic-2",
        clinicName: "Dental Care Clinic 2",
        scanCenterId: "",
        scanCenterName: "",
        status: "New",
        priority: "Normal",
        restoration: "Crown",
        arch: "Both",
        format: "STL",
        shade: "A2",
        units: 1,
        amount: 250,
        billed: false,
        billTo: "doctor",
        vouchers: 0,
        isLocked: false,
        hasNotes: false,
        notes: "",
        receivedAt: "2026-10-01",
        updatedAt: "2026-10-01",
        dueDate: "2026-10-10",
        creationData: {
          services: [{ serviceId: "treatment-plan", selectedTeeth: [11], serviceDetails: {}, serviceForm: {}, scanRequirements: [], fileReferences: [] }],
        },
      },
    ]);

    patientDataServiceMock = {
      patients: patientsState.asReadonly(),
      loadPatients: jasmine.createSpy("loadPatients"),
    };
    doctorDataServiceMock = {
      doctors: doctorsState.asReadonly(),
      loadDoctors: jasmine.createSpy("loadDoctors"),
    };
    clinicDataServiceMock = {
      clinics: clinicsState.asReadonly(),
      loadClinics: jasmine.createSpy("loadClinics"),
    };
    orderDataServiceMock = {
      orders: ordersState.asReadonly(),
      loadOrders: jasmine.createSpy("loadOrders"),
    };
    subOrderDataServiceMock = {
      load: jasmine.createSpy("load"),
    };

    TestBed.configureTestingModule({
      providers: [
        AiChatFacade,
        { provide: AuthService, useValue: { user: currentUser.asReadonly() } },
        { provide: AuthorizationService, useValue: authorizationService },
        { provide: NavigationService, useValue: navigationService },
        { provide: AssistantDataService, useValue: assistantDataService },
        {
          provide: PatientDataService,
          useValue: patientDataServiceMock,
        },
        {
          provide: DoctorDataService,
          useValue: doctorDataServiceMock,
        },
        {
          provide: ClinicDataService,
          useValue: clinicDataServiceMock,
        },
        {
          provide: OrderDataService,
          useValue: orderDataServiceMock,
        },
        { provide: SubOrderDataService, useValue: subOrderDataServiceMock },
      ],
    });

    facade = TestBed.inject(AiChatFacade);
    await flushAsyncFacadeInit();
  });

  it("starts with welcome state", () => {
    expect(assistantDataService.listConversations$).toHaveBeenCalled();
    expect(patientDataServiceMock.loadPatients).toHaveBeenCalled();
    expect(doctorDataServiceMock.loadDoctors).toHaveBeenCalled();
    expect(clinicDataServiceMock.loadClinics).toHaveBeenCalled();
    expect(orderDataServiceMock.loadOrders).toHaveBeenCalled();
    expect(facade.showWelcome()).toBeTrue();
    expect(facade.messages().length).toBeGreaterThan(0);
  });

  it("shows fixed FAQ quick actions on initial load", () => {
    const ids = facade.quickActions().map((item) => item.id);
    expect(ids).toContain("faq-about-company");
    expect(ids).toContain("faq-services");
    expect(ids).toContain("faq-pricing");
    expect(ids).toContain("faq-submission-standards");
    expect(ids).toContain("ops-create-report");
    expect(ids).not.toContain("ops-overdue-orders");
  });

  it("starts create-report quick action as a guided workflow before sending", async () => {
    const action = facade.quickActions().find((item) => item.id === "ops-create-report");
    expect(action).toBeDefined();
    if (!action) {
      throw new Error("Missing ops-create-report quick action");
    }

    facade.runQuickAction(action);
    await Promise.resolve();
    await Promise.resolve();

    expect(assistantDataService.postMessage$).not.toHaveBeenCalled();
    expect(facade.activeWorkflow()?.action.id).toBe("ops-create-report");
    expect(facade.activeWorkflowField()?.key).toBe("reportGoal");
    expect(facade.activeWorkflow()?.fields.length).toBe(1);
  });

  it("sends create-report workflow prompt from one request and enforces aggregate total output", async () => {
    const action = facade.quickActions().find((item) => item.id === "ops-create-report");
    expect(action).toBeDefined();
    if (!action) {
      throw new Error("Missing ops-create-report quick action");
    }

    facade.runQuickAction(action);
    facade.updateWorkflowInput("عايز أرباح الشهر اللي فات (أكتوبر 2026)");
    facade.continueWorkflow();
    await flushAsyncFacadeInit();

    const prompt = assistantDataService.postMessage$.calls.mostRecent().args[1] as string;
    expect(prompt).toContain("Use only read/report retrieval actions");
    expect(prompt).toContain("STRICTLY FORBIDDEN: Do NOT include any write action");
    expect(prompt).toContain("MANDATORY: When the user asks for profit/revenue/total amount");
    expect(prompt).toContain("return one clear total amount");
    expect(prompt).toContain("- Report goal: عايز أرباح الشهر اللي فات (أكتوبر 2026)");
    expect(prompt).not.toContain("- Date range:");
    expect(prompt).not.toContain("- Filters:");
    expect(prompt).not.toContain("- Output style:");
  });

  it("sends prompt through backend assistant api", async () => {
    await facade.submitPrompt("show services");

    expect(facade.showWelcome()).toBeFalse();
    expect(facade.messages().at(-1)?.role).toBe("assistant");
    expect(facade.messages().at(-1)?.text).toContain("Live backend response");
    expect(assistantDataService.createConversation$).toHaveBeenCalled();
    expect(assistantDataService.postMessage$).toHaveBeenCalled();
  });

  it("shows permission message when backend denies action", async () => {
    assistantDataService.postMessage$.and.returnValue(
      throwError(() => ({
        status: 403,
        error: { error: { message: "Assistant tool permission denied" } },
      })),
    );

    await facade.submitPrompt("delete order ord-500");
    expect(facade.messages().at(-1)?.text.toLowerCase()).toContain("don't have access");
  });

  it("shows backend business-rule message instead of generic unavailable error", async () => {
    assistantDataService.postMessage$.and.returnValue(
      throwError(() => ({
        status: 400,
        error: { error: { message: "Clinic f5d9afd005f77d5531ffefe5 does not exist" } },
      })),
    );

    await facade.submitPrompt("create order");
    expect(facade.messages().at(-1)?.text).toContain(
      "Clinic f5d9afd005f77d5531ffefe5 does not exist",
    );
  });

  it("maps confirmation actions to shortcut buttons", async () => {
    assistantDataService.postMessage$.and.returnValue(
      of({
        conversationId: "conv-backend-1",
        messageId: "m2",
        result: {
          type: "confirmation",
          text: "Review and confirm",
          pendingActions: [
            {
              actionId: "a-pending-1",
              tool: "update_order",
              expiresAt: new Date().toISOString(),
              confirmationToken: "token-1",
              payload: { orderId: "ord-1" },
            },
          ],
        },
      }),
    );

    await facade.submitPrompt("update order ord-1");
    const latest = facade.messages().at(-1);
    expect(latest?.type).toBe("confirmation");
    expect(latest?.actions?.length).toBe(1);
    expect(latest?.actions?.[0]?.description).toContain('"orderId":"ord-1"');
  });

  it("does not recreate conversation for generic 404 errors unrelated to conversation lookup", async () => {
    assistantDataService.postMessage$.and.returnValue(
      throwError(() => ({
        status: 404,
        error: { error: { code: "NOT_FOUND", message: "Patient not found" } },
      })),
    );

    await facade.submitPrompt("create order for missing patient");

    expect(assistantDataService.createConversation$).toHaveBeenCalledTimes(1);
    expect(assistantDataService.postMessage$).toHaveBeenCalledTimes(1);
  });

  it("recreates conversation when backend says assistant conversation is invalid", async () => {
    assistantDataService.postMessage$.and.returnValues(
      throwError(() => ({
        status: 400,
        error: { error: { code: "VALIDATION_ERROR", message: "Assistant conversation is invalid" } },
      })),
      of({
        conversationId: "conv-backend-2",
        messageId: "m-retry",
        result: {
          type: "text",
          text: "Recovered after recreation",
          plannedActions: 0,
          executions: [],
        },
      }),
    );

    assistantDataService.createConversation$.and.returnValues(
      of({
        id: "conv-backend-1",
        title: "Backend",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      }),
      of({
        id: "conv-backend-2",
        title: "Backend recovered",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      }),
    );

    await facade.submitPrompt("show services");

    expect(assistantDataService.createConversation$).toHaveBeenCalledTimes(2);
    expect(assistantDataService.postMessage$).toHaveBeenCalledTimes(2);
    expect(facade.messages().at(-1)?.text).toContain("Recovered after recreation");
  });

  it("refreshes orders and sub-orders after confirming a pending action", async () => {
    assistantDataService.postMessage$.and.returnValue(
      of({
        conversationId: "conv-backend-1",
        messageId: "m2",
        result: {
          type: "confirmation",
          text: "Review and confirm",
          pendingActions: [
            {
              actionId: "a-pending-refresh",
              tool: "update_order",
              expiresAt: new Date().toISOString(),
              confirmationToken: "token-refresh",
              payload: { orderId: "order-1" },
            },
          ],
        },
      }),
    );

    await facade.submitPrompt("update order order-1");
    const action = facade.messages().at(-1)?.actions?.[0];
    expect(action).toBeDefined();
    if (!action) {
      throw new Error("Missing confirmation action");
    }

    facade.runShortcutAction(action);
    await Promise.resolve();
    await Promise.resolve();

    expect(assistantDataService.confirmAction$).toHaveBeenCalledWith(
      "a-pending-refresh",
      "token-refresh",
    );
    expect(orderDataServiceMock.loadOrders).toHaveBeenCalled();
    expect(subOrderDataServiceMock.load).toHaveBeenCalled();
  });

  it("hides quick actions after selecting an action", () => {
    const action = facade.quickActions().find((item) => item.id === "faq-services");
    expect(action).toBeDefined();
    if (!action) {
      throw new Error("Missing faq-services quick action");
    }

    facade.runQuickAction(action);
    expect(facade.showWelcome()).toBeFalse();
  });

  it("starts create-order quick action as workflow without sending backend message immediately", async () => {
    const action = facade.quickActions().find((item) => item.id === "ops-create-order");
    expect(action).toBeDefined();
    if (!action) {
      throw new Error("Missing ops-create-order quick action");
    }

    facade.runQuickAction(action);
    await Promise.resolve();
    await Promise.resolve();

    expect(assistantDataService.postMessage$).not.toHaveBeenCalled();
    const messages = facade.messages();
    expect(messages.at(-2)?.role).toBe("user");
    expect(messages.at(-2)?.text).toBe("Create Order");
    expect(messages.at(-1)?.role).toBe("assistant");
    expect(messages.at(-1)?.text.toLowerCase()).toContain("step by step");
  });

  it("keeps update-order quick action visible when backend suggestions omit it", () => {
    const action = facade.quickActions().find((item) => item.id === "ops-update-order");
    expect(action).toBeDefined();
  });

  it("does not expose refs json in create-order workflow notice", () => {
    const action = facade.quickActions().find((item) => item.id === "ops-create-order");
    expect(action).toBeDefined();
    if (!action) {
      throw new Error("Missing ops-create-order quick action");
    }

    facade.runQuickAction(action);
    facade.updateOrderWorkflowInput("patient-1");
    facade.continueOrderWorkflow();

    const workflow = facade.activeOrderWorkflow();
    expect(workflow?.step).toBe("billTo");
    expect(workflow?.notice).not.toContain("refs:");
  });

  it("sends create-order prompt that uses patient name and does not force patient id", async () => {
    const action = facade.quickActions().find((item) => item.id === "ops-create-order");
    expect(action).toBeDefined();
    if (!action) {
      throw new Error("Missing ops-create-order quick action");
    }

    facade.runQuickAction(action);
    facade.updateOrderWorkflowInput("patient-1");
    facade.continueOrderWorkflow();
    facade.updateOrderWorkflowInput("doctor-1");
    facade.continueOrderWorkflow();
    facade.updateOrderWorkflowInput("clinic-1");
    facade.continueOrderWorkflow();
    facade.continueOrderWorkflow();

    const createWorkflow = facade.activeOrderWorkflow();
    const serviceId = createWorkflow?.services[0]?.id;
    expect(serviceId).toBeDefined();
    if (!serviceId) {
      throw new Error("No services available for create-order workflow");
    }
    facade.toggleOrderWorkflowService(serviceId);
    facade.continueOrderWorkflow();
    facade.toggleOrderWorkflowTooth(11);
    facade.continueOrderWorkflow();
    facade.submitOrderWorkflow();
    await flushAsyncFacadeInit();

    const prompt = assistantDataService.postMessage$.calls.mostRecent().args[1] as string;
    expect(prompt).toContain("MUST include a create_order action in this same response.");
    expect(prompt).toContain("Use the exact IDs supplied below.");
    expect(prompt).toContain("\"tool\":\"create_order\"");
    expect(prompt).toContain("\"patientName\":\"youssef\"");
    expect(prompt).not.toContain("\"patientId\":");
    expect(prompt).toContain("\"doctorId\":\"doctor-1\"");
    expect(prompt).toContain("\"clinicId\":\"clinic-2\"");
  });

  it("builds create-order payload with per-service teeth mapping", async () => {
    const action = facade.quickActions().find((item) => item.id === "ops-create-order");
    expect(action).toBeDefined();
    if (!action) {
      throw new Error("Missing ops-create-order quick action");
    }

    facade.runQuickAction(action);
    facade.updateOrderWorkflowInput("patient-1");
    facade.continueOrderWorkflow();
    facade.updateOrderWorkflowInput("doctor-1");
    facade.continueOrderWorkflow();
    facade.updateOrderWorkflowInput("clinic-1");
    facade.continueOrderWorkflow();
    facade.continueOrderWorkflow();

    const services = facade.activeOrderWorkflow()?.services ?? [];
    expect(services.length).toBeGreaterThanOrEqual(2);
    const firstService = services[0]?.id;
    const secondService = services[1]?.id;
    if (!firstService || !secondService) {
      throw new Error("Expected at least two services");
    }

    facade.toggleOrderWorkflowService(firstService);
    facade.toggleOrderWorkflowService(secondService);
    facade.setOrderWorkflowActiveService(firstService);
    facade.toggleOrderWorkflowTooth(11);
    facade.toggleOrderWorkflowTooth(41);
    facade.setOrderWorkflowActiveService(secondService);
    facade.toggleOrderWorkflowTooth(24);
    facade.continueOrderWorkflow();
    facade.continueOrderWorkflow();
    facade.submitOrderWorkflow();
    await flushAsyncFacadeInit();

    const prompt = assistantDataService.postMessage$.calls.mostRecent().args[1] as string;
    expect(prompt).toContain('"serviceId":"treatment-plan","selectedTeeth":[11,41]');
    expect(prompt).toContain('"selectedTeeth":[24]');
  });

  it("requires scan center id when bill-to target is scan center and includes it in action payload", async () => {
    const action = facade.quickActions().find((item) => item.id === "ops-create-order");
    expect(action).toBeDefined();
    if (!action) {
      throw new Error("Missing ops-create-order quick action");
    }

    facade.runQuickAction(action);
    facade.updateOrderWorkflowInput("patient-1");
    facade.continueOrderWorkflow();
    expect(facade.activeOrderWorkflow()?.step).toBe("billTo");
    facade.setOrderWorkflowBillTo("scan-center");
    facade.continueOrderWorkflow();
    expect(facade.activeOrderWorkflow()?.error).toContain("Scan center ID is required");

    facade.updateOrderWorkflowInput("scan-center-7");
    facade.continueOrderWorkflow();
    const serviceId = facade.activeOrderWorkflow()?.services[0]?.id;
    if (!serviceId) {
      throw new Error("No services available");
    }
    facade.toggleOrderWorkflowService(serviceId);
    facade.continueOrderWorkflow();
    facade.toggleOrderWorkflowTooth(11);
    facade.continueOrderWorkflow();
    facade.submitOrderWorkflow();
    await flushAsyncFacadeInit();

    const prompt = assistantDataService.postMessage$.calls.mostRecent().args[1] as string;
    expect(prompt).toContain('"scanCenterId":"scan-center-7"');
  });

  it("shows patient candidates when patient lookup is ambiguous", () => {
    const action = facade.quickActions().find((item) => item.id === "ops-create-order");
    expect(action).toBeDefined();
    if (!action) {
      throw new Error("Missing ops-create-order quick action");
    }

    facade.runQuickAction(action);
    facade.updateOrderWorkflowInput("youssef");
    facade.continueOrderWorkflow();

    const workflow = facade.activeOrderWorkflow();
    expect(workflow?.step).toBe("patient");
    expect(workflow?.create?.patientCandidates.length).toBe(2);
  });

  it("continues create-order flow with new patient when patient is not found", () => {
    const action = facade.quickActions().find((item) => item.id === "ops-create-order");
    expect(action).toBeDefined();
    if (!action) {
      throw new Error("Missing ops-create-order quick action");
    }

    facade.runQuickAction(action);
    facade.updateOrderWorkflowInput("patient-not-found");
    facade.continueOrderWorkflow();

    const workflow = facade.activeOrderWorkflow();
    expect(workflow?.step).toBe("doctor");
    expect(workflow?.create?.patient).toBeNull();
    expect(workflow?.create?.patientReference).toBe("patient-not-found");
  });

  it("auto-selects linked doctor and clinic after choosing a patient", () => {
    const action = facade.quickActions().find((item) => item.id === "ops-create-order");
    expect(action).toBeDefined();
    if (!action) {
      throw new Error("Missing ops-create-order quick action");
    }

    patientsState.set([patientsState()[0] as Patient]);

    facade.runQuickAction(action);
    facade.updateOrderWorkflowInput("patient-1");
    facade.continueOrderWorkflow();

    const workflow = facade.activeOrderWorkflow();
    expect(workflow?.step).toBe("billTo");
    expect(workflow?.create?.doctorReference).toBe("doctor-1");
    expect(workflow?.create?.clinicReference).toBe("clinic-2");
  });

  it("sends update-order prompt that explicitly requires backend update_order action", async () => {
    const action = facade.quickActions().find((item) => item.id === "ops-update-order");
    expect(action).toBeDefined();
    if (!action) {
      throw new Error("Missing ops-update-order quick action");
    }

    facade.runQuickAction(action);
    facade.updateOrderWorkflowInput("ORD-1");
    facade.continueOrderWorkflow();

    const updateWorkflow = facade.activeOrderWorkflow();
    const serviceId = updateWorkflow?.services[0]?.id;
    expect(serviceId).toBeDefined();
    if (!serviceId) {
      throw new Error("No services available for update-order workflow");
    }
    facade.toggleOrderWorkflowService(serviceId);
    facade.continueOrderWorkflow();
    facade.submitOrderWorkflow();
    await flushAsyncFacadeInit();

    const prompt = assistantDataService.postMessage$.calls.mostRecent().args[1] as string;
    expect(prompt).toContain("MUST include an update_order action in this same response.");
  });

  it("asks full create-doctor required fields in workflow", () => {
    const action = facade.quickActions().find((item) => item.id === "ops-create-doctor");
    expect(action).toBeDefined();
    if (!action) {
      throw new Error("Missing ops-create-doctor quick action");
    }

    facade.runQuickAction(action);
    const workflow = facade.activeWorkflow();
    expect(workflow?.fields.map((field) => field.key)).toEqual([
      "name",
      "specialty",
      "clinic",
      "email",
      "phone",
      "joinedDate",
    ]);
  });

  it("asks full create-clinic required fields in workflow", () => {
    const action = facade.quickActions().find((item) => item.id === "ops-create-clinic");
    expect(action).toBeDefined();
    if (!action) {
      throw new Error("Missing ops-create-clinic quick action");
    }

    facade.runQuickAction(action);
    const workflow = facade.activeWorkflow();
    expect(workflow?.fields.map((field) => field.key)).toEqual([
      "name",
      "address",
      "city",
      "phone",
      "email",
      "accountManager",
    ]);
  });

  it("asks full create-patient required fields in workflow", () => {
    const action = facade.quickActions().find((item) => item.id === "ops-create-patient");
    expect(action).toBeDefined();
    if (!action) {
      throw new Error("Missing ops-create-patient quick action");
    }

    facade.runQuickAction(action);
    const workflow = facade.activeWorkflow();
    expect(workflow?.fields.map((field) => field.key)).toEqual([
      "name",
      "dob",
      "gender",
      "phone",
      "email",
      "clinic",
      "doctor",
    ]);
  });

  it("sends create-patient prompt that enforces create_patient action only", async () => {
    const action = facade.quickActions().find((item) => item.id === "ops-create-patient");
    expect(action).toBeDefined();
    if (!action) {
      throw new Error("Missing ops-create-patient quick action");
    }

    facade.runQuickAction(action);
    const values = [
      "Youssef",
      "1999-01-01",
      "M",
      "01151711722",
      "ym0998682@gmail.com",
      "Dental Care Clinic 10",
      "Mostafa Samir",
    ];
    for (const value of values) {
      facade.updateWorkflowInput(value);
      facade.continueWorkflow();
    }
    await flushAsyncFacadeInit();

    const prompt = assistantDataService.postMessage$.calls.mostRecent().args[1] as string;
    expect(prompt).toContain("MUST include a create_patient action in this same response.");
    expect(prompt).toContain("Do not call catalog/company info tools for this request.");
  });

  it("boots into a fresh new chat while keeping previous history entries", async () => {
    const existingUpdatedAt = new Date().toISOString();
    assistantDataService.listConversations$.and.returnValue(
      of([
        {
          id: "conv-existing-1",
          title: "Existing conversation",
          status: "active",
          createdAt: existingUpdatedAt,
          updatedAt: existingUpdatedAt,
          preview: "History preview",
        },
      ]),
    );
    assistantDataService.getConversation$.and.returnValue(
      of({
        id: "conv-existing-1",
        title: "Existing conversation",
        status: "active",
        createdAt: existingUpdatedAt,
        updatedAt: existingUpdatedAt,
        messages: [
          {
            id: "backend-msg-1",
            role: "assistant",
            text: "Loaded from history",
            createdAt: existingUpdatedAt,
            resultType: "text",
          },
        ],
      }),
    );

    currentUser.set(makeUser("user-doctor-2"));
    await flushAsyncFacadeInit();

    expect(facade.activeConversation()?.title).toBe("New conversation");
    expect(facade.showWelcome()).toBeTrue();
    expect(facade.messages().length).toBeGreaterThan(0);

    const historyEntry = facade
      .conversationSummaries()
      .find((item) => item.id === "conv-existing-1");
    expect(historyEntry).toBeDefined();

    facade.selectConversation("conv-existing-1");
    await flushAsyncFacadeInit();

    expect(assistantDataService.getConversation$).toHaveBeenCalledWith(
      "conv-existing-1",
    );
    expect(facade.messages().at(-1)?.text).toContain("Loaded from history");
    expect(facade.showWelcome()).toBeFalse();
  });

  async function flushAsyncFacadeInit(): Promise<void> {
    for (let index = 0; index < 5; index += 1) {
      (TestBed as unknown as { flushEffects?: () => void }).flushEffects?.();
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
});
