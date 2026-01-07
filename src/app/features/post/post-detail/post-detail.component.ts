import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PostCardComponent } from '../post-card/post-card.component';
import { CommentListComponent } from '../comment-list/comment-list.component';
import { Post, FeedService } from '../../../core/services/feed.service';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [CommonModule, PostCardComponent, CommentListComponent],
  templateUrl: './post-detail.component.html',
  styleUrl: './post-detail.component.css'
})
export class PostDetailComponent implements OnInit {
  post: Post | null = null;
  postId: string = '';

  constructor(
    private route: ActivatedRoute,
    private feedService: FeedService
  ) {}

  ngOnInit() {
    this.postId = this.route.snapshot.paramMap.get('id') || '';
    if (this.postId) {
      this.loadPost();
    }
  }

  loadPost() {
    // For now, load from feed service or create a method to get single post
    // TODO: Implement getPostById in feedService
    this.feedService.getFeed(1, 50).subscribe({
      next: (response) => {
        let posts: Post[] = [];
        if (Array.isArray(response)) {
          posts = response;
        } else if (response && Array.isArray(response.data)) {
          posts = response.data;
        } else if (response && typeof response === 'object') {
          const rawPosts = response.posts || response.results || [];
          posts = Array.isArray(rawPosts) ? rawPosts.map((post: any) => ({
            _id: post._id,
            content: post.text,
            author: post.author,
            createdAt: post.createdAt,
            isDeleted: post.deleted,
            likes: post.likes,
            likesCount: post.likes ? post.likes.length : 0,
            commentsCount: post.comments ? post.comments.length : 0
          })) : [];
        }
        this.post = posts.find(p => p._id === this.postId) || null;
      }
    });
  }
}