import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserProfile, ProfileService } from '../../../core/services/profile.service';
import { ProfileHeaderComponent } from '../profile-header/profile-header.component';
import { PostCardComponent } from '../../post/post-card/post-card.component';
import { Post, FeedService } from '../../../core/services/feed.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, ProfileHeaderComponent, PostCardComponent],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.css'
})
export class ProfilePageComponent implements OnInit {
  profile: UserProfile | null = null;
  posts: Post[] = [];
  userId: string = '';

  constructor(
    private route: ActivatedRoute,
    private profileService: ProfileService,
    private feedService: FeedService
  ) {}

  ngOnInit() {
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    if (this.userId) {
      this.loadProfile();
      this.loadUserPosts();
    }
  }

  loadProfile() {
    this.profileService.getProfile(this.userId).subscribe({
      next: (profile) => {
        this.profile = profile;
      }
    });
  }

  loadUserPosts() {
    this.feedService.getPostsByUser(this.userId).subscribe({
      next: (posts) => {
        this.posts = posts;
      }
    });
  }

  onProfileUpdated(updatedProfile: UserProfile) {
    this.profile = updatedProfile;
  }
}
