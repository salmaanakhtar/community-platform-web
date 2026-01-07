import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { FeedService, Post } from '../../core/services/feed.service';
import { PostCardComponent } from '../post/post-card/post-card.component';
import { CreatePostComponent } from '../post/create-post/create-post.component';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, PostCardComponent, CreatePostComponent],
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.css'
})
export class FeedComponent implements OnInit, OnDestroy {
  posts: Post[] = [];
  currentPage = 1;
  private subscription: Subscription = new Subscription();
  private hasInitialized = false;
  private currentUserId: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private feedService: FeedService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.currentUserId = this.authService.getCurrentUserId() || '';
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId) && !this.hasInitialized) {
      this.hasInitialized = true;
      this.feedService.refreshFeed();
      this.subscription.add(
        this.feedService.posts$.subscribe(posts => {
          this.posts = posts;
          this.posts.forEach(post => {
            post.isLiked = post.likes?.some(like => like._id === this.currentUserId);
          });
        })
      );
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.hasInitialized = false; // Reset for potential re-initialization
    if (isPlatformBrowser(this.platformId)) {
      this.feedService.disconnectSocket();
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  navigateToSearch() {
    this.router.navigate(['/search']);
  }

  navigateToMessages() {
    this.router.navigate(['/messages']);
  }

  loadMore() {
    if (isPlatformBrowser(this.platformId)) {
      this.currentPage++;
      this.feedService.loadMorePosts(this.currentPage);
    }
  }
}
