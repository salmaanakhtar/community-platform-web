import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserProfile, ProfileService } from '../../../core/services/profile.service';
import { ProfileHeaderComponent } from '../profile-header/profile-header.component';
import { PostCardComponent } from '../../post/post-card/post-card.component';
import { Post, FeedService } from '../../../core/services/feed.service';
import { AuthService } from '../../../core/services/auth.service';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../../environments/environment';

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
  currentUserId: string = '';
  private socket: Socket;

  constructor(
    private route: ActivatedRoute,
    private profileService: ProfileService,
    private feedService: FeedService,
    private authService: AuthService
  ) {    this.currentUserId = this.authService.getCurrentUserId() || '';    this.socket = io(environment.socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
  }

  ngOnInit() {
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    if (this.userId) {
      this.loadProfile();
      this.loadUserPosts();
      this.setupSocketListeners();
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
        this.posts.forEach(post => {
          post.isLiked = post.likes?.some((like: any) => like._id.toString() === this.currentUserId);
        });
      }
    });
  }

  onProfileUpdated(updatedProfile: UserProfile) {
    this.profile = updatedProfile;
  }

  private setupSocketListeners() {
    this.socket.on('postLiked', (data) => {
      this.updatePost(data.postId, data.likesCount, data.isLiked);
    });
    this.socket.on('postUnliked', (data) => {
      this.updatePost(data.postId, data.likesCount, data.isLiked);
    });
  }

  private updatePost(postId: string, likesCount: number, isLiked: boolean) {
    const post = this.posts.find(p => p._id === postId);
    if (post) {
      post.likesCount = likesCount;
      post.isLiked = isLiked;
    }
  }
}
