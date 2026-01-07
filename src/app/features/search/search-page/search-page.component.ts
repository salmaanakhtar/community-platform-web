import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SearchService, SearchResult, UserSearchResult, PostSearchResult } from '../../../core/services/search.service';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-page.component.html',
  styleUrl: './search-page.component.css'
})
export class SearchPageComponent implements OnInit, OnDestroy {
  searchQuery: string = '';
  searchResults: SearchResult = { users: [], posts: [] };
  isLoading: boolean = false;
  hasSearched: boolean = false;
  private searchSubscription: Subscription = new Subscription();

  constructor(
    private searchService: SearchService,
    private router: Router
  ) {}

  ngOnInit() {
    this.searchSubscription = this.searchService.searchResults$.subscribe(query => {
      if (query) {
        this.performSearch(query);
      }
    });
  }

  ngOnDestroy() {
    this.searchSubscription.unsubscribe();
  }

  onSearchInput() {
    this.searchService.triggerSearch(this.searchQuery);
  }

  performSearch(query: string) {
    if (!query.trim()) {
      this.searchResults = { users: [], posts: [] };
      this.hasSearched = false;
      return;
    }

    this.isLoading = true;
    this.hasSearched = true;

    this.searchService.search(query).subscribe({
      next: (results) => {
        this.searchResults = results;
        // Highlight matches in post content
        this.searchResults.posts = this.searchResults.posts.map(post => ({
          ...post,
          highlightedContent: this.searchService.highlightMatches(post.content, query)
        }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Search error:', err);
        this.searchResults = { users: [], posts: [] };
        this.isLoading = false;
      }
    });
  }

  navigateToProfile(userId: string) {
    this.router.navigate(['/profile', userId]);
  }

  navigateToPost(postId: string) {
    this.router.navigate(['/post', postId]);
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchResults = { users: [], posts: [] };
    this.hasSearched = false;
  }
}
