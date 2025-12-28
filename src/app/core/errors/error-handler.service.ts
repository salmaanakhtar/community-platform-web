import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  private rateLimitCooldown: number = 0;
  private cooldownTimer: any;
  private rateLimitedSubject = new BehaviorSubject<boolean>(false);
  public rateLimited$ = this.rateLimitedSubject.asObservable();

  constructor(private toastr: ToastrService) { }

  handleError(error: HttpErrorResponse): void {
    let message = 'An unexpected error occurred.';

    switch (error.status) {
      case 429:
        message = 'Rate limit exceeded. Please wait before trying again.';
        this.handleRateLimit(error);
        break;
      case 403:
        message = 'Permission denied. You do not have access to this resource.';
        break;
      case 404:
        message = 'Resource not found.';
        break;
      case 500:
        message = 'Server error. Please try again later.';
        break;
      default:
        if (error.error && error.error.message) {
          message = error.error.message;
        }
        break;
    }

    this.showMessage(message);
  }

  private handleRateLimit(error: HttpErrorResponse): void {
    // Assume retry-after header or default to 60 seconds
    const retryAfter = error.headers?.get('Retry-After') || '60';
    this.rateLimitCooldown = parseInt(retryAfter, 10) * 1000; // convert to ms
    this.rateLimitedSubject.next(true);

    this.cooldownTimer = setTimeout(() => {
      this.rateLimitCooldown = 0;
      this.rateLimitedSubject.next(false);
    }, this.rateLimitCooldown);
  }

  showMessage(message: string): void {
    this.toastr.error(message, 'Error');
  }

  isRateLimited(): boolean {
    return this.rateLimitCooldown > 0;
  }

  getCooldownTime(): number {
    return Math.ceil(this.rateLimitCooldown / 1000); // seconds
  }

  getRetryGuidance(): string {
    if (this.isRateLimited()) {
      return `Please wait ${this.getCooldownTime()} seconds before retrying.`;
    }
    return '';
  }
}
