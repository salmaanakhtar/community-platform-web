import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ErrorHandlerService } from '../errors/error-handler.service';

export interface Comment {
  _id: string;
  content: string;
  author: {
    _id: string;
    username: string;
  };
  createdAt: string;
  isDeleted: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EngagementService {
  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService
  ) {}

  likePost(postId: string): Observable<any> {
    if (this.errorHandler.isRateLimited()) {
      return throwError('Rate limited. Please wait before liking.');
    }
    return this.http.post(`${environment.apiUrl}/posts/${postId}/like`, {});
  }

  unlikePost(postId: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/posts/${postId}/like`);
  }

  addComment(postId: string, content: string): Observable<any> {
    if (this.errorHandler.isRateLimited()) {
      return throwError('Rate limited. Please wait before commenting.');
    }
    return this.http.post(`${environment.apiUrl}/posts/${postId}/comments`, { content });
  }

  getComments(postId: string): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${environment.apiUrl}/posts/${postId}/comments`);
  }

  deleteComment(postId: string, commentId: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/posts/${postId}/comments/${commentId}`);
  }

  checkEngagementPermissions(postId: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/posts/${postId}/permissions`);
  }
}
