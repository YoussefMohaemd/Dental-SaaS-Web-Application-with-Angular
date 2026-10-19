import { Observable } from "rxjs";
import { Notification } from "@core/models";

export abstract class NotificationApi {
  abstract getAllNotifications(): Observable<Notification[]>;
}

