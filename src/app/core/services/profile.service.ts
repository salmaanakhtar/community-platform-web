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
    return this.http.get<UserProfile>(`${environment.apiUrl}/users/${userId}`, { withCredentials: true });
  }

  followUser(userId: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/follow/user/${userId}`, {}, { withCredentials: true });
  }

  unfollowUser(userId: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/follow/user/${userId}`, { withCredentials: true });
  }

  blockUser(userId: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/users/${userId}/block`, {}, { withCredentials: true });
  }

  unblockUser(userId: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/users/${userId}/block`, { withCredentials: true });
  }

  getBlockedUsers(): Observable<UserProfile[]> {
    return this.http.get<UserProfile[]>(`${environment.apiUrl}/blocks`);
  }

  updateProfile(updates: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${environment.apiUrl}/users/profile`, updates);
  }

  isFollowing(userId: string): Observable<boolean> {
    return this.http.get<boolean>(`${environment.apiUrl}/follow/${userId}/status`);
  }

  isBlocked(userId: string): Observable<boolean> {
    return this.http.get<boolean>(`${environment.apiUrl}/users/${userId}/block-status`);
  }
}
