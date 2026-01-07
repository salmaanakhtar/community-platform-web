import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, throwError, BehaviorSubject, of } from 'rxjs';
import { catchError, tap, filter, take, switchMap, finalize } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private accessToken: string | null = null;
  private refreshTokenInProgress: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

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
    if (!this.refreshTokenInProgress.value) {
      this.refreshTokenInProgress.next(true);
      this.refreshTokenSubject.next(null);

      this.http.post(`${environment.apiUrl}/auth/refresh`, {}).pipe(
        tap((response: any) => {
          this.accessToken = response.accessToken;
          this.refreshTokenSubject.next(response);
        }),
        catchError(err => {
          this.refreshTokenSubject.next(null);
          return throwError(err);
        }),
        finalize(() => this.refreshTokenInProgress.next(false))
      ).subscribe();
    }

    return this.refreshTokenSubject.pipe(
      filter(result => result !== null),
      take(1),
      switchMap(() => of({}))
    );
  }

  getCurrentUserId(): string | null {
    if (!this.accessToken) return null;

    try {
      // Decode JWT token (simple decode, not verifying signature)
      const payload = this.accessToken.split('.')[1];
      const decodedPayload = JSON.parse(atob(payload));
      return decodedPayload.user?.id || null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }
}
