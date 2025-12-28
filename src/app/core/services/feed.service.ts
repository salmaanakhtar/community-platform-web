import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { io, Socket } from 'socket.io-client';
import { isPlatformBrowser } from '@angular/common';

export interface Post {
  _id: string;
  content: string;
  author: {
    _id: string;
    username: string;
  };
  createdAt: string;
  isDeleted: boolean;
  likesCount: number;
  commentsCount: number;
  // Add other fields as needed
}

@Injectable({
  providedIn: 'root'
})
export class FeedService {
  private postsSubject = new BehaviorSubject<Post[]>([]);
  public posts$ = this.postsSubject.asObservable();
  private socket: Socket | null = null;
  private postIds = new Set<string>();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.socket = io(environment.socketUrl);
      this.setupSocketListeners();
    }
  }

  getFeed(page: number = 1, limit: number = 10): Observable<Post[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<Post[]>(`${environment.apiUrl}/feed`, { params });
  }

  loadMorePosts(page: number, limit: number = 10): void {
    this.getFeed(page, limit).subscribe(newPosts => {
      const currentPosts = this.postsSubject.value;
      const filteredPosts = this.filterAndDeduplicatePosts(newPosts);
      this.postsSubject.next([...currentPosts, ...filteredPosts]);
    });
  }

  refreshFeed(): void {
    this.getFeed(1, 20).subscribe(posts => {
      const filteredPosts = this.filterAndDeduplicatePosts(posts);
      this.postsSubject.next(filteredPosts);
    });
  }

  private filterAndDeduplicatePosts(posts: Post[]): Post[] {
    return posts
      .filter(post => !post.isDeleted && !this.postIds.has(post._id))
      .map(post => {
        this.postIds.add(post._id);
        return post;
      });
  }

  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('newPost', (post: Post) => {
      if (!post.isDeleted && !this.postIds.has(post._id)) {
        const currentPosts = this.postsSubject.value;
        this.postIds.add(post._id);
        this.postsSubject.next([post, ...currentPosts]);
      }
    });

    this.socket.on('postDeleted', (postId: string) => {
      const currentPosts = this.postsSubject.value;
      const updatedPosts = currentPosts.map(post =>
        post._id === postId ? { ...post, isDeleted: true, content: 'Post deleted' } : post
      );
      this.postsSubject.next(updatedPosts);
    });

    this.socket.on('postLiked', (data: { postId: string; likesCount: number }) => {
      const currentPosts = this.postsSubject.value;
      const updatedPosts = currentPosts.map(post =>
        post._id === data.postId ? { ...post, likesCount: data.likesCount } : post
      );
      this.postsSubject.next(updatedPosts);
    });

    // Add more listeners as needed
  }

  disconnectSocket(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
