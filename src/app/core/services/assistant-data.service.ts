import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { ApiEndpoint } from "@core/enum/api.endpoint";
import { map, Observable } from "rxjs";

interface ApiEnvelope<TData> {
  data: TData;
}

export interface AssistantSuggestionDto {
  id: string;
  title: string;
  description: string;
  category: "orders" | "reports" | "patients" | "dashboard" | "cases";
  template: string;
  requiredCapabilities: string[];
  resultType: string;
  enabled: boolean;
}

export interface AssistantCapabilitiesDto {
  createEnabled?: boolean;
}

export interface AssistantSuggestionsResponseDto {
  suggestions: AssistantSuggestionDto[];
  capabilities?: AssistantCapabilitiesDto;
}

export interface AssistantConversationSummaryDto {
  id: string;
  title: string;
  status: "active" | "pending_confirmation";
  createdAt: string;
  updatedAt: string;
  preview: string;
}

export interface AssistantConversationViewDto {
  id: string;
  title: string;
  status: "active" | "pending_confirmation";
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    text: string;
    resultType: string;
    createdAt: string;
    metadata?: Record<string, unknown>;
  }>;
}

export interface AssistantMessageResponseDto {
  conversationId: string;
  messageId: string;
  result:
    | {
        type: "text";
        text: string;
        plannedActions: number;
        executions: Array<{
          actionId: string;
          tool: string;
          status: "executed";
          result?: unknown;
        }>;
      }
    | {
        type: "confirmation";
        text: string;
        executions?: Array<{
          actionId: string;
          tool: string;
          status: "executed" | "failed";
          result?: unknown;
          error?: string;
        }>;
        pendingActions: Array<{
          actionId: string;
          tool: string;
          expiresAt: string;
          confirmationToken: string;
          payload?: Record<string, unknown>;
        }>;
      };
}

export interface AssistantConfirmActionResponseDto {
  actionId: string;
  conversationId: string;
  status: "confirmed" | "failed";
  message: string;
}

export interface AssistantAdminConversationSummaryDto {
  id: string;
  ownerUserId: string;
  ownerName: string;
  ownerRoles: string[];
  title: string;
  status: "active" | "pending_confirmation";
  createdAt: string;
  updatedAt: string;
  preview: string;
}

export interface AssistantAdminConversationsResponseDto {
  items: AssistantAdminConversationSummaryDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AssistantAdminConversationDetailsDto {
  conversation: AssistantConversationViewDto & { ownerUserId: string };
  llmCalls: Array<{
    callId: string;
    messageId: string;
    provider: string;
    model: string;
    promptVersion: string;
    languageHint: "ar" | "en" | "mixed";
    latencyMs: number;
    createdAt: string;
    plan: Array<{ tool: string; arguments: Record<string, unknown> }>;
    toolResults: Array<{ tool: string; status: string; summary: string }>;
    error?: { code: string; message: string };
  }>;
}

export interface AssistantAdminReviewRequestDto {
  conversationId: string;
  messageId: string;
  verdict: "correct" | "incorrect";
  reason?: string;
  correctedReply?: string;
  approvedQuestion?: string;
}

export interface AssistantAdminReviewResponseDto {
  reviewId: string;
  verdict: "correct" | "incorrect";
  reason?: string;
  correctedReply?: string;
  createdAt: string;
}

export interface AssistantCompanyProfileDto {
  name: string;
  about: string;
  email: string;
  phone: string;
  address: string;
  workingHours: string;
  submissionStandards: string[];
}

export interface AssistantCatalogServiceDto {
  serviceId: string;
  name: string;
  description: string;
  basePrice: number;
  turnaroundDays: number;
  scanRequirements: string[];
  isActive?: boolean;
  sortOrder?: number;
}

export interface AssistantTranscriptionResponseDto {
  text: string;
  provider: string;
  ambiguities?: Array<{
    kind: "doctor" | "clinic" | "service" | "patient";
    candidates: Array<{
      id: string;
      label: string;
    }>;
  }>;
}

export type AssistantVoiceLanguageHint = "ar" | "en";

@Injectable({ providedIn: "root" })
export class AssistantDataService {
  private readonly http = inject(HttpClient);

  getSuggestions$(): Observable<AssistantSuggestionsResponseDto> {
    return this.http
      .get<ApiEnvelope<AssistantSuggestionsResponseDto>>(
        ApiEndpoint.AI_SUGGESTIONS,
      )
      .pipe(map((response) => response.data));
  }

  listConversations$(
    limit = 25,
  ): Observable<AssistantConversationSummaryDto[]> {
    return this.http
      .get<ApiEnvelope<AssistantConversationSummaryDto[]>>(
        ApiEndpoint.AI_CONVERSATIONS,
        {
          params: {
            limit,
          },
        },
      )
      .pipe(map((response) => response.data));
  }

  createConversation$(
    title?: string,
  ): Observable<AssistantConversationViewDto> {
    return this.http
      .post<ApiEnvelope<AssistantConversationViewDto>>(
        ApiEndpoint.AI_CONVERSATIONS,
        title?.trim() ? { title: title.trim() } : {},
      )
      .pipe(map((response) => response.data));
  }

  postMessage$(
    conversationId: string,
    content: string,
    languageHint: AssistantVoiceLanguageHint = "ar",
  ): Observable<AssistantMessageResponseDto> {
    return this.http
      .post<ApiEnvelope<AssistantMessageResponseDto>>(
        ApiEndpoint.aiConversationMessages(conversationId),
        { content, languageHint },
      )
      .pipe(map((response) => response.data));
  }

  getConversation$(
    conversationId: string,
  ): Observable<AssistantConversationViewDto> {
    return this.http
      .get<ApiEnvelope<AssistantConversationViewDto>>(
        ApiEndpoint.aiConversation(conversationId),
      )
      .pipe(map((response) => response.data));
  }

  confirmAction$(
    actionId: string,
    confirmationToken: string,
  ): Observable<AssistantConfirmActionResponseDto> {
    return this.http
      .post<ApiEnvelope<AssistantConfirmActionResponseDto>>(
        ApiEndpoint.aiConfirmAction(actionId),
        {
          confirmationToken,
        },
      )
      .pipe(map((response) => response.data));
  }

  transcribe$(
    audio: Blob,
    languageHint: AssistantVoiceLanguageHint = "ar",
  ): Observable<AssistantTranscriptionResponseDto> {
    return this.http
      .post<ApiEnvelope<AssistantTranscriptionResponseDto>>(
        ApiEndpoint.AI_TRANSCRIBE,
        audio,
        {
          params: {
            language: languageHint,
          },
          headers: {
            "Content-Type": audio.type || "audio/webm",
            "X-Language-Hint": languageHint,
          },
        },
      )
      .pipe(map((response) => response.data));
  }

  listAdminConversations$(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    userId?: string;
    userSearch?: string;
    status?: "active" | "pending_confirmation";
  }): Observable<AssistantAdminConversationsResponseDto> {
    return this.http
      .get<ApiEnvelope<AssistantAdminConversationsResponseDto>>(
        ApiEndpoint.AI_ADMIN_CONVERSATIONS,
        {
          params: {
            ...(params?.page ? { page: params.page } : {}),
            ...(params?.pageSize ? { pageSize: params.pageSize } : {}),
            ...(params?.search ? { search: params.search } : {}),
            ...(params?.userId ? { userId: params.userId } : {}),
            ...(params?.userSearch ? { userSearch: params.userSearch } : {}),
            ...(params?.status ? { status: params.status } : {}),
          },
        },
      )
      .pipe(map((response) => response.data));
  }

  getAdminConversation$(conversationId: string): Observable<AssistantAdminConversationDetailsDto> {
    return this.http
      .get<ApiEnvelope<AssistantAdminConversationDetailsDto>>(
        ApiEndpoint.aiAdminConversation(conversationId),
      )
      .pipe(map((response) => response.data));
  }

  createAdminReview$(
    payload: AssistantAdminReviewRequestDto,
  ): Observable<AssistantAdminReviewResponseDto> {
    return this.http
      .post<ApiEnvelope<AssistantAdminReviewResponseDto>>(
        ApiEndpoint.AI_ADMIN_REVIEWS,
        payload,
      )
      .pipe(map((response) => response.data));
  }

  getAdminCompanyProfile$(): Observable<AssistantCompanyProfileDto | null> {
    return this.http
      .get<ApiEnvelope<AssistantCompanyProfileDto | null>>(
        ApiEndpoint.AI_ADMIN_CATALOG_COMPANY_PROFILE,
      )
      .pipe(map((response) => response.data));
  }

  updateAdminCompanyProfile$(
    payload: AssistantCompanyProfileDto,
  ): Observable<{ success: boolean }> {
    return this.http
      .put<ApiEnvelope<{ success: boolean }>>(
        ApiEndpoint.AI_ADMIN_CATALOG_COMPANY_PROFILE,
        payload,
      )
      .pipe(map((response) => response.data));
  }

  listAdminCatalogServices$(
    includeInactive = true,
  ): Observable<AssistantCatalogServiceDto[]> {
    return this.http
      .get<ApiEnvelope<AssistantCatalogServiceDto[]>>(
        ApiEndpoint.AI_ADMIN_CATALOG_SERVICES,
        {
          params: { includeInactive },
        },
      )
      .pipe(map((response) => response.data));
  }

  upsertAdminCatalogService$(
    payload: AssistantCatalogServiceDto,
  ): Observable<{ success: boolean }> {
    return this.http
      .post<ApiEnvelope<{ success: boolean }>>(
        ApiEndpoint.AI_ADMIN_CATALOG_SERVICES,
        payload,
      )
      .pipe(map((response) => response.data));
  }

  deactivateAdminCatalogService$(serviceId: string): Observable<{ success: boolean }> {
    return this.http
      .delete<ApiEnvelope<{ success: boolean }>>(
        ApiEndpoint.aiAdminCatalogService(serviceId),
      )
      .pipe(map((response) => response.data));
  }
}
