import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PostService, CreatePostData } from '../../../core/services/post.service';
import { FeedService } from '../../../core/services/feed.service';
import { ErrorHandlerService } from '../../../core/errors/error-handler.service';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './create-post.component.html',
  styleUrl: './create-post.component.css'
})
export class CreatePostComponent implements OnInit, OnDestroy {
  postForm: FormGroup;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isRateLimited = false;
  retryGuidance = '';
  isPosting = false;
  canPost = true;
  private subscription: Subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private postService: PostService,
    private feedService: FeedService,
    private errorHandler: ErrorHandlerService
  ) {
    this.postForm = this.fb.group({
      content: ['', [Validators.required, Validators.maxLength(500)]]
    });
  }

  ngOnInit() {
    this.subscription.add(
      this.errorHandler.rateLimited$.subscribe(isLimited => {
        this.isRateLimited = isLimited;
        this.retryGuidance = this.errorHandler.getRetryGuidance();
      })
    );

    // Check permissions
    this.postService.checkPermissions().subscribe({
      next: (permissions) => {
        this.canPost = permissions.canPost;
      },
      error: () => {
        this.canPost = false;
      }
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      this.previewUrl = URL.createObjectURL(this.selectedFile);
    }
  }

  removeMedia() {
    this.selectedFile = null;
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
      this.previewUrl = null;
    }
  }

  onSubmit() {
    if (this.postForm.valid && !this.isRateLimited && this.canPost && !this.isPosting) {
      this.isPosting = true;
      const postData: CreatePostData = {
        content: this.postForm.value.content,
        media: this.selectedFile || undefined
      };

      // Optimistic UI: Add to feed immediately
      const optimisticPost = {
        _id: 'temp-' + Date.now(),
        content: postData.content,
        author: { _id: 'current', username: 'You' },
        createdAt: new Date().toISOString(),
        isDeleted: false,
        likesCount: 0,
        commentsCount: 0
      };
      const currentPosts = this.feedService['postsSubject'].value;
      this.feedService['postsSubject'].next([optimisticPost, ...currentPosts]);

      this.postService.createPost(postData).subscribe({
        next: (response) => {
          // Replace optimistic post with real one
          const posts = this.feedService['postsSubject'].value;
          const updatedPosts = posts.map(post =>
            post._id === optimisticPost._id ? response.post : post
          );
          this.feedService['postsSubject'].next(updatedPosts);
          this.resetForm();
        },
        error: (error) => {
          // Rollback: Remove optimistic post
          const posts = this.feedService['postsSubject'].value;
          const filteredPosts = posts.filter(post => post._id !== optimisticPost._id);
          this.feedService['postsSubject'].next(filteredPosts);
          // Error is handled by interceptor
        },
        complete: () => {
          this.isPosting = false;
        }
      });
    }
  }

  private resetForm() {
    this.postForm.reset();
    this.removeMedia();
  }
}
