import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Comment, EngagementService } from '../../../core/services/engagement.service';
import { CommentItemComponent } from '../comment-item/comment-item.component';
import { ErrorHandlerService } from '../../../core/errors/error-handler.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-comment-list',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, CommentItemComponent],
  templateUrl: './comment-list.component.html',
  styleUrl: './comment-list.component.css'
})
export class CommentListComponent implements OnInit {
  @Input() postId!: string;
  @Input() canComment: boolean = true;
  comments: Comment[] = [];
  commentForm: FormGroup;
  isRateLimited = false;
  retryGuidance = '';
  isPosting = false;
  private subscription: Subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private engagementService: EngagementService,
    private errorHandler: ErrorHandlerService
  ) {
    this.commentForm = this.fb.group({
      content: ['', [Validators.required, Validators.maxLength(200)]]
    });
  }

  ngOnInit() {
    this.loadComments();
    this.subscription.add(
      this.errorHandler.rateLimited$.subscribe(isLimited => {
        this.isRateLimited = isLimited;
        this.retryGuidance = this.errorHandler.getRetryGuidance();
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadComments() {
    this.engagementService.getComments(this.postId).subscribe({
      next: (comments) => {
        this.comments = comments;
      },
      error: (error) => {
        // Handle error
      }
    });
  }

  onSubmit() {
    if (this.commentForm.valid && !this.isRateLimited && this.canComment && !this.isPosting) {
      this.isPosting = true;
      const content = this.commentForm.value.content;

      // Optimistic UI
      const optimisticComment: Comment = {
        _id: 'temp-' + Date.now(),
        content,
        author: { _id: 'current', username: 'You' },
        createdAt: new Date().toISOString(),
        isDeleted: false
      };
      this.comments.unshift(optimisticComment);

      this.engagementService.addComment(this.postId, content).subscribe({
        next: (response) => {
          // Replace optimistic with real
          const index = this.comments.findIndex(c => c._id === optimisticComment._id);
          if (index !== -1) {
            this.comments[index] = {
              _id: response._id,
              content: response.text, // Map text to content
              author: response.author,
              createdAt: response.createdAt,
              isDeleted: response.deleted
            };
          }
          this.commentForm.reset();
        },
        error: (error) => {
          // Rollback
          this.comments = this.comments.filter(c => c._id !== optimisticComment._id);
        },
        complete: () => {
          this.isPosting = false;
        }
      });
    }
  }
}
