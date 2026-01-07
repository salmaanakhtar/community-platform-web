import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService, Message } from '../../../core/services/message.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-message-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './message-input.component.html',
  styleUrl: './message-input.component.css'
})
export class MessageInputComponent {
  @Input() conversationId: string = '';
  @Input() recipientId: string = '';
  @Output() messageSent = new EventEmitter<any>();
  @ViewChild('messageInput') messageInput!: ElementRef<HTMLTextAreaElement>;

  messageContent: string = '';
  sending: boolean = false;

  constructor(
    private messageService: MessageService,
    private toastr: ToastrService
  ) {}

  sendMessage() {
    if (!this.messageContent.trim() || this.sending) return;

    this.sending = true;
    console.log('Sending message:', { conversationId: this.conversationId, recipientId: this.recipientId, content: this.messageContent.trim() });

    if (this.conversationId && this.conversationId !== 'new') {
      console.log('Sending to existing conversation:', this.conversationId);
      // Existing conversation
      this.messageService.sendMessage(this.conversationId, this.messageContent.trim()).subscribe({
        next: (message) => {
          console.log('Message sent successfully:', message);
          this.messageContent = '';
          this.messageSent.emit(message);
          this.adjustTextareaHeight();
          this.sending = false;
        },
        error: (err) => {
          console.error('Failed to send message:', err);
          this.toastr.error('Failed to send message');
          this.sending = false;
        }
      });
    } else if (this.recipientId) {
      console.log('Starting new conversation with:', this.recipientId);
      this.messageService.startConversation(this.recipientId, this.messageContent.trim()).subscribe({
        next: (result) => {
          console.log('Conversation started successfully:', result);
          this.messageContent = '';
          this.messageSent.emit(result); // Emit the full result including conversation
          this.adjustTextareaHeight();
          this.sending = false;
        },
        error: (err) => {
          console.error('Failed to start conversation:', err);
          this.toastr.error('Failed to send message');
          this.sending = false;
        }
      });
    }
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  onInput() {
    this.adjustTextareaHeight();
  }

  private adjustTextareaHeight() {
    if (this.messageInput) {
      const textarea = this.messageInput.nativeElement;
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }
}
