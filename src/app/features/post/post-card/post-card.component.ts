import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Post } from '../../../core/services/feed.service';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './post-card.component.html',
  styleUrl: './post-card.component.css'
})
export class PostCardComponent {
  @Input() post!: Post;

  likePost(): void {
    if (!this.post.isDeleted) {
      // Implement like logic
      console.log('Like post', this.post._id);
    }
  }

  commentOnPost(): void {
    if (!this.post.isDeleted) {
      // Implement comment logic
      console.log('Comment on post', this.post._id);
    }
  }
}
