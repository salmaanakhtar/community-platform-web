import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from './auth.service';

export interface Conversation {
  _id: string;
  participants: {
    _id: string;
    username: string;
  }[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  sender: {
    _id: string;
    username: string;
  };
  content: string;
  createdAt: string;
  readBy: string[];
  isDeleted: boolean;
}

export interface MessagingPermissions {
  canMessage: boolean;
  reason?: string; // e.g., "User has blocked you" or "You have blocked this user"
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private socket: Socket | null = null;
  private conversationsSubject = new BehaviorSubject<Conversation[]>([]);
  public conversations$ = this.conversationsSubject.asObservable();
  private newMessageSubject = new BehaviorSubject<Message | null>(null);
  public newMessage$ = this.newMessageSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    private authService: AuthService
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.socket = io(environment.socketUrl);
      this.setupSocketListeners();
    }
  }

  // Get all conversations for current user
  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${environment.apiUrl}/messages/conversations`);
  }

  // Get messages for a specific conversation
  getMessages(conversationId: string, page: number = 1, limit: number = 50): Observable<Message[]> {
    const params = `?page=${page}&limit=${limit}`;
    return this.http.get<Message[]>(`${environment.apiUrl}/messages/conversations/${conversationId}${params}`);
  }

  // Send a message
  sendMessage(conversationId: string, content: string): Observable<Message> {
    return this.http.post<Message>(`${environment.apiUrl}/messages`, {
      conversationId,
      content
    });
  }

  // Start a new conversation
  startConversation(recipientId: string, content: string): Observable<{ conversation: Conversation; message: Message }> {
    return this.http.post<{ conversation: Conversation; message: Message }>(`${environment.apiUrl}/messages/conversations`, {
      recipientId,
      content
    });
  }

  // Check if user can message another user (blocking rules)
  checkMessagingPermissions(userId: string): Observable<MessagingPermissions> {
    return this.http.get<MessagingPermissions>(`${environment.apiUrl}/messages/permissions/${userId}`);
  }

  // Mark messages as read
  markAsRead(conversationId: string): Observable<any> {
    return this.http.put(`${environment.apiUrl}/messages/conversations/${conversationId}/read`, {});
  }

  // Delete a message (soft delete)
  deleteMessage(messageId: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/messages/${messageId}`);
  }

  private setupSocketListeners(): void {
    if (!this.socket) return;

    // Join user room when connected
    this.socket.on('connect', () => {
      const userId = this.authService.getCurrentUserId();
      if (userId) {
        this.socket?.emit('join', userId);
      }
    });

    // New message received
    this.socket.on('newMessage', (message: Message) => {
      // Update conversations list
      this.refreshConversations();
      // Emit the new message
      this.newMessageSubject.next(message);
    });

    // Message read by other user
    this.socket.on('messageRead', (data: { conversationId: string; readBy: string[] }) => {
      // Could emit to update read status in UI
    });
  }

  private refreshConversations(): void {
    this.getConversations().subscribe(conversations => {
      this.conversationsSubject.next(conversations);
    });
  }

  disconnectSocket(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
