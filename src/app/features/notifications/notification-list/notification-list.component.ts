import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService, Notification } from '../../../core/services/notification.service';
import { NotificationItemComponent } from '../notification-item/notification-item.component';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule, NotificationItemComponent],
  templateUrl: './notification-list.component.html',
  styleUrl: './notification-list.component.css'
})
export class NotificationListComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  loading: boolean = true;
  currentPage: number = 1;
  private subscription: Subscription = new Subscription();

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.loadNotifications();
    this.subscription.add(
      this.notificationService.notifications$.subscribe(notifications => {
        this.notifications = notifications;
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  loadNotifications() {
    this.loading = true;
    this.subscription.add(
      this.notificationService.getNotifications(this.currentPage).subscribe({
        next: (notifications) => {
          if (this.currentPage === 1) {
            this.notifications = notifications;
          } else {
            this.notifications = [...this.notifications, ...notifications];
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load notifications:', err);
          this.toastr.error('Failed to load notifications');
          this.loading = false;
        }
      })
    );
  }

  loadMore() {
    this.currentPage++;
    this.loadNotifications();
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => n.isRead = true);
        this.toastr.success('All notifications marked as read');
      },
      error: (err) => {
        this.toastr.error('Failed to mark notifications as read');
      }
    });
  }

  onNotificationClick(notification: Notification) {
    // Mark as read if not already
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification._id).subscribe({
        next: () => {
          notification.isRead = true;
        }
      });
    }

    // Navigate safely
    if (notification.actionUrl) {
      this.router.navigateByUrl(notification.actionUrl).catch(() => {
        // Handle 404 or invalid URL
        this.toastr.warning('This notification links to content that no longer exists');
      });
    }
  }

  deleteNotification(notificationId: string) {
    this.notificationService.deleteNotification(notificationId).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n._id !== notificationId);
        this.toastr.success('Notification deleted');
      },
      error: (err) => {
        this.toastr.error('Failed to delete notification');
      }
    });
  }
}
