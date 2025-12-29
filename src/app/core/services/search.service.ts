import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SearchResult {
  users: UserSearchResult[];
  posts: PostSearchResult[];
}

export interface UserSearchResult {
  _id: string;
  username: string;
  email: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
}

export interface PostSearchResult {
  _id: string;
  content: string;
  author: {
    _id: string;
    username: string;
  };
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  // Highlighted content with search terms
  highlightedContent?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private searchSubject = new Subject<string>();
  public searchResults$ = this.searchSubject.pipe(
    debounceTime(300),
    distinctUntilChanged()
  );

  constructor(private http: HttpClient) {}

  search(query: string): Observable<SearchResult> {
    if (!query.trim()) {
      return new Observable(observer => {
        observer.next({ users: [], posts: [] });
        observer.complete();
      });
    }

    const params = new HttpParams().set('q', query.trim());
    return this.http.get<SearchResult>(`${environment.apiUrl}/search`, { params });
  }

  searchUsers(query: string): Observable<UserSearchResult[]> {
    if (!query.trim()) {
      return new Observable(observer => {
        observer.next([]);
        observer.complete();
      });
    }

    const params = new HttpParams().set('q', query.trim());
    return this.http.get<UserSearchResult[]>(`${environment.apiUrl}/search/users`, { params });
  }

  searchPosts(query: string): Observable<PostSearchResult[]> {
    if (!query.trim()) {
      return new Observable(observer => {
        observer.next([]);
        observer.complete();
      });
    }

    const params = new HttpParams().set('q', query.trim());
    return this.http.get<PostSearchResult[]>(`${environment.apiUrl}/search/posts`, { params });
  }

  // Helper method to highlight search terms in text
  highlightMatches(text: string, query: string): string {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }
}
