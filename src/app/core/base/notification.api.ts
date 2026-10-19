import { Observable } from "rxjs";
import { Notification } from "@core/interfaces";

export abstract class NotificationApi {
  abstract getAllNotifications(): Observable<Notification[]>;
}

