import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserProfile, ProfileService } from '../../../core/services/profile.service';
import { MessageService } from '../../../core/services/message.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-profile-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-header.component.html',
  styleUrl: './profile-header.component.css'
})
export class ProfileHeaderComponent implements OnInit, OnChanges {
  @Input() profile: UserProfile | null = null;
  @Input() userId: string = '';
  @Output() profileUpdated = new EventEmitter<UserProfile>();

  isFollowing: boolean = false;
  isBlocked: boolean = false;
  isCurrentUser: boolean = false;
  currentUserId: string = '';

  constructor(
    private profileService: ProfileService,
    private authService: AuthService,
    private messageService: MessageService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.currentUserId = this.authService.getCurrentUserId() || '';
    this.isCurrentUser = this.currentUserId === this.userId;
    if (!this.isCurrentUser && this.profile) {
      this.checkFollowStatus();
      this.checkBlockStatus();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['profile'] && !this.isCurrentUser && this.profile) {
      this.checkFollowStatus();
      this.checkBlockStatus();
    }
  }

  checkFollowStatus() {
    this.profileService.isFollowing(this.userId).subscribe({
      next: (isFollowing) => {
        this.isFollowing = isFollowing;
      }
    });
  }

  checkBlockStatus() {
    this.profileService.isBlocked(this.userId).subscribe({
      next: (isBlocked) => {
        this.isBlocked = isBlocked;
      }
    });
  }

  follow() {
    this.profileService.followUser(this.userId).subscribe({
      next: () => {
        this.isFollowing = true;
        this.toastr.success('User followed');
        if (this.profile) {
          this.profile.followersCount++;
          this.profileUpdated.emit(this.profile);
        }
      },
      error: (err) => {
        this.toastr.error('Failed to follow user');
      }
    });
  }

  unfollow() {
    this.profileService.unfollowUser(this.userId).subscribe({
      next: () => {
        this.isFollowing = false;
        this.toastr.success('User unfollowed');
        if (this.profile) {
          this.profile.followersCount--;
          this.profileUpdated.emit(this.profile);
        }
      },
      error: (err) => {
        this.toastr.error('Failed to unfollow user');
      }
    });
  }

  block() {
    this.profileService.blockUser(this.userId).subscribe({
      next: () => {
        this.isBlocked = true;
        this.toastr.success('User blocked');
        this.profileUpdated.emit(this.profile!);
      },
      error: (err) => {
        this.toastr.error('Failed to block user');
      }
    });
  }

  unblock() {
    this.profileService.unblockUser(this.userId).subscribe({
      next: () => {
        this.isBlocked = false;
        this.toastr.success('User unblocked');
        this.profileUpdated.emit(this.profile!);
      },
      error: (err) => {
        this.toastr.error('Failed to unblock user');
      }
    });
  }

  messageUser() {
    // Check permissions first
    this.messageService.checkMessagingPermissions(this.userId).subscribe({
      next: (permissions) => {
        if (permissions.canMessage) {
          // Navigate to new conversation
          this.router.navigate(['/messages/new'], {
            queryParams: { user: this.userId }
          });
        } else {
          this.toastr.error(permissions.reason || 'You cannot message this user');
        }
      },
      error: () => {
        this.toastr.error('Unable to check messaging permissions');
      }
    });
  }
}
