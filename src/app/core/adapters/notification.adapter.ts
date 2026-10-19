import { Injectable } from "@angular/core";
import { Notification } from "@core/models";
import {
  ApiNotificationItem,
  ApiNotificationResponse,
} from "@core/interface/notification.interface";

@Injectable({ providedIn: "root" })
export class NotificationAdapter {
  NotificationAdapter(response: ApiNotificationResponse): Notification[] {
    return response.map((item: ApiNotificationItem) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      message: item.message,
      read: item.read,
      createdAt: item.createdAt,
      relatedId: item.relatedId,
      relatedType: item.relatedType,
    }));
  }
}
