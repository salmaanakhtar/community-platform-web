import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Notification } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-item.component.html',
  styleUrl: './notification-item.component.css'
})
export class NotificationItemComponent {
  @Input() notification!: Notification;
  @Output() notificationClicked = new EventEmitter<Notification>();
  @Output() deleteClicked = new EventEmitter<string>();

  onClick() {
    this.notificationClicked.emit(this.notification);
  }

  onDelete(event: Event) {
    event.stopPropagation();
    this.deleteClicked.emit(this.notification._id);
  }

  getNotificationTypeIcon(): string {
    switch (this.notification.type) {
      case 'like': return '❤️';
      case 'comment': return '💬';
      case 'follow': return '👤';
      case 'message': return '✉️';
      default: return '🔔';
    }
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }
}
