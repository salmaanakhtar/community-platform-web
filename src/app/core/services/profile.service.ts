import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserProfile {
  _id: string;
  username: string;
  email: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowing: boolean;
  isBlocked: boolean;
  isBlocking: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  constructor(private http: HttpClient) {}

  getProfile(userId: string): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${environment.apiUrl}/users/${userId}`);
  }

  followUser(userId: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/follows`, { userId });
  }

  unfollowUser(userId: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/follows/${userId}`);
  }

  blockUser(userId: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/blocks`, { userId });
  }

  unblockUser(userId: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/blocks/${userId}`);
  }

  getBlockedUsers(): Observable<UserProfile[]> {
    return this.http.get<UserProfile[]>(`${environment.apiUrl}/blocks`);
  }

  updateProfile(updates: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${environment.apiUrl}/users/profile`, updates);
  }

  isFollowing(userId: string): Observable<boolean> {
    return this.http.get<boolean>(`${environment.apiUrl}/follows/${userId}/status`);
  }

  isBlocked(userId: string): Observable<boolean> {
    return this.http.get<boolean>(`${environment.apiUrl}/blocks/${userId}/status`);
  }
}
