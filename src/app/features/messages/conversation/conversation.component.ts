import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MessageService, Message, MessagingPermissions } from '../../../core/services/message.service';
import { ProfileService } from '../../../core/services/profile.service';
import { AuthService } from '../../../core/services/auth.service';
import { MessageInputComponent } from '../message-input/message-input.component';

@Component({
  selector: 'app-conversation',
  standalone: true,
  imports: [CommonModule, MessageInputComponent],
  templateUrl: './conversation.component.html',
  styleUrl: './conversation.component.css'
})
export class ConversationComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  conversationId: string = '';
  messages: Message[] = [];
  otherParticipant: { _id: string; username: string } | null = null;
  canMessage: boolean = true;
  blockReason: string = '';
  loading: boolean = true;
  private subscription: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService,
    private profileService: ProfileService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    if (this.router.url.includes('/messages/new')) {
      this.conversationId = 'new';
      this.handleNewConversation();
      this.checkMessagingPermissions();
    } else {
      this.conversationId = this.route.snapshot.paramMap.get('id') || '';
      if (this.conversationId) {
        this.loadConversation();
        this.checkMessagingPermissions();
      }
    }

    // Listen for real-time message updates
    this.setupSocketListeners();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private setupSocketListeners(): void {
    // Listen for new messages in this conversation
    this.subscription.add(
      this.messageService.conversations$.subscribe(() => {
        // Refresh conversation if needed
      })
    );

    // Listen for real-time message updates
    this.subscription.add(
      this.messageService.newMessage$.subscribe((message) => {
        if (message && message.conversationId === this.conversationId) {
          // Add the message to the current conversation
          this.messages.push(message);
          this.scrollToBottom();
        }
      })
    );
  }

  handleNewConversation() {
    const userId = this.route.snapshot.queryParams['user'];
    if (userId) {
      // Fetch user profile for username
      this.profileService.getProfile(userId).subscribe({
        next: (profile) => {
          this.otherParticipant = { _id: profile._id, username: profile.username };
        },
        error: () => {
          this.otherParticipant = { _id: userId, username: 'Unknown User' };
        }
      });

      this.messageService.checkMessagingPermissions(userId).subscribe({
        next: (permissions) => {
          if (permissions.canMessage) {
            this.canMessage = true;
            this.loading = false;
            // For new conversations, we don't load messages until the first message is sent
          } else {
            this.canMessage = false;
            this.blockReason = permissions.reason || '';
            this.loading = false;
          }
        },
        error: () => {
          this.canMessage = false;
          this.blockReason = 'Unable to verify messaging permissions';
          this.loading = false;
        }
      });
    } else {
      this.router.navigate(['/messages']);
    }
  }

  loadConversation() {
    this.loading = true;
    this.subscription.add(
      this.messageService.getMessages(this.conversationId).subscribe({
        next: (messages) => {
          this.messages = messages.reverse(); // Show oldest first
          this.loading = false;
          this.scrollToBottom();
          this.markAsRead();
        },
        error: (err) => {
          console.error('Failed to load messages:', err);
          this.loading = false;
        }
      })
    );
  }

  checkMessagingPermissions() {
    // Get the other participant's ID from the conversation
    // For now, we'll assume we can get it from the messages
    // TODO: Get participant ID from conversation metadata
    if (this.messages.length > 0) {
      const currentUserId = this.getCurrentUserId();
      const otherUser = this.messages[0].sender._id === currentUserId
        ? this.messages.find(m => m.sender._id !== currentUserId)?.sender
        : this.messages[0].sender;

      if (otherUser) {
        this.otherParticipant = otherUser;
        this.messageService.checkMessagingPermissions(otherUser._id).subscribe({
          next: (permissions) => {
            this.canMessage = permissions.canMessage;
            this.blockReason = permissions.reason || '';
          },
          error: () => {
            this.canMessage = false;
            this.blockReason = 'Unable to verify messaging permissions';
          }
        });
      }
    }
  }

  onMessageSent(result: any) {
    if (result.conversation) {
      // New conversation created, navigate to it
      this.conversationId = result.conversation._id;
      this.router.navigate(['/messages', this.conversationId], { replaceUrl: true });
      // Load the conversation messages
      this.loadConversation();
    } else if (result.conversationId) {
      // Existing conversation, add message
      this.messages.push(result);
      this.scrollToBottom();
    }
  }

  markAsRead() {
    if (this.conversationId && this.conversationId !== 'new') {
      this.messageService.markAsRead(this.conversationId).subscribe();
    }
  }

  goBack() {
    this.router.navigate(['/messages']);
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  private getCurrentUserId(): string {
    return this.authService.getCurrentUserId() || '';
  }

  isOwnMessage(message: Message): boolean {
    return message.sender._id === this.getCurrentUserId();
  }

  formatMessageTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
