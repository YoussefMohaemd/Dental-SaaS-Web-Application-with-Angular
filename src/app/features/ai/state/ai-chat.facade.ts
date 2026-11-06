import { computed, effect, Injectable, inject, signal, untracked } from "@angular/core";
import {
  AiChatMessage,
  AiConversation,
  AiConversationSummary,
  AiPromptDraft,
  AiQuickAction,
  AiShortcutAction,
  Clinic,
  CreateOrderService,
  Doctor,
  Order,
  Patient,
} from "@core/interfaces";
import {
  AssistantConfirmActionResponseDto,
  AssistantConversationSummaryDto,
  AssistantConversationViewDto,
  AssistantDataService,
  AssistantMessageResponseDto,
} from "@core/services/assistant-data.service";
import { AuthService } from "@core/services/auth.service";
import { AuthorizationService } from "@core/services/authorization.service";
import { ClinicDataService } from "@core/services/clinic-data.service";
import { DoctorDataService } from "@core/services/doctor-data.service";
import { NavigationService } from "@core/services/navigation.service";
import { OrderDataService } from "@core/services/order-data.service";
import { PatientDataService } from "@core/services/patient-data.service";
import {
  CreateSubOrderInput,
  SubOrderDataService,
} from "@core/services/sub-order-data.service";
import { DentalCapability } from "@core/security/capabilities";
import { firstValueFrom } from "rxjs";
import {
  AVAILABLE_SERVICES,
} from "@core/interfaces";
import {
  defaultServiceClinicalForm,
  defaultServiceDetail,
  deriveArchFromSelection,
  mapServiceToRestoration,
  normalizeLookup,
  parseTeethInput,
} from "@features/orders/order-flow.utils";
import { AI_QUICK_ACTIONS, AI_WELCOME_MESSAGE } from "../data/ai-chat.config";
import {
  AiOrderWorkflowMode,
  AiOrderWorkflowState,
} from "./ai-order-workflow.models";

@Injectable({ providedIn: "root" })
export class AiChatFacade {
  private readonly authService = inject(AuthService);
  private readonly authorizationService = inject(AuthorizationService);
  private readonly navigationService = inject(NavigationService);
  private readonly assistantDataService = inject(AssistantDataService);
  private readonly patientDataService = inject(PatientDataService);
  private readonly doctorDataService = inject(DoctorDataService);
  private readonly clinicDataService = inject(ClinicDataService);
  private readonly orderDataService = inject(OrderDataService);
  private readonly subOrderDataService = inject(SubOrderDataService);

  private messageSequence = 0;
  private localConversationSequence = 0;
  private readonly backendConversationByLocalId = new Map<string, string>();
  private backendAllowedSuggestionIds = new Set<string>();
  private currentUserId: string | null = null;
  private sessionGeneration = 0;

  readonly promptDraft = signal<AiPromptDraft>({
    search: "",
    prompt: "",
  });
  readonly isResponding = signal(false);
  readonly historyOpen = signal(false);
  readonly conversations = signal<AiConversation[]>([]);
  readonly activeConversationId = signal<string | null>(null);
  readonly orderWorkflow = signal<AiOrderWorkflowState | null>(null);

  readonly activeConversation = computed(() =>
    this.conversations().find((item) => item.id === this.activeConversationId()),
  );

  readonly messages = computed(() => this.activeConversation()?.messages ?? []);

  readonly showWelcome = computed(
    () => this.activeConversation()?.showWelcomeActions ?? false,
  );

  readonly conversationSummaries = computed<AiConversationSummary[]>(() => {
    const activeId = this.activeConversationId();
    return this.conversations().map((conversation) => ({
      id: conversation.id,
      title: conversation.title,
      updatedAt: conversation.updatedAt,
      preview: conversation.messages.at(-1)?.text ?? "No messages yet.",
      isActive: conversation.id === activeId,
    }));
  });

  readonly quickActions = computed(() =>
    AI_QUICK_ACTIONS.filter((action) => this.isQuickActionVisible(action)),
  );

  readonly canSend = computed(
    () => this.promptDraft().prompt.trim().length > 0 && !this.isResponding(),
  );

  public constructor() {
    effect(() => {
      const userId = this.authService.user()?.userId ?? null;
      untracked(() => this.onSessionChanged(userId));
    });
  }

  toggleHistory(): void {
    this.historyOpen.update((state) => !state);
  }

  closeHistory(): void {
    this.historyOpen.set(false);
  }

  selectConversation(conversationId: string): void {
    const exists = this.conversations().some((item) => item.id === conversationId);
    if (!exists) {
      return;
    }

    this.activeConversationId.set(conversationId);
    if (this.navigationService.isMobile()) {
      this.historyOpen.set(false);
    }

    void this.loadConversationMessages(conversationId);
  }

  startNewChat(): void {
    const active = this.activeConversation();
    if (active && active.showWelcomeActions && !this.backendConversationByLocalId.has(active.id)) {
      this.promptDraft.update((state) => ({ ...state, prompt: "" }));
      this.closeHistory();
      this.cancelOrderWorkflow();
      return;
    }

    const localId = this.nextLocalConversationId();
    const conversation = this.createConversationShell(localId, "New conversation");
    this.conversations.update((state) => [conversation, ...state]);
    this.activeConversationId.set(localId);
    this.promptDraft.update((state) => ({ ...state, prompt: "" }));
    this.closeHistory();
    this.cancelOrderWorkflow();
  }

  updateDraft(prompt: string): void {
    this.promptDraft.update((state) => ({ ...state, prompt }));
  }

  async submitPrompt(rawPrompt?: string): Promise<void> {
    const prompt = (rawPrompt ?? this.promptDraft().prompt).trim();
    const conversationId = this.activeConversationId();
    if (!prompt || !conversationId || this.isResponding()) {
      return;
    }

    this.promptDraft.update((state) => ({ ...state, prompt: "" }));
    this.setWelcomeActions(conversationId, false);
    this.appendMessage(conversationId, {
      id: this.nextMessageId(),
      role: "user",
      text: prompt,
      createdAt: new Date().toISOString(),
      type: "text",
    });

    if (isShowQuickActionsCommand(prompt)) {
      this.orderWorkflow.set(null);
      this.setWelcomeActions(conversationId, true);
      this.appendAssistantText("Quick actions are shown again.");
      return;
    }

    if (this.orderWorkflow()) {
      this.updateWorkflowInput(prompt);
      await this.advanceOrderWorkflow();
      return;
    }

    const detectedMode = this.detectOrderWorkflowMode(prompt);
    if (detectedMode) {
      this.startOrderWorkflow(detectedMode);
      return;
    }

    const loadingMessageId = this.nextMessageId();
    this.appendMessage(conversationId, {
      id: loadingMessageId,
      role: "thinking",
      text: "Thinking through your request...",
      createdAt: new Date().toISOString(),
      type: "loading",
    });

    this.refreshConversationTitle(conversationId, prompt);
    const generation = this.sessionGeneration;
    this.isResponding.set(true);
    try {
      const response = await this.postMessageWithConversationRecovery(conversationId, prompt);
      if (generation !== this.sessionGeneration) {
        return;
      }
      this.replaceMessage(
        conversationId,
        loadingMessageId,
        this.toAssistantMessage(response),
      );
      this.touchConversation(conversationId);
    } catch (error) {
      if (generation !== this.sessionGeneration) {
        return;
      }
      this.replaceMessage(conversationId, loadingMessageId, {
        id: this.nextMessageId(),
        role: "assistant",
        text: this.resolveAssistantErrorText(error),
        createdAt: new Date().toISOString(),
        type: "error",
        markdown: true,
        canCopy: true,
      });
    } finally {
      if (generation === this.sessionGeneration) {
        this.isResponding.set(false);
      }
    }
  }

  runQuickAction(action: AiQuickAction): void {
    if (!this.isQuickActionVisible(action)) {
      this.appendAssistantText(
        "You don't have access for that action in this account.",
        "error",
      );
      return;
    }

    if (action.id === "ops-create-order") {
      this.startOrderWorkflow("create");
      return;
    }

    if (action.id === "ops-update-order") {
      this.startOrderWorkflow("update");
      return;
    }

    if (action.id === "ops-open-order-detail") {
      this.updateDraft(action.prefillPrompt);
      this.appendAssistantText(
        "Please enter the order ID or order number (example: DL-026015), and I'll open its details.",
      );
      return;
    }

    if (action.behavior === "navigate") {
      if (action.route) {
        this.navigationService.navigate(action.route);
      }
      return;
    }

    if (action.behavior === "prefill") {
      this.updateDraft(action.prefillPrompt);
      return;
    }

    void this.submitPrompt(action.prefillPrompt);
  }

  runShortcutAction(action: AiShortcutAction): void {
    if (action.confirmation) {
      void this.confirmPendingAction(action.confirmation.actionId, action.confirmation.confirmationToken);
      return;
    }

    if (action.intent === "openOrderDetails" && action.orderId) {
      this.navigationService.navigate("viewOrder", { orderId: action.orderId });
      return;
    }

    const mapped = AI_QUICK_ACTIONS.find((item) => item.intent === action.intent);
    if (mapped) {
      this.runQuickAction(mapped);
    }
  }

  updateWorkflowInput(value: string): void {
    this.orderWorkflow.update((state) =>
      state ? { ...state, input: value, error: null } : state,
    );
  }

  pickWorkflowCandidate(id: string): void {
    this.orderWorkflow.update((state) => {
      if (!state) return state;

      if (state.mode === "create" && state.create) {
        if (state.step === "patient") {
          const patient = state.create.patientCandidates.find((item) => item.id === id) ?? null;
          if (!patient) return state;
          return {
            ...state,
            input: patient.name,
            error: null,
            create: { ...state.create, patient },
          };
        }
        if (state.step === "doctor") {
          const doctor = state.create.doctorCandidates.find((item) => item.id === id) ?? null;
          if (!doctor) return state;
          return {
            ...state,
            input: doctor.name,
            error: null,
            create: { ...state.create, doctor },
          };
        }
        if (state.step === "clinic") {
          const clinic = state.create.clinicCandidates.find((item) => item.id === id) ?? null;
          if (!clinic) return state;
          return {
            ...state,
            input: clinic.name,
            error: null,
            create: { ...state.create, clinic },
          };
        }
      }

      if (state.mode === "update" && state.update && state.step === "selectOrder") {
        const selectedOrder =
          state.update.orderCandidates.find((item) => item.id === id) ?? null;
        if (!selectedOrder) return state;
        const { services, teeth } = this.extractOrderServiceAndTeeth(selectedOrder);
        return {
          ...state,
          error: null,
          update: {
            ...state.update,
            selectedOrder,
            baselineServiceIds: services,
            selectedServiceIds: [...services],
            baselineTeeth: teeth,
            selectedTeeth: [...teeth],
            notes: selectedOrder.notes ?? "",
            billToTarget:
              selectedOrder.billTo.toLowerCase().includes("scan")
                ? "scan-center"
                : "doctor",
          },
        };
      }

      return state;
    });
  }

  setWorkflowBillTo(target: "doctor" | "scan-center"): void {
    this.orderWorkflow.update((state) => {
      if (!state) return state;
      if (state.mode === "create" && state.create) {
        return {
          ...state,
          create: { ...state.create, billToTarget: target },
        };
      }
      if (state.mode === "update" && state.update) {
        return {
          ...state,
          update: { ...state.update, billToTarget: target },
        };
      }
      return state;
    });
  }

  updateWorkflowNotes(notes: string): void {
    this.orderWorkflow.update((state) => {
      if (!state?.update) {
        return state;
      }
      return {
        ...state,
        update: {
          ...state.update,
          notes,
        },
      };
    });
  }

  toggleWorkflowService(serviceId: string): void {
    this.orderWorkflow.update((state) => {
      if (!state) return state;
      if (state.mode === "create" && state.create) {
        const selected = toggleInList(state.create.selectedServiceIds, serviceId);
        return {
          ...state,
          create: {
            ...state.create,
            selectedServiceIds: selected,
          },
          error: null,
        };
      }
      if (state.mode === "update" && state.update) {
        const selected = toggleInList(state.update.selectedServiceIds, serviceId);
        return {
          ...state,
          update: {
            ...state.update,
            selectedServiceIds: selected,
          },
          error: null,
        };
      }
      return state;
    });
  }

  toggleWorkflowTooth(tooth: number): void {
    this.orderWorkflow.update((state) => {
      if (!state) return state;
      if (state.mode === "create" && state.create) {
        const selected = toggleNumberInList(state.create.selectedTeeth, tooth);
        return {
          ...state,
          create: {
            ...state.create,
            selectedTeeth: selected,
          },
          error: null,
        };
      }
      if (state.mode === "update" && state.update) {
        const selected = toggleNumberInList(state.update.selectedTeeth, tooth);
        return {
          ...state,
          update: {
            ...state.update,
            selectedTeeth: selected,
          },
          error: null,
        };
      }
      return state;
    });
  }

  async advanceOrderWorkflow(): Promise<void> {
    const state = this.orderWorkflow();
    if (!state) return;

    if (state.mode === "create") {
      await this.advanceCreateWorkflow();
      return;
    }

    await this.advanceUpdateWorkflow();
  }

  async submitOrderWorkflow(): Promise<void> {
    const state = this.orderWorkflow();
    if (!state) return;

    if (state.mode === "create") {
      await this.submitCreateOrderWorkflow(state);
      return;
    }
    await this.submitUpdateOrderWorkflow(state);
  }

  cancelOrderWorkflow(): void {
    if (this.orderWorkflow()) {
      this.appendAssistantText("Order workflow cancelled.");
    }
    this.orderWorkflow.set(null);
  }

  resolveCopyMessage(messageId: string): string | null {
    return (
      this.messages().find((message) => message.id === messageId && message.role === "assistant")
        ?.text ?? null
    );
  }

  private startOrderWorkflow(mode: AiOrderWorkflowMode): void {
    this.ensureReferenceDataLoaded();
    const services: readonly CreateOrderService[] = AVAILABLE_SERVICES;
    if (mode === "create") {
      this.orderWorkflow.set({
        mode,
        step: "patient",
        input: "",
        loading: false,
        error: null,
        notice: null,
        services,
        create: {
          patient: null,
          doctor: null,
          clinic: null,
          billToTarget: "doctor",
          selectedServiceIds: [],
          selectedTeeth: [],
          patientCandidates: [],
          doctorCandidates: [],
          clinicCandidates: [],
        },
        update: null,
      });
      this.appendAssistantText("Let's create an order. Please enter patient name or ID.");
      return;
    }

    this.orderWorkflow.set({
      mode,
      step: "lookupOrder",
      input: "",
      loading: false,
      error: null,
      notice: null,
      services,
      create: null,
      update: {
        orderCandidates: [],
        selectedOrder: null,
        baselineServiceIds: [],
        selectedServiceIds: [],
        baselineTeeth: [],
        selectedTeeth: [],
        notes: "",
        billToTarget: "doctor",
      },
    });
    this.appendAssistantText(
      "Let's update an order. Enter order ID, order number, or patient name.",
    );
  }

  private async advanceCreateWorkflow(): Promise<void> {
    const state = this.orderWorkflow();
    if (!state?.create) return;

    const input = state.input.trim();
    if (state.step === "patient") {
      const next = this.resolveCreatePatientStep(state, input);
      this.orderWorkflow.set(next);
      return;
    }

    if (state.step === "doctor") {
      const next = this.resolveCreateDoctorStep(state, input);
      this.orderWorkflow.set(next);
      return;
    }

    if (state.step === "clinic") {
      const next = this.resolveCreateClinicStep(state, input);
      this.orderWorkflow.set(next);
      return;
    }

    if (state.step === "billTo") {
      this.orderWorkflow.set({
        ...state,
        step: "services",
        input: "",
        error: null,
      });
      return;
    }

    if (state.step === "services") {
      if (state.create.selectedServiceIds.length === 0) {
        this.orderWorkflow.set({
          ...state,
          error: "Select at least one service.",
        });
        return;
      }
      this.orderWorkflow.set({
        ...state,
        step: "teeth",
        input: "",
        error: null,
      });
      return;
    }

    if (state.step === "teeth") {
      const typedTeeth = parseTeethInput(input);
      if (typedTeeth.length > 0) {
        this.orderWorkflow.set({
          ...state,
          input: "",
          create: {
            ...state.create,
            selectedTeeth: typedTeeth,
          },
        });
        return;
      }

      if (state.create.selectedTeeth.length === 0) {
        this.orderWorkflow.set({
          ...state,
          error: "Select at least one tooth in the chart.",
        });
        return;
      }

      this.orderWorkflow.set({
        ...state,
        step: "review",
        input: "",
        error: null,
      });
    }
  }

  private async advanceUpdateWorkflow(): Promise<void> {
    const state = this.orderWorkflow();
    if (!state?.update) return;

    if (state.step === "lookupOrder") {
      const query = state.input.trim();
      if (!query) {
        this.orderWorkflow.set({ ...state, error: "Enter order ID, number, or patient name." });
        return;
      }

      const localMatches = this.findOrderCandidates(query);
      if (localMatches.length === 1) {
        const selectedOrder = localMatches[0];
        const { services, teeth } = this.extractOrderServiceAndTeeth(selectedOrder);
        this.orderWorkflow.set({
          ...state,
          step: "editOrder",
          input: "",
          error: null,
          update: {
            ...state.update,
            orderCandidates: localMatches,
            selectedOrder,
            baselineServiceIds: services,
            selectedServiceIds: [...services],
            baselineTeeth: teeth,
            selectedTeeth: [...teeth],
            notes: selectedOrder.notes ?? "",
            billToTarget:
              selectedOrder.billTo.toLowerCase().includes("scan")
                ? "scan-center"
                : "doctor",
          },
        });
        return;
      }

      if (localMatches.length > 1) {
        this.orderWorkflow.set({
          ...state,
          step: "selectOrder",
          error: "Multiple matching orders found. Pick one.",
          update: {
            ...state.update,
            orderCandidates: localMatches,
          },
        });
        return;
      }

      try {
        const fromApi = await firstValueFrom(this.orderDataService.getOrderById$(query));
        const { services, teeth } = this.extractOrderServiceAndTeeth(fromApi);
        this.orderWorkflow.set({
          ...state,
          step: "editOrder",
          input: "",
          error: null,
          update: {
            ...state.update,
            orderCandidates: [fromApi],
            selectedOrder: fromApi,
            baselineServiceIds: services,
            selectedServiceIds: [...services],
            baselineTeeth: teeth,
            selectedTeeth: [...teeth],
            notes: fromApi.notes ?? "",
            billToTarget:
              fromApi.billTo.toLowerCase().includes("scan")
                ? "scan-center"
                : "doctor",
          },
        });
      } catch {
        this.orderWorkflow.set({
          ...state,
          error: "Order was not found. Try ID, order number, or patient name.",
        });
      }
      return;
    }

    if (state.step === "selectOrder") {
      if (!state.update.selectedOrder) {
        this.orderWorkflow.set({
          ...state,
          error: "Select one order to continue.",
        });
        return;
      }
      this.orderWorkflow.set({
        ...state,
        step: "editOrder",
        error: null,
      });
      return;
    }

    if (state.step === "editOrder") {
      if (!state.update.selectedOrder) {
        this.orderWorkflow.set({
          ...state,
          error: "Select order first.",
        });
        return;
      }
      if (state.update.selectedServiceIds.length === 0) {
        this.orderWorkflow.set({
          ...state,
          error: "Select at least one service.",
        });
        return;
      }
      if (state.update.selectedTeeth.length === 0) {
        this.orderWorkflow.set({
          ...state,
          error: "Select at least one tooth.",
        });
        return;
      }
      this.orderWorkflow.set({
        ...state,
        step: "reviewUpdate",
        error: null,
      });
    }
  }

  private async submitCreateOrderWorkflow(state: AiOrderWorkflowState): Promise<void> {
    if (!state.create || state.step !== "review") {
      return;
    }

    const patient = state.create.patient;
    const doctor = state.create.doctor;
    const clinic = state.create.clinic;
    const selectedServices = state.services.filter((service) =>
      state.create?.selectedServiceIds.includes(service.id),
    );
    const selectedTeeth = state.create.selectedTeeth;

    if (!patient || !doctor || !clinic || selectedServices.length === 0 || selectedTeeth.length === 0) {
      this.orderWorkflow.set({
        ...state,
        error: "Missing required fields to create the order.",
      });
      return;
    }

    this.orderWorkflow.set({
      ...state,
      loading: true,
      error: null,
    });

    const amount = selectedServices.reduce((sum, service) => sum + service.basePrice, 0);
    const dueDate = this.defaultDueDate(selectedServices);
    const serviceRows = this.buildServiceRows(selectedServices, selectedTeeth);

    try {
      const created = await firstValueFrom(
        this.orderDataService.createOrder$({
          patientId: patient.id,
          patientName: patient.name,
          doctorId: doctor.id,
          doctorName: doctor.name,
          clinicId: clinic.id,
          clinicName: clinic.name,
          scanCenterId: "",
          scanCenterName: "",
          status: "New",
          priority: "Normal",
          restoration: mapServiceToRestoration(selectedServices[0].id),
          arch: deriveArchFromSelection(selectedTeeth),
          format: "STL",
          shade: "A2",
          units: Math.max(selectedTeeth.length, 1),
          amount,
          billed: false,
          billTo:
            state.create.billToTarget === "scan-center"
              ? "Scan Center"
              : `Doctor - ${doctor.name}`,
          vouchers: 0,
          isLocked: false,
          hasNotes: false,
          notes: "",
          dueDate,
          creationData: {
            services: serviceRows.map((row) => structuredClone(row.creationData)),
          },
        }),
      );

      await firstValueFrom(this.subOrderDataService.createForOrder$(created.id, serviceRows));

      this.appendMessageWithAction(
        [
          `Order **${created.orderNumber}** created successfully.`,
          `Patient: ${created.patientName}`,
          `Doctor: ${created.doctorName}`,
          `Clinic: ${created.clinicName}`,
          `Services: ${selectedServices.map((item) => item.name).join(", ")}`,
          `Teeth: ${selectedTeeth.join(", ")}`,
          `Amount: $${amount}`,
        ].join("\n"),
        created.id,
      );
      this.orderWorkflow.set(null);
    } catch (error) {
      this.orderWorkflow.set({
        ...state,
        loading: false,
        error:
          (error as { error?: { error?: { message?: string } } })?.error?.error
            ?.message ?? "Failed to create order. Please review your selections.",
      });
    }
  }

  private async submitUpdateOrderWorkflow(state: AiOrderWorkflowState): Promise<void> {
    if (!state.update || state.step !== "reviewUpdate" || !state.update.selectedOrder) {
      return;
    }

    const selectedOrder = state.update.selectedOrder;
    const selectedServices = state.services.filter((service) =>
      state.update?.selectedServiceIds.includes(service.id),
    );
    const selectedTeeth = state.update.selectedTeeth;
    const amount = selectedServices.reduce((sum, service) => sum + service.basePrice, 0);
    const dueDate = this.defaultDueDate(selectedServices);
    const serviceRows = this.buildServiceRows(
      selectedServices,
      selectedTeeth,
      state.update.notes,
      selectedOrder.priority,
      dueDate,
    );

    this.orderWorkflow.set({
      ...state,
      loading: true,
      error: null,
    });

    try {
      const updated = await firstValueFrom(
        this.orderDataService.updateOrder$(selectedOrder.id, {
          billTo:
            state.update.billToTarget === "scan-center"
              ? "Scan Center"
              : `Doctor - ${selectedOrder.doctorName}`,
          notes: state.update.notes,
          hasNotes: state.update.notes.trim().length > 0,
          restoration: mapServiceToRestoration(selectedServices[0]?.id ?? "other"),
          arch: deriveArchFromSelection(selectedTeeth, selectedOrder.arch),
          units: Math.max(selectedTeeth.length, 1),
          amount,
          dueDate,
          creationData: {
            services: serviceRows.map((row) => structuredClone(row.creationData)),
            communication: selectedOrder.creationData?.communication,
          },
        }),
      );
      await firstValueFrom(this.subOrderDataService.replaceForOrder$(selectedOrder.id, serviceRows));

      const addedServices = state.update.selectedServiceIds.filter(
        (id) => !state.update?.baselineServiceIds.includes(id),
      );
      const removedServices = state.update.baselineServiceIds.filter(
        (id) => !state.update?.selectedServiceIds.includes(id),
      );
      const addedTeeth = selectedTeeth.filter(
        (tooth) => !state.update?.baselineTeeth.includes(tooth),
      );
      const removedTeeth = state.update.baselineTeeth.filter(
        (tooth) => !selectedTeeth.includes(tooth),
      );

      const summaryLines = [
        `Order **${updated.orderNumber}** updated successfully.`,
        `Services added: ${this.formatPatchList(addedServices, selectedServices)}`,
        `Services removed: ${this.formatPatchList(removedServices, selectedServices, true)}`,
        `Teeth added: ${addedTeeth.length > 0 ? addedTeeth.join(", ") : "None"}`,
        `Teeth removed: ${removedTeeth.length > 0 ? removedTeeth.join(", ") : "None"}`,
      ];

      this.appendMessageWithAction(summaryLines.join("\n"), updated.id);
      this.orderWorkflow.set(null);
    } catch (error) {
      this.orderWorkflow.set({
        ...state,
        loading: false,
        error:
          (error as { error?: { error?: { message?: string } } })?.error?.error
            ?.message ?? "Failed to update order. Please check your input and try again.",
      });
    }
  }

  private resolveCreatePatientStep(state: AiOrderWorkflowState, input: string): AiOrderWorkflowState {
    if (!state.create) return state;

    if (state.create.patient) {
      return {
        ...state,
        step: "doctor",
        input: "",
        error: null,
      };
    }

    const candidates = this.findPatients(input);
    if (candidates.length === 0) {
      return { ...state, error: "Patient not found. Please refine your input." };
    }
    if (candidates.length > 1) {
      return {
        ...state,
        error: "Multiple matching patients found. Please pick one.",
        create: { ...state.create, patientCandidates: candidates },
      };
    }

    const patient = candidates[0];
    const notice = state.create.selectedServiceIds.length > 0 || state.create.selectedTeeth.length > 0
      ? "Dependent selections were reset after patient change."
      : null;
    return {
      ...state,
      step: "doctor",
      input: patient.doctorName ?? "",
      error: null,
      notice,
      create: {
        ...state.create,
        patient,
        doctor: null,
        clinic: null,
        selectedServiceIds: [],
        selectedTeeth: [],
        patientCandidates: [],
        doctorCandidates: [],
        clinicCandidates: [],
      },
    };
  }

  private resolveCreateDoctorStep(state: AiOrderWorkflowState, input: string): AiOrderWorkflowState {
    if (!state.create) return state;
    if (state.create.doctor) {
      return {
        ...state,
        step: "clinic",
        input: state.create.doctor.clinicName ?? "",
        error: null,
      };
    }

    const candidates = this.findDoctors(input);
    if (candidates.length === 0) {
      return { ...state, error: "Doctor not found. Please refine your input." };
    }
    if (candidates.length > 1) {
      return {
        ...state,
        error: "Multiple matching doctors found. Please pick one.",
        create: { ...state.create, doctorCandidates: candidates },
      };
    }

    const doctor = candidates[0];
    const notice = state.create.selectedServiceIds.length > 0 || state.create.selectedTeeth.length > 0
      ? "Dependent selections were reset after doctor change."
      : null;
    return {
      ...state,
      step: "clinic",
      input: doctor.clinicName ?? "",
      error: null,
      notice,
      create: {
        ...state.create,
        doctor,
        clinic: null,
        selectedServiceIds: [],
        selectedTeeth: [],
        doctorCandidates: [],
        clinicCandidates: [],
      },
    };
  }

  private resolveCreateClinicStep(state: AiOrderWorkflowState, input: string): AiOrderWorkflowState {
    if (!state.create) return state;
    if (state.create.clinic) {
      return {
        ...state,
        step: "billTo",
        input: "",
        error: null,
      };
    }

    const candidates = this.findClinics(input);
    if (candidates.length === 0) {
      return { ...state, error: "Clinic not found. Please refine your input." };
    }
    if (candidates.length > 1) {
      return {
        ...state,
        error: "Multiple matching clinics found. Please pick one.",
        create: { ...state.create, clinicCandidates: candidates },
      };
    }

    const clinic = candidates[0];
    const notice = state.create.selectedServiceIds.length > 0 || state.create.selectedTeeth.length > 0
      ? "Dependent selections were reset after clinic change."
      : null;
    return {
      ...state,
      step: "billTo",
      input: "",
      error: null,
      notice,
      create: {
        ...state.create,
        clinic,
        selectedServiceIds: [],
        selectedTeeth: [],
        clinicCandidates: [],
      },
    };
  }

  private detectOrderWorkflowMode(prompt: string): AiOrderWorkflowMode | null {
    const normalized = normalizeLookup(prompt);
    if (
      /(create\s+order|new\s+order|make\s+order)/i.test(normalized) ||
      /(انشاء|إنشاء|اعمل)\s*.*(order|طلب)/i.test(prompt)
    ) {
      return "create";
    }
    if (
      /(update\s+order|edit\s+order|modify\s+order)/i.test(normalized) ||
      /(تعديل|حدث|ابديت)\s*.*(order|طلب)/i.test(prompt)
    ) {
      return "update";
    }
    return null;
  }

  private ensureReferenceDataLoaded(): void {
    if (this.patientDataService.patients().length === 0) {
      this.patientDataService.loadPatients();
    }
    if (this.doctorDataService.doctors().length === 0) {
      this.doctorDataService.loadDoctors();
    }
    if (this.clinicDataService.clinics().length === 0) {
      this.clinicDataService.loadClinics();
    }
    if (this.orderDataService.orders().length === 0) {
      this.orderDataService.loadOrders({ page: 1, pageSize: 100 });
    }
  }

  private findPatients(query: string): Patient[] {
    const needle = normalizeLookup(query);
    if (!needle) return [];
    return this.patientDataService
      .patients()
      .filter(
        (item) =>
          normalizeLookup(item.name).includes(needle) ||
          normalizeLookup(item.id).includes(needle),
      )
      .slice(0, 8);
  }

  private findDoctors(query: string): Doctor[] {
    const needle = normalizeLookup(query);
    if (!needle) return [];
    return this.doctorDataService
      .doctors()
      .filter(
        (item) =>
          normalizeLookup(item.name).includes(needle) ||
          normalizeLookup(item.id).includes(needle) ||
          normalizeLookup(item.lookupId ?? "").includes(needle),
      )
      .slice(0, 8);
  }

  private findClinics(query: string): Clinic[] {
    const needle = normalizeLookup(query);
    if (!needle) return [];
    return this.clinicDataService
      .clinics()
      .filter(
        (item) =>
          normalizeLookup(item.name).includes(needle) ||
          normalizeLookup(item.id).includes(needle),
      )
      .slice(0, 8);
  }

  private findOrderCandidates(query: string): Order[] {
    const needle = normalizeLookup(query);
    if (!needle) return [];
    const orders = this.orderDataService.orders();
    const byPatient = orders.filter((item) =>
      normalizeLookup(item.patientName).includes(needle),
    );
    if (byPatient.length > 0) {
      return byPatient;
    }
    return orders.filter(
      (item) =>
        normalizeLookup(item.id) === needle ||
        normalizeLookup(item.orderNumber) === needle ||
        normalizeLookup(item.orderNumber).includes(needle),
    );
  }

  private extractOrderServiceAndTeeth(order: Order): { services: string[]; teeth: number[] } {
    const rows = order.creationData?.services ?? [];
    const services = rows.map((row) => row.serviceId);
    const teethSet = new Set<number>();
    for (const row of rows) {
      for (const tooth of row.selectedTeeth) {
        teethSet.add(tooth);
      }
    }
    return {
      services,
      teeth: [...teethSet].sort((left, right) => left - right),
    };
  }

  private buildServiceRows(
    services: readonly CreateOrderService[],
    selectedTeeth: readonly number[],
    notes = "",
    priority: Order["priority"] = "Normal",
    dueDate = this.defaultDueDate(services),
  ): CreateSubOrderInput[] {
    return services.map((service) => ({
      serviceId: service.id,
      service: service.name,
      icon: service.icon,
      priority,
      dueDate,
      notes: notes || `${service.name} requested.`,
      teeth: [...selectedTeeth],
      scanRequirements: [...service.scanRequirements],
      creationData: {
        serviceId: service.id,
        serviceDetails: { ...defaultServiceDetail() },
        serviceForm: { ...defaultServiceClinicalForm(service.id) },
        selectedTeeth: [...selectedTeeth],
        scanRequirements: [...service.scanRequirements],
        fileReferences: [],
      },
    }));
  }

  private defaultDueDate(services: readonly CreateOrderService[]): string {
    const fallbackDays = 7;
    const turnaroundDays =
      services.length > 0
        ? Math.max(...services.map((service) => service.turnaroundDays))
        : fallbackDays;
    const date = new Date();
    date.setDate(date.getDate() + turnaroundDays);
    return date.toISOString().slice(0, 10);
  }

  private formatPatchList(
    ids: readonly string[],
    selectedServices: readonly CreateOrderService[],
    removed = false,
  ): string {
    if (ids.length === 0) {
      return "None";
    }
    const names = ids.map((id) => {
      const candidate = selectedServices.find((item) => item.id === id);
      if (candidate) return candidate.name;
      const fallback = AVAILABLE_SERVICES.find((item) => item.id === id);
      return fallback?.name ?? id;
    });
    return removed ? names.join(", ") : names.join(", ");
  }

  private appendMessageWithAction(text: string, orderId: string): void {
    const conversationId = this.activeConversationId();
    if (!conversationId) return;
    this.appendMessage(conversationId, {
      id: this.nextMessageId(),
      role: "assistant",
      text,
      createdAt: new Date().toISOString(),
      type: "text",
      markdown: true,
      canCopy: true,
      actions: [
        {
          id: `open-order-${orderId}`,
          title: "Open Order Details",
          description: "Go to the updated order details page",
          intent: "openOrderDetails",
          badge: "Order",
          orderId,
        },
      ],
    });
  }

  private onSessionChanged(userId: string | null): void {
    if (userId === this.currentUserId) {
      return;
    }

    this.currentUserId = userId;
    this.resetState();
    if (userId) {
      void this.bootstrap(this.sessionGeneration);
    }
  }

  private resetState(): void {
    this.sessionGeneration += 1;
    this.backendConversationByLocalId.clear();
    this.backendAllowedSuggestionIds = new Set<string>();
    this.messageSequence = 0;
    this.localConversationSequence = 0;
    this.conversations.set([]);
    this.activeConversationId.set(null);
    this.promptDraft.set({ search: "", prompt: "" });
    this.historyOpen.set(false);
    this.isResponding.set(false);
    this.orderWorkflow.set(null);
  }

  private async bootstrap(generation: number): Promise<void> {
    let summaries: AssistantConversationSummaryDto[] = [];
    try {
      const [suggestions, loaded] = await Promise.all([
        firstValueFrom(this.assistantDataService.getSuggestions$()),
        firstValueFrom(this.assistantDataService.listConversations$()),
      ]);
      if (generation !== this.sessionGeneration) {
        return;
      }
      this.backendAllowedSuggestionIds = new Set(
        suggestions.filter((item) => item.enabled).map((item) => item.id),
      );
      summaries = loaded;
    } catch {
      if (generation !== this.sessionGeneration) {
        return;
      }
    }

    this.seedConversationHistory(summaries);
  }

  private seedConversationHistory(summaries: AssistantConversationSummaryDto[]): void {
    const localId = this.nextLocalConversationId();
    const fresh = this.createConversationShell(localId, "New conversation");
    const history = summaries.map((summary) => {
      this.backendConversationByLocalId.set(summary.id, summary.id);
      return this.fromConversationSummary(summary);
    });
    this.conversations.set([fresh, ...history]);
    this.activeConversationId.set(localId);
  }

  private fromConversationSummary(summary: AssistantConversationSummaryDto): AiConversation {
    return {
      id: summary.id,
      title: summary.title,
      updatedAt: summary.updatedAt,
      showWelcomeActions: false,
      messages: [],
    };
  }

  private async loadConversationMessages(localConversationId: string): Promise<void> {
    const backendConversationId = this.backendConversationByLocalId.get(localConversationId);
    if (!backendConversationId) {
      return;
    }

    const generation = this.sessionGeneration;
    try {
      const conversation = await firstValueFrom(
        this.assistantDataService.getConversation$(backendConversationId),
      );
      if (generation !== this.sessionGeneration) {
        return;
      }
      this.updateConversation(localConversationId, () =>
        this.fromBackendConversation(conversation, localConversationId),
      );
    } catch {
      return;
    }
  }

  private fromBackendConversation(
    conversation: AssistantConversationViewDto,
    localId: string,
  ): AiConversation {
    return {
      id: localId,
      title: conversation.title,
      updatedAt: conversation.updatedAt,
      showWelcomeActions: conversation.messages.length <= 1,
      messages: conversation.messages.map((message) => ({
        id: message.id,
        role: message.role,
        text: message.text,
        createdAt: message.createdAt,
        type:
          message.resultType === "confirmation"
            ? "confirmation"
            : message.resultType === "error"
              ? "error"
              : "text",
        markdown: true,
        canCopy: message.role === "assistant",
      })),
    };
  }

  private async ensureBackendConversationId(localConversationId: string): Promise<string> {
    const existing = this.backendConversationByLocalId.get(localConversationId);
    if (existing) {
      return existing;
    }

    const title = this.activeConversation()?.title;
    const created = await firstValueFrom(
      this.assistantDataService.createConversation$(title),
    );
    this.backendConversationByLocalId.set(localConversationId, created.id);
    return created.id;
  }

  private async postMessageWithConversationRecovery(
    localConversationId: string,
    prompt: string,
  ): Promise<AssistantMessageResponseDto> {
    const backendConversationId = await this.ensureBackendConversationId(localConversationId);
    try {
      return await firstValueFrom(
        this.assistantDataService.postMessage$(backendConversationId, prompt),
      );
    } catch (error) {
      if (!this.isConversationNotFoundError(error)) {
        throw error;
      }

      this.backendConversationByLocalId.delete(localConversationId);
      const recreatedConversationId =
        await this.ensureBackendConversationId(localConversationId);
      return firstValueFrom(
        this.assistantDataService.postMessage$(recreatedConversationId, prompt),
      );
    }
  }

  private toAssistantMessage(response: AssistantMessageResponseDto): AiChatMessage {
    if (response.result.type === "confirmation") {
      const pendingActions = response.result.pendingActions;
      const actions: AiShortcutAction[] = pendingActions.map((item) => ({
        id: `confirm-${item.actionId}`,
        title: `Confirm ${item.tool}`,
        intent: "updateOrder",
        description: `Confirm pending action for ${item.tool}`,
        badge: "Confirm",
        confirmation: {
          actionId: item.actionId,
          confirmationToken: item.confirmationToken,
          tool: item.tool,
        },
      }));
      return {
        id: this.nextMessageId(),
        role: "assistant",
        text: response.result.text,
        createdAt: new Date().toISOString(),
        type: "confirmation",
        markdown: true,
        canCopy: true,
        actions,
      };
    }

    return {
      id: this.nextMessageId(),
      role: "assistant",
      text: response.result.text,
      createdAt: new Date().toISOString(),
      type: "text",
      markdown: true,
      canCopy: true,
    };
  }

  private async confirmPendingAction(
    actionId: string,
    confirmationToken: string,
  ): Promise<void> {
    const conversationId = this.activeConversationId();
    if (!conversationId || this.isResponding()) {
      return;
    }

    const generation = this.sessionGeneration;
    this.isResponding.set(true);
    try {
      const result = await firstValueFrom(
        this.assistantDataService.confirmAction$(actionId, confirmationToken),
      );
      if (generation !== this.sessionGeneration) {
        return;
      }
      this.appendConfirmationResultMessage(conversationId, result);
      this.touchConversation(conversationId);
      await this.loadConversationMessages(conversationId);
    } catch (error) {
      if (generation === this.sessionGeneration) {
        this.appendAssistantText(this.resolveAssistantErrorText(error), "error");
      }
    } finally {
      if (generation === this.sessionGeneration) {
        this.isResponding.set(false);
      }
    }
  }

  private appendConfirmationResultMessage(
    conversationId: string,
    result: AssistantConfirmActionResponseDto,
  ): void {
    this.appendMessage(conversationId, {
      id: this.nextMessageId(),
      role: "assistant",
      text: result.message,
      createdAt: new Date().toISOString(),
      type: "confirmation",
      markdown: true,
      canCopy: true,
    });
  }

  private resolveAssistantErrorText(error: unknown): string {
    const candidate = error as
      | {
          status?: number;
          error?: {
            error?: {
              message?: string;
            };
          };
        }
      | undefined;
    const message = candidate?.error?.error?.message?.toLowerCase() ?? "";
    if (candidate?.status === 403 || message.includes("permission denied")) {
      return "You don't have access for that action in this account.";
    }

    if (candidate?.status === 409 || message.includes("expired")) {
      return "This pending action is no longer valid. Please send a new request.";
    }

    if (this.isConversationNotFoundError(error)) {
      return "This conversation is no longer available. Please try sending your message again.";
    }

    return "Assistant service is currently unavailable. Please try again.";
  }

  private isConversationNotFoundError(error: unknown): boolean {
    const candidate = error as
      | {
          status?: number;
          error?: {
            error?: {
              message?: string;
            };
          };
        }
      | undefined;
    const message = candidate?.error?.error?.message?.toLowerCase() ?? "";
    return candidate?.status === 404 && message.includes("conversation was not found");
  }

  private isQuickActionVisible(action: AiQuickAction): boolean {
    if (action.requiredCapability) {
      const hasCapability = this.authorizationService.has(
        action.requiredCapability as DentalCapability,
      );
      if (!hasCapability) {
        return false;
      }
    }

    const suggestionDependency = quickActionSuggestionDependency(action.id);
    if (suggestionDependency && this.backendAllowedSuggestionIds.size > 0) {
      return this.backendAllowedSuggestionIds.has(suggestionDependency);
    }

    return true;
  }

  private createConversationShell(id: string, title: string): AiConversation {
    return {
      id,
      title,
      updatedAt: new Date().toISOString(),
      showWelcomeActions: true,
      messages: [
        {
          id: this.nextMessageId(),
          role: "assistant",
          text: AI_WELCOME_MESSAGE,
          createdAt: new Date().toISOString(),
          type: "text",
          markdown: true,
          canCopy: true,
        },
      ],
    };
  }

  private nextLocalConversationId(): string {
    this.localConversationSequence += 1;
    return `local-conv-${this.localConversationSequence}`;
  }

  private nextMessageId(): string {
    this.messageSequence += 1;
    return `msg-${this.messageSequence}`;
  }

  private setWelcomeActions(conversationId: string, showWelcomeActions: boolean): void {
    this.updateConversation(conversationId, (conversation) => ({
      ...conversation,
      showWelcomeActions,
    }));
  }

  private refreshConversationTitle(conversationId: string, prompt: string): void {
    this.updateConversation(conversationId, (conversation) => {
      if (conversation.title !== "New conversation") {
        return conversation;
      }
      return {
        ...conversation,
        title: prompt.slice(0, 42),
      };
    });
  }

  private touchConversation(conversationId: string): void {
    this.updateConversation(conversationId, (conversation) => ({
      ...conversation,
      updatedAt: new Date().toISOString(),
    }));
  }

  private appendMessage(conversationId: string, message: AiChatMessage): void {
    this.updateConversation(conversationId, (conversation) => ({
      ...conversation,
      updatedAt: message.createdAt,
      messages: [...conversation.messages, message],
    }));
  }

  private replaceMessage(
    conversationId: string,
    targetMessageId: string,
    replacement: AiChatMessage,
  ): void {
    this.updateConversation(conversationId, (conversation) => ({
      ...conversation,
      updatedAt: replacement.createdAt,
      messages: conversation.messages.map((message) =>
        message.id === targetMessageId ? replacement : message,
      ),
    }));
  }

  private updateConversation(
    conversationId: string,
    updater: (conversation: AiConversation) => AiConversation,
  ): void {
    this.conversations.update((state) =>
      state.map((conversation) =>
        conversation.id === conversationId ? updater(conversation) : conversation,
      ),
    );
  }

  private appendAssistantText(text: string, type: AiChatMessage["type"] = "text"): void {
    const conversationId = this.activeConversationId();
    if (!conversationId) {
      return;
    }
    this.appendMessage(conversationId, {
      id: this.nextMessageId(),
      role: "assistant",
      text,
      createdAt: new Date().toISOString(),
      type,
      markdown: true,
      canCopy: true,
    });
  }
}

function quickActionSuggestionDependency(actionId: string): string | undefined {
  switch (actionId) {
    case "ops-search-orders":
      return "assistant-search-orders";
    case "ops-create-order":
      return "assistant-create-order";
    case "ops-search-patients":
      return "assistant-search-patients";
    default:
      return undefined;
  }
}

function isShowQuickActionsCommand(prompt: string): boolean {
  const normalized = normalizeLookup(prompt);
  return (
    /show\s+(the\s+)?quick\s*actions?/i.test(normalized) ||
    (/quick\s*actions?/i.test(normalized) &&
      /show|display|reopen/i.test(normalized)) ||
    (/اظهار|إظهار|اظهر|أظهر/.test(prompt) &&
      /quick\s*action|اكشن|أكشن/.test(prompt))
  );
}

function toggleInList(current: readonly string[], value: string): string[] {
  return current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
}

function toggleNumberInList(current: readonly number[], value: number): number[] {
  return current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value].sort((left, right) => left - right);
}
