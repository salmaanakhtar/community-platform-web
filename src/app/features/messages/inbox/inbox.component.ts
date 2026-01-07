import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MessageService, Conversation } from '../../../core/services/message.service';

@Component({
  selector: 'app-inbox',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inbox.component.html',
  styleUrl: './inbox.component.css'
})
export class InboxComponent implements OnInit, OnDestroy {
  conversations: Conversation[] = [];
  loading: boolean = true;
  private subscription: Subscription = new Subscription();

  constructor(
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadConversations();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadConversations() {
    this.loading = true;
    this.subscription.add(
      this.messageService.getConversations().subscribe({
        next: (conversations) => {
          this.conversations = conversations;
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load conversations:', err);
          this.loading = false;
        }
      })
    );

    // Also subscribe to real-time updates
    this.subscription.add(
      this.messageService.conversations$.subscribe(conversations => {
        this.conversations = conversations;
      })
    );
  }

  openConversation(conversation: Conversation) {
    // Clear query params and navigate to conversation
    this.router.navigate(['/messages', conversation._id]);
  }

  getCurrentUserId(): string {
    // This should come from auth service, but for now return empty
    // TODO: Inject AuthService and get current user ID
    return '';
  }

  getOtherParticipant(conversation: Conversation): { _id: string; username: string } | null {
    const currentUserId = this.getCurrentUserId();
    return conversation.participants.find(p => p._id !== currentUserId) || null;
  }

  formatLastMessageTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }
}
