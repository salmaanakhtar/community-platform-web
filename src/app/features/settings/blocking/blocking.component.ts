import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileService, UserProfile } from '../../../core/services/profile.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-blocking',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './blocking.component.html',
  styleUrl: './blocking.component.css'
})
export class BlockingComponent implements OnInit {
  blockedUsers: UserProfile[] = [];
  loading: boolean = true;

  constructor(
    private profileService: ProfileService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.loadBlockedUsers();
  }

  loadBlockedUsers() {
    this.loading = true;
    this.profileService.getBlockedUsers().subscribe({
      next: (users) => {
        this.blockedUsers = users;
        this.loading = false;
      },
      error: (err) => {
        this.toastr.error('Failed to load blocked users');
        this.loading = false;
      }
    });
  }

  unblockUser(userId: string) {
    this.profileService.unblockUser(userId).subscribe({
      next: () => {
        this.blockedUsers = this.blockedUsers.filter(user => user._id !== userId);
        this.toastr.success('User unblocked');
      },
      error: (err) => {
        this.toastr.error('Failed to unblock user');
      }
    });
  }
}
