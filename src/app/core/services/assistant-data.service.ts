import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { ApiEndpoint } from "@core/enum/api.endpoint";
import { map, Observable } from "rxjs";

interface ApiEnvelope<TData> {
  data: TData;
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
        }>;
      };
}

@Injectable({ providedIn: "root" })
export class AssistantDataService {
  private readonly http = inject(HttpClient);

  createConversation$(title?: string): Observable<AssistantConversationViewDto> {
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
}

