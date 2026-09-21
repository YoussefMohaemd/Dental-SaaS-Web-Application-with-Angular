export type NotificationType = 'order' | 'workflow' | 'file' | 'billing' | 'system' | 'request';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  relatedId?: string;
  relatedType?: string;
}

export interface NotificationFilters {
  typeFilter?: NotificationType;
  readFilter?: boolean;
  page?: number;
  pageSize?: number;
}