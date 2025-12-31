import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private accessToken: string | null = null;

  constructor(private http: HttpClient) { }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      catchError(error => throwError(error)),
      tap((response: any) => {
        this.accessToken = response.accessToken;
      })
    );
  }

  register(userData: { username: string; email: string; password: string }): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/register`, userData).pipe(
      catchError(error => throwError(error)),
      tap((response: any) => {
        this.accessToken = response.accessToken;
      })
    );
  }

  logout(): void {
    this.accessToken = null;
    // Refresh token is handled by backend via httpOnly cookie
  }

  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  refreshToken(): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/refresh`, {}).pipe(
      tap((response: any) => {
        this.accessToken = response.accessToken;
      })
    );
  }

  getCurrentUserId(): string | null {
    if (!this.accessToken) return null;

    try {
      // Decode JWT token (simple decode, not verifying signature)
      const payload = this.accessToken.split('.')[1];
      const decodedPayload = JSON.parse(atob(payload));
      return decodedPayload.userId || decodedPayload.id || null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }
}
