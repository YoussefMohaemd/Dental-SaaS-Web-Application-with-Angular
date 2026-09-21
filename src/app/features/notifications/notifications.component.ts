import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationDataService } from '@core/services/notification-data.service';
import { NavigationService } from '@core/services/navigation.service';
import { FormatUtils } from '@core/services/format-utils.service';
import { Notification, NotificationType } from '@core/models';
import { ButtonComponent } from '@shared/components/button/button.component';

type NotificationFilter = 'all' | 'unread';

const TYPE_ICONS: Record<NotificationType, string> = {
  order: '📦',
  workflow: '🌿',
  file: '📄',
  billing: '🧾',
  request: '⚠️',
  system: '⚙️'
};

const TYPE_STYLES: Record<NotificationType, string> = {
  order: 'bg-blue-50 text-blue-700',
  workflow: 'bg-cyan-50 text-cyan-700',
  file: 'bg-emerald-50 text-emerald-700',
  billing: 'bg-amber-50 text-amber-700',
  request: 'bg-violet-50 text-violet-700',
  system: 'bg-slate-100 text-slate-600'
};

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss'
})
export class NotificationsComponent {
  private readonly notificationService = inject(NotificationDataService);
  protected readonly navigationService = inject(NavigationService);
  protected readonly formatUtils = inject(FormatUtils);

  readonly notifications = this.notificationService.notifications;
  readonly filter = signal<NotificationFilter>('all');

  readonly unreadCount = computed(() => this.notifications().filter(n => !n.read).length);

  readonly visible = computed(() => {
    if (this.filter() === 'unread') return this.notifications().filter(n => !n.read);
    return this.notifications();
  });

  setFilter(next: NotificationFilter): void {
    this.filter.set(next);
  }

  markRead(notification: Notification): void {
    this.notificationService.markAsRead(notification.id);
  }

  markAllRead(): void {
    this.notificationService.markAllAsRead();
  }

  openRelated(notification: Notification): void {
    if (notification.relatedType === 'order' && notification.relatedId) {
      this.navigationService.navigate('viewOrder', { orderId: notification.relatedId });
    }
  }

  typeIcon(notificationType: NotificationType): string {
    return TYPE_ICONS[notificationType] ?? '🔔';
  }

  typeClasses(notificationType: NotificationType): string {
    return TYPE_STYLES[notificationType] ?? TYPE_STYLES.system;
  }
}
