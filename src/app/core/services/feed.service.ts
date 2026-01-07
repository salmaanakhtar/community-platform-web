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
  likes?: any[];
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
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
  private isLoading = false;
  private lastRefreshTime = 0;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.socket = io(environment.socketUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });
      this.setupSocketListeners();
    }
  }

  getFeed(page: number = 1, limit: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get(`${environment.apiUrl}/feed`, { params });
  }

  getPostsByUser(userId: string, page: number = 1, limit: number = 10): Observable<Post[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<Post[]>(`${environment.apiUrl}/users/${userId}/posts`, { params });
  }

  loadMorePosts(page: number, limit: number = 10): void {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.getFeed(page, limit).subscribe({
      next: (response) => {
        // Handle different response formats
        let newPosts: Post[] = [];
        if (Array.isArray(response)) {
          newPosts = response;
        } else if (response && Array.isArray(response.data)) {
          newPosts = response.data;
        } else if (response && typeof response === 'object') {
          // Try to extract posts from various possible response structures
          const rawPosts = response.posts || response.results || [];
          newPosts = Array.isArray(rawPosts) ? rawPosts.map((post: any) => ({
            _id: post._id,
            content: post.text, // Map backend 'text' to frontend 'content'
            author: post.author,
            createdAt: post.createdAt,
            isDeleted: post.deleted,
            likes: post.likes,
            likesCount: post.likes ? post.likes.length : 0,
            commentsCount: post.comments ? post.comments.length : 0
          })) : [];
        }

        const currentPosts = this.postsSubject.value;
        const filteredPosts = this.filterAndDeduplicatePosts(newPosts);
        this.postsSubject.next([...currentPosts, ...filteredPosts]);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load more posts:', error);
        this.isLoading = false;
      }
    });
  }

  refreshFeed(): void {
    const now = Date.now();
    // Prevent refresh calls more frequent than once per second
    if (this.isLoading || (now - this.lastRefreshTime) < 1000) {
      return;
    }

    this.isLoading = true;
    this.lastRefreshTime = now;

    this.getFeed(1, 20).subscribe({
      next: (response) => {
        console.log('Feed response:', response); // Debug log
        // Handle different response formats
        let posts: Post[] = [];
        if (Array.isArray(response)) {
          posts = response;
        } else if (response && Array.isArray(response.data)) {
          posts = response.data;
        } else if (response && typeof response === 'object' && Array.isArray(response.posts)) {
          posts = response.posts.map((post: any) => ({
            _id: post._id,
            content: post.text, // Map backend 'text' to frontend 'content'
            author: post.author,
            createdAt: post.createdAt,
            isDeleted: post.deleted,
            likesCount: post.likes ? post.likes.length : 0,
            commentsCount: post.comments ? post.comments.length : 0
          }));
        } else {
          console.error('Unexpected response format:', response);
          posts = [];
        }

        if (!Array.isArray(posts)) {
          console.error('Posts is not an array:', posts);
          posts = [];
        }

        const filteredPosts = this.filterAndDeduplicatePosts(posts);
        this.postsSubject.next(filteredPosts);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to refresh feed:', error);
        this.postsSubject.next([]); // Clear posts on error
        this.isLoading = false;
      }
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

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    this.socket.on('newPost', (post: Post) => {
      console.log('Received new post via socket:', post._id);
      if (!post.isDeleted && !this.postIds.has(post._id)) {
        const currentPosts = this.postsSubject.value;
        this.postIds.add(post._id);
        this.postsSubject.next([post, ...currentPosts]);
      }
    });

    this.socket.on('postDeleted', (postId: string) => {
      console.log('Received post deletion via socket:', postId);
      const currentPosts = this.postsSubject.value;
      const updatedPosts = currentPosts.map(post =>
        post._id === postId ? { ...post, isDeleted: true, content: 'Post deleted' } : post
      );
      this.postsSubject.next(updatedPosts);
    });

    this.socket.on('postLiked', (data: { postId: string; likesCount: number }) => {
      console.log('Received post like update via socket:', data);
      const currentPosts = this.postsSubject.value;
      const updatedPosts = currentPosts.map(post =>
        post._id === data.postId ? { ...post, likesCount: data.likesCount } : post
      );
      this.postsSubject.next(updatedPosts);
    });

    this.socket.on('newComment', (data: { postId: string; commentsCount: number }) => {
      console.log('Received new comment update via socket:', data);
      const currentPosts = this.postsSubject.value;
      const updatedPosts = currentPosts.map(post =>
        post._id === data.postId ? { ...post, commentsCount: data.commentsCount } : post
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
