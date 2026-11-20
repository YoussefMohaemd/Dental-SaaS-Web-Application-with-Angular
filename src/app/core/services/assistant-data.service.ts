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

export interface AssistantTranscriptionResponseDto {
  text: string;
  provider: string;
}

export type AssistantVoiceLanguageHint = "ar" | "en" | "mixed";

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
  ): Observable<AssistantMessageResponseDto> {
    return this.http
      .post<ApiEnvelope<AssistantMessageResponseDto>>(
        ApiEndpoint.aiConversationMessages(conversationId),
        { content },
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
    languageHint?: AssistantVoiceLanguageHint,
  ): Observable<AssistantTranscriptionResponseDto> {
    return this.http
      .post<ApiEnvelope<AssistantTranscriptionResponseDto>>(
        ApiEndpoint.AI_TRANSCRIBE,
        audio,
        {
          headers: {
            "Content-Type": audio.type || "audio/webm",
            ...(languageHint
              ? { "X-Language-Hint": languageHint }
              : {}),
          },
        },
      )
      .pipe(map((response) => response.data));
  }
}
