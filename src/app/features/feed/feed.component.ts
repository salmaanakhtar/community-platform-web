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

  constructor(
    private authService: AuthService,
    private router: Router,
    private feedService: FeedService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.feedService.refreshFeed();
      this.subscription.add(
        this.feedService.posts$.subscribe(posts => {
          this.posts = posts;
        })
      );
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
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

  loadMore() {
    if (isPlatformBrowser(this.platformId)) {
      this.currentPage++;
      this.feedService.loadMorePosts(this.currentPage);
    }
  }
}
