export type ApiNotificationResponse = ApiNotificationItem[];

export interface ApiNotificationItem {
  id: string;
  type: "order" | "workflow" | "file" | "billing" | "system" | "request";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  relatedId?: string;
  relatedType?: string;
}
