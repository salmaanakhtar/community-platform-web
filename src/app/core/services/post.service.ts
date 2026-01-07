import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ErrorHandlerService } from '../errors/error-handler.service';

export interface CreatePostData {
  content: string;
  media?: File;
}

@Injectable({
  providedIn: 'root'
})
export class PostService {
  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService
  ) {}

  createPost(postData: CreatePostData): Observable<any> {
    if (this.errorHandler.isRateLimited()) {
      return throwError('Rate limited. Please wait before posting.');
    }

    if (postData.media) {
      // Send as FormData if there's media
      const formData = new FormData();
      formData.append('content', postData.content);
      formData.append('media', postData.media);
      return this.http.post(`${environment.apiUrl}/posts`, formData);
    } else {
      // Send as JSON if no media
      return this.http.post(`${environment.apiUrl}/posts`, { content: postData.content });
    }
  }

  checkPermissions(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/auth/permissions`);
  }

  canPost(): boolean {
    // This could be cached or checked via permissions
    return !this.errorHandler.isRateLimited();
  }
}
