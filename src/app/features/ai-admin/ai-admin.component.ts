import { CommonModule } from "@angular/common";
import { Component, OnInit, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  AssistantAdminConversationDetailsDto,
  AssistantAdminConversationSummaryDto,
  AssistantCatalogServiceDto,
  AssistantCompanyProfileDto,
  AssistantDataService,
} from "@core/services/assistant-data.service";
import { firstValueFrom } from "rxjs";

@Component({
  selector: "app-ai-admin",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./ai-admin.component.html",
  styleUrl: "./ai-admin.component.scss",
})
export class AiAdminComponent implements OnInit {
  private readonly assistantDataService = inject(AssistantDataService);

  searchTerm = "";
  userSearchTerm = "";
  readonly page = signal(1);
  readonly pageSize = 30;
  readonly totalConversations = signal(0);
  readonly loading = signal(false);
  readonly savingCatalog = signal(false);
  readonly conversationItems = signal<AssistantAdminConversationSummaryDto[]>([]);
  readonly selectedConversation = signal<AssistantAdminConversationDetailsDto | null>(
    null,
  );
  readonly services = signal<AssistantCatalogServiceDto[]>([]);
  companyProfileForm: AssistantCompanyProfileDto = {
    name: "",
    about: "",
    email: "",
    phone: "",
    address: "",
    workingHours: "",
    submissionStandards: [],
  };
  reviewForm = {
    messageId: "",
    verdict: "correct" as "correct" | "incorrect",
    reason: "",
    correctedReply: "",
    approvedQuestion: "",
  };

  readonly selectedMessages = computed(
    () => this.selectedConversation()?.conversation.messages ?? [],
  );
  readonly selectedLlmCalls = computed(
    () => this.selectedConversation()?.llmCalls ?? [],
  );
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalConversations() / this.pageSize)),
  );
  readonly canGoPrev = computed(() => this.page() > 1);
  readonly canGoNext = computed(() => this.page() < this.totalPages());
  readonly selectedServiceId = signal<string | null>(null);
  readonly selectedService = computed<AssistantCatalogServiceDto | null>(() => {
    const items = this.services();
    if (items.length === 0) {
      return null;
    }
    const selectedId = this.selectedServiceId();
    if (!selectedId) {
      return items[0];
    }
    return items.find((item) => item.serviceId === selectedId) ?? items[0];
  });
  readonly newServiceDraft = signal<AssistantCatalogServiceDto>({
    serviceId: "",
    name: "",
    description: "",
    basePrice: 0,
    turnaroundDays: 0,
    scanRequirements: [],
    isActive: true,
    sortOrder: 0,
  });
  readonly isCreateServiceModalOpen = signal(false);
  readonly isEditServiceModalOpen = signal(false);
  readonly editServiceDraft = signal<AssistantCatalogServiceDto | null>(null);

  async ngOnInit(): Promise<void> {
    await this.refreshAll();
  }

  async refreshAll(): Promise<void> {
    this.loading.set(true);
    try {
      const [conversations, services, profile] = await Promise.all([
        firstValueFrom(
          this.assistantDataService.listAdminConversations$({
            page: this.page(),
            pageSize: this.pageSize,
            ...(this.searchTerm.trim() ? { search: this.searchTerm.trim() } : {}),
            ...(this.userSearchTerm.trim()
              ? { userSearch: this.userSearchTerm.trim() }
              : {}),
          }),
        ),
        firstValueFrom(this.assistantDataService.listAdminCatalogServices$(true)),
        firstValueFrom(this.assistantDataService.getAdminCompanyProfile$()),
      ]);
      this.conversationItems.set(conversations.items);
      this.totalConversations.set(conversations.total);
      this.services.set(services);
      if (profile) {
        this.companyProfileForm = {
          ...profile,
          submissionStandards: [...profile.submissionStandards],
        };
      }
    } finally {
      this.loading.set(false);
    }
  }

  async applyFilters(): Promise<void> {
    this.page.set(1);
    await this.refreshAll();
  }

  async goToPrevPage(): Promise<void> {
    if (!this.canGoPrev()) {
      return;
    }
    this.page.update((value) => value - 1);
    await this.refreshAll();
  }

  async goToNextPage(): Promise<void> {
    if (!this.canGoNext()) {
      return;
    }
    this.page.update((value) => value + 1);
    await this.refreshAll();
  }

  async selectConversation(conversationId: string): Promise<void> {
    this.loading.set(true);
    try {
      const details = await firstValueFrom(
        this.assistantDataService.getAdminConversation$(conversationId),
      );
      this.selectedConversation.set(details);
      this.reviewForm = {
        ...this.reviewForm,
        messageId: "",
        reason: "",
        correctedReply: "",
        approvedQuestion: "",
      };
    } finally {
      this.loading.set(false);
    }
  }

  async submitReview(): Promise<void> {
    const details = this.selectedConversation();
    if (!details) {
      return;
    }
    const form = this.reviewForm;
    if (!form.messageId.trim()) {
      return;
    }
    await firstValueFrom(
      this.assistantDataService.createAdminReview$({
        conversationId: details.conversation.id,
        messageId: form.messageId.trim(),
        verdict: form.verdict,
        ...(form.reason.trim() ? { reason: form.reason.trim() } : {}),
        ...(form.correctedReply.trim()
          ? { correctedReply: form.correctedReply.trim() }
          : {}),
        ...(form.approvedQuestion.trim()
          ? { approvedQuestion: form.approvedQuestion.trim() }
          : {}),
      }),
    );
    this.reviewForm = {
      ...this.reviewForm,
      reason: "",
      correctedReply: "",
      approvedQuestion: "",
    };
  }

  updateSubmissionStandards(raw: string): void {
    const items = raw
      .split("\n")
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
    this.companyProfileForm = {
      ...this.companyProfileForm,
      submissionStandards: items,
    };
  }

  async saveCompanyProfile(): Promise<void> {
    this.savingCatalog.set(true);
    try {
      await firstValueFrom(
        this.assistantDataService.updateAdminCompanyProfile$(this.companyProfileForm),
      );
    } finally {
      this.savingCatalog.set(false);
    }
  }

  async toggleServiceActive(service: AssistantCatalogServiceDto): Promise<void> {
    if (service.isActive === false) {
      await firstValueFrom(
        this.assistantDataService.upsertAdminCatalogService$({
          ...service,
          isActive: true,
        }),
      );
    } else {
      await firstValueFrom(
        this.assistantDataService.deactivateAdminCatalogService$(service.serviceId),
      );
    }
    await this.refreshAll();
  }

  updateServiceField(
    serviceId: string,
    field: keyof AssistantCatalogServiceDto,
    value: string | number | boolean,
  ): void {
    this.services.update((items) =>
      items.map((item) => {
        if (item.serviceId !== serviceId) {
          return item;
        }
        if (field === "basePrice" || field === "turnaroundDays" || field === "sortOrder") {
          const numeric = Number(value);
          return {
            ...item,
            [field]: Number.isFinite(numeric) ? numeric : 0,
          };
        }
        if (field === "isActive") {
          return { ...item, isActive: Boolean(value) };
        }
        return { ...item, [field]: String(value) };
      }),
    );
  }

  updateServiceScanRequirements(serviceId: string, raw: string): void {
    const values = raw
      .split("\n")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    this.services.update((items) =>
      items.map((item) =>
        item.serviceId === serviceId ? { ...item, scanRequirements: values } : item,
      ),
    );
  }

  async saveService(service: AssistantCatalogServiceDto): Promise<void> {
    await firstValueFrom(this.assistantDataService.upsertAdminCatalogService$(service));
    await this.refreshAll();
  }

  selectService(serviceId: string): void {
    this.selectedServiceId.set(serviceId);
  }

  newServiceRequirementsText(): string {
    return this.newServiceDraft().scanRequirements.join("\n");
  }

  updateNewServiceField(
    field: keyof AssistantCatalogServiceDto,
    value: string | number | boolean,
  ): void {
    this.newServiceDraft.update((current) => {
      if (field === "basePrice" || field === "turnaroundDays" || field === "sortOrder") {
        const numeric = Number(value);
        return { ...current, [field]: Number.isFinite(numeric) ? numeric : 0 };
      }
      if (field === "isActive") {
        return { ...current, isActive: Boolean(value) };
      }
      return { ...current, [field]: String(value) };
    });
  }

  updateNewServiceRequirements(raw: string): void {
    const requirements = raw
      .split("\n")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    this.newServiceDraft.update((current) => ({
      ...current,
      scanRequirements: requirements,
    }));
  }

  openCreateServiceModal(): void {
    this.isCreateServiceModalOpen.set(true);
  }

  closeCreateServiceModal(): void {
    this.isCreateServiceModalOpen.set(false);
  }

  openEditServiceModal(service: AssistantCatalogServiceDto): void {
    this.selectService(service.serviceId);
    this.editServiceDraft.set({
      ...service,
      scanRequirements: [...service.scanRequirements],
    });
    this.isEditServiceModalOpen.set(true);
  }

  closeEditServiceModal(): void {
    this.isEditServiceModalOpen.set(false);
    this.editServiceDraft.set(null);
  }

  updateEditServiceField(
    field: keyof AssistantCatalogServiceDto,
    value: string | number | boolean,
  ): void {
    this.editServiceDraft.update((current) => {
      if (!current) {
        return current;
      }
      if (field === "basePrice" || field === "turnaroundDays" || field === "sortOrder") {
        const numeric = Number(value);
        return { ...current, [field]: Number.isFinite(numeric) ? numeric : 0 };
      }
      if (field === "isActive") {
        return { ...current, isActive: Boolean(value) };
      }
      return { ...current, [field]: String(value) };
    });
  }

  updateEditServiceRequirements(raw: string): void {
    const requirements = raw
      .split("\n")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    this.editServiceDraft.update((current) =>
      current
        ? {
            ...current,
            scanRequirements: requirements,
          }
        : current,
    );
  }

  async saveEditedService(): Promise<void> {
    const draft = this.editServiceDraft();
    if (!draft) {
      return;
    }
    await firstValueFrom(this.assistantDataService.upsertAdminCatalogService$(draft));
    this.closeEditServiceModal();
    await this.refreshAll();
  }

  async createService(): Promise<void> {
    const draft = this.newServiceDraft();
    if (!draft.serviceId.trim() || !draft.name.trim()) {
      return;
    }
    await firstValueFrom(
      this.assistantDataService.upsertAdminCatalogService$({
        ...draft,
        serviceId: draft.serviceId.trim(),
        name: draft.name.trim(),
      }),
    );
    this.newServiceDraft.set({
      serviceId: "",
      name: "",
      description: "",
      basePrice: 0,
      turnaroundDays: 0,
      scanRequirements: [],
      isActive: true,
      sortOrder: 0,
    });
    this.closeCreateServiceModal();
    await this.refreshAll();
  }

  standardsText(): string {
    return this.companyProfileForm.submissionStandards.join("\n");
  }

  isSelectedConversation(id: string): boolean {
    return this.selectedConversation()?.conversation.id === id;
  }

  setReviewMessageId(messageId: string): void {
    this.reviewForm.messageId = messageId;
  }

  formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }

  messageRoleLabel(role: "user" | "assistant"): string {
    return role === "assistant" ? "Assistant" : "User";
  }

  isSelectedService(serviceId: string): boolean {
    return this.selectedService()?.serviceId === serviceId;
  }
}
