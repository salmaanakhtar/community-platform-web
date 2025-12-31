import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { isPlatformBrowser } from '@angular/common';

export interface Notification {
  _id: string;
  type: 'like' | 'comment' | 'follow' | 'message';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedUser?: {
    _id: string;
    username: string;
  };
  relatedPost?: {
    _id: string;
    content: string;
  };
  relatedMessage?: {
    _id: string;
    content: string;
  };
  actionUrl?: string; // Safe navigation URL
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  // Get notifications with pagination
  getNotifications(page: number = 1, limit: number = 20): Observable<Notification[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<Notification[]>(`${environment.apiUrl}/notifications`, { params });
  }

  // Mark notification as read
  markAsRead(notificationId: string): Observable<any> {
    return this.http.put(`${environment.apiUrl}/notifications/${notificationId}/read`, {});
  }

  // Mark all notifications as read
  markAllAsRead(): Observable<any> {
    return this.http.put(`${environment.apiUrl}/notifications/read-all`, {});
  }

  // Delete notification
  deleteNotification(notificationId: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/notifications/${notificationId}`);
  }

  // Get unread count
  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${environment.apiUrl}/notifications/unread-count`);
  }

  // Update local notifications (called by socket service)
  updateNotifications(notifications: Notification[]): void {
    this.notificationsSubject.next(notifications);
    this.updateUnreadCount(notifications);
  }

  // Add new notification (called by socket service)
  addNotification(notification: Notification): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = [notification, ...currentNotifications];
    this.notificationsSubject.next(updatedNotifications);
    this.updateUnreadCount(updatedNotifications);
  }

  private updateUnreadCount(notifications: Notification[]): void {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    this.unreadCountSubject.next(unreadCount);
  }

  // Refresh notifications from server
  refreshNotifications(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.getNotifications().subscribe({
        next: (notifications) => {
          this.updateNotifications(notifications);
        },
        error: (err) => {
          console.error('Failed to refresh notifications:', err);
        }
      });
    }
  }
}
