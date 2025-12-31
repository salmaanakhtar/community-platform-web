import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MessageService, Message, MessagingPermissions } from '../../../core/services/message.service';
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
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.conversationId = this.route.snapshot.paramMap.get('id') || '';
    if (this.conversationId) {
      this.loadConversation();
      this.checkMessagingPermissions();
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
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

  onMessageSent(message: Message) {
    this.messages.push(message);
    this.scrollToBottom();
  }

  markAsRead() {
    this.messageService.markAsRead(this.conversationId).subscribe();
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
    // TODO: Get from AuthService
    return '';
  }

  isOwnMessage(message: Message): boolean {
    return message.sender._id === this.getCurrentUserId();
  }

  formatMessageTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
