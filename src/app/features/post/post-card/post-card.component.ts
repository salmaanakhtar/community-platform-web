import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Post } from '../../../core/services/feed.service';
import { EngagementService } from '../../../core/services/engagement.service';
import { CommentListComponent } from '../comment-list/comment-list.component';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, CommentListComponent],
  templateUrl: './post-card.component.html',
  styleUrl: './post-card.component.css'
})
export class PostCardComponent implements OnInit {
  @Input() post!: Post;
  canEngage = true;
  showComments = false;

  constructor(
    private engagementService: EngagementService,
    private router: Router
  ) {}

  ngOnInit() {
    // Check permissions
    this.engagementService.checkEngagementPermissions(this.post._id).subscribe({
      next: (permissions) => {
        this.canEngage = permissions.canEngage;
      },
      error: () => {
        this.canEngage = false;
      }
    });
  }

  likePost(): void {
    if (!this.post.isDeleted && this.canEngage) {
      // Optimistic update
      const wasLiked = this.post.likesCount > 0; // Simplified, assume toggle
      this.post.likesCount += wasLiked ? -1 : 1;

      const action = wasLiked ? this.engagementService.unlikePost : this.engagementService.likePost;
      action.call(this.engagementService, this.post._id).subscribe({
        next: () => {
          // Success, keep optimistic
        },
        error: () => {
          // Rollback
          this.post.likesCount += wasLiked ? 1 : -1;
        }
      });
    }
  }

  toggleComments(): void {
    this.showComments = !this.showComments;
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile', this.post.author._id]);
  }
}
