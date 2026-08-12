import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, Output, EventEmitter, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { RouterModule } from '@angular/router';
import { SkeletonImageDirective } from '../../directives/skeleton-image.directive';
import { DataService } from '../../services/data.service';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

export interface SearchResult {
  id: number;
  title: string;
  summary: string;
  thumbnail_url: string;
  category_id: number;
  category_name: string;
  published: boolean;
  views: number;
  slug: string;
  created_at: string;
  content_type: 'post' | 'product';
}

export interface SearchResponse {
  results: SearchResult[];
  total_count: number;
  total_pages: number;
  current_page: number;
  limit: number;
  query: string;
  type: string;
  sort: string;
}

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    RouterModule,
    SkeletonImageDirective
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="search-container">
      <!-- Search Bar with Filters -->
      <div class="search-bar">
        <div class="search-input-wrapper">
          <label for="search-input" class="visually-hidden">Tìm kiếm tin tức và sản phẩm</label>
          <input type="search"
                 id="search-input"
                 class="search-input"
                 [(ngModel)]="searchQuery"
                 (input)="onSearchInput()"
                 autocomplete="off"
                 placeholder="Tìm kiếm tin tức, sản phẩm...">
        </div>
        
        <!-- Filter Controls (show when has results) -->
        <div class="filter-controls" *ngIf="searchResults && searchResults.results.length > 0">
          <span class="results-count">{{ searchResults.total_count }} kết quả</span>
          <div class="filter-field">
            <label for="filter-type" class="visually-hidden">Lọc theo loại nội dung</label>
            <select id="filter-type" [(ngModel)]="contentType" (ngModelChange)="onFilterChange()" class="custom-select">
              <option value="">Tất cả</option>
              <option value="post">Tin tức</option>
              <option value="product">Sản phẩm</option>
            </select>
          </div>

          <div class="filter-field">
            <label for="filter-sort" class="visually-hidden">Sắp xếp kết quả</label>
            <select id="filter-sort" [(ngModel)]="sortType" (ngModelChange)="onFilterChange()" class="custom-select">
              <option value="newest">Mới nhất</option>
              <option value="popular">Nổi nhất</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="isLoading" aria-live="polite" aria-busy="true">
        <div class="loading-spinner"></div>
        <p>Đang tìm kiếm...</p>
      </div>

      <!-- Search Results -->
      <div class="search-results" *ngIf="!isLoading && searchResults && searchResults.results.length > 0">
        <div class="results-header" aria-live="polite">
          <h3>Kết quả tìm kiếm</h3>
          <p class="results-info">
            Tìm thấy {{ searchResults.total_count }} kết quả
            <span *ngIf="searchQuery"> cho "{{ searchQuery }}"</span>
          </p>
        </div>

        <div class="results-grid">
          <mat-card 
            class="result-card" 
            *ngFor="let result of searchResults.results; trackBy: trackByResult"
            [routerLink]="getResultRoute(result)">
            
            <div class="result-image">
              <img [src]="result.thumbnail_url"
                   [appSkeleton]="result.thumbnail_url"
                   [alt]="result.title"
                   loading="lazy"
                   decoding="async">
              <div class="result-overlay">
                <div class="result-category">{{ result.category_name }}</div>
                <div class="content-type-badge" [class]="result.content_type">
                  <mat-icon>{{ result.content_type === 'product' ? 'shopping_cart' : 'article' }}</mat-icon>
                  {{ result.content_type === 'product' ? 'Sản phẩm' : 'Tin tức' }}
                </div>
              </div>
            </div>

            <mat-card-content class="result-content">
              <h4 class="result-title">{{ result.title }}</h4>
              <p class="result-summary">{{ result.summary || 'Không có mô tả' }}</p>
              
              <div class="result-meta">
                <div class="meta-item">
                  <mat-icon>event</mat-icon>
                  <span>{{ result.created_at | date:'dd/MM/yyyy' }}</span>
                </div>
                <div class="meta-item">
                  <mat-icon>visibility</mat-icon>
                  <span>{{ result.views || 0 }} lượt xem</span>
                </div>
              </div>

              <div class="read-more">
                <span>{{ result.content_type === 'product' ? 'Xem sản phẩm' : 'Xem chi tiết' }}</span>
                <mat-icon>arrow_forward</mat-icon>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Pagination -->
        <div class="pagination" *ngIf="searchResults.total_pages > 1">
          <button type="button" mat-icon-button
                  (click)="goToPage(searchResults.current_page - 1)"
                  [disabled]="searchResults.current_page === 1"
                  aria-label="Trang trước">
            <mat-icon>chevron_left</mat-icon>
          </button>

          <div class="page-numbers">
            <button type="button" mat-button
                    *ngFor="let page of getPageNumbers()"
                    [class.active]="page === searchResults.current_page"
                    [attr.aria-current]="page === searchResults.current_page ? 'page' : null"
                    (click)="goToPage(page)">
              {{ page }}
            </button>
          </div>

          <button type="button" mat-icon-button
                  (click)="goToPage(searchResults.current_page + 1)"
                  [disabled]="searchResults.current_page === searchResults.total_pages"
                  aria-label="Trang sau">
            <mat-icon>chevron_right</mat-icon>
          </button>
        </div>
      </div>

      <!-- No Results -->
      <div class="no-results" *ngIf="!isLoading && searchResults && searchResults.results.length === 0 && searchQuery" role="status" aria-live="polite">
        <mat-icon class="no-results-icon">search_off</mat-icon>
        <h3>Không tìm thấy kết quả</h3>
        <p>Không có kết quả nào cho "{{ searchQuery }}". Hãy thử với từ khóa khác.</p>
      </div>

      <!-- Initial State -->
      <div class="initial-state" *ngIf="!isLoading && !searchResults && !searchQuery">
        <mat-icon class="search-icon">search</mat-icon>
        <h3>Tìm kiếm nội dung</h3>
        <p>Nhập từ khóa để tìm kiếm tin tức và sản phẩm</p>
      </div>
    </div>
  `,
  styles: [`
    .search-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    /* Search Bar with Filters */
    .search-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin-bottom: 30px;
      flex-wrap: wrap;
      max-width: 1000px;
      margin-left: auto;
      margin-right: auto;
    }

    .search-input-wrapper {
      position: relative;
      flex: 1;
      min-width: 300px;
    }

    .search-input {
      width: 100%;
      padding: 16px 20px;
      font-size: 1.1rem;
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 50px;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
      outline: none;
    }

    .search-input::placeholder {
      color: rgba(255, 255, 255, 0.6);
    }

    .search-input:focus {
      border-color: var(--accent-copper, #e09543);
      background: rgba(255, 255, 255, 0.15);
      box-shadow: 0 0 20px rgba(224, 149, 67, 0.3);
    }



    /* Filter Controls */
    .filter-controls {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      flex-shrink: 0;
    }

    .results-count {
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.8rem;
      font-weight: 400;
      white-space: nowrap;
    }

    .filter-field {
      min-width: 110px;
      max-width: 140px;
    }

    .custom-select {
      width: 100%;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      height: 36px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 6px 12px;
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.9);
      outline: none;
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.6)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
      background-repeat: no-repeat;
      background-position: right 8px center;
      background-size: 16px;
      padding-right: 28px;
    }

    .custom-select:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(255, 255, 255, 0.25);
    }

    .custom-select:focus {
      background: rgba(255, 255, 255, 0.15);
      border-color: var(--accent-copper, #e09543);
      box-shadow: 0 0 0 2px rgba(224, 149, 67, 0.2);
    }

    .custom-select option {
      background: #333;
      color: white;
      padding: 8px 12px;
    }

    /* Loading State */
    .loading-state {
      text-align: center;
      padding: 60px 20px;
      color: white;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(255, 255, 255, 0.2);
      border-top: 4px solid var(--accent-copper, #e09543);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Results Section */
    .results-header {
      margin-bottom: 24px;
    }

    .results-header h3 {
      color: white;
      font-size: 1.5rem;
      margin-bottom: 8px;
    }

    .results-info {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
    }

    .results-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 24px;
      margin-bottom: 30px;
    }

    .result-card {
      border-radius: 16px;
      overflow: hidden;
      transition: all 0.3s ease;
      cursor: pointer;
      background: white;
      text-decoration: none;
      color: inherit;
    }

    .result-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
    }

    .result-image {
      position: relative;
      height: 200px;
      overflow: hidden;
    }

    .result-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .result-card:hover .result-image img {
      transform: scale(1.05);
    }

    .result-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.3));
    }

    .result-category {
      position: absolute;
      top: 12px;
      left: 12px;
      background: var(--brand, var(--brand, #e09543));
      color: white;
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .content-type-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      color: white;
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 0.8rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .content-type-badge.product {
      background: #28a745;
    }

    .content-type-badge.post {
      background: #6c757d;
    }

    .content-type-badge mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .result-content {
      padding: 20px !important;
    }

    .result-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 12px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      line-height: 1.4;
    }

    .result-summary {
      color: #666;
      font-size: 0.9rem;
      line-height: 1.5;
      margin-bottom: 16px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .result-meta {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #eee;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #666;
      font-size: 0.8rem;
    }

    .meta-item mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .read-more {
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: var(--brand, var(--brand, #e09543));
      font-weight: 500;
      font-size: 0.9rem;
    }

    .read-more mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      transition: transform 0.3s ease;
    }

    .result-card:hover .read-more mat-icon {
      transform: translateX(4px);
    }

    /* Pagination */
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 12px;
      margin-top: 30px;
    }

    .pagination button[mat-icon-button] {
      background: rgba(255, 255, 255, 0.1);
      border: 2px solid rgba(255, 255, 255, 0.2);
      color: white;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .pagination button[mat-icon-button] mat-icon {
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .pagination button[mat-icon-button]:hover:not([disabled]) {
      background: var(--accent-copper, #e09543);
      border-color: var(--accent-copper, #e09543);
    }

    .pagination button[mat-icon-button]:disabled {
      opacity: 0.3;
    }

    .page-numbers {
      display: flex;
      gap: 8px;
    }

    .page-numbers button {
      min-width: 36px;
      height: 36px;
      border-radius: 8px;
      border: 2px solid rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.1);
      color: white;
      font-weight: 500;
    }

    .page-numbers button:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: var(--accent-copper, #e09543);
    }

    .page-numbers button.active {
      background: var(--accent-copper, #e09543);
      border-color: var(--accent-copper, #e09543);
    }

    /* Empty States */
    .no-results,
    .initial-state {
      text-align: center;
      padding: 80px 20px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      color: white;
    }

    .no-results-icon,
    .search-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: rgba(255, 255, 255, 0.3);
      margin-bottom: 20px;
    }

    .no-results h3,
    .initial-state h3 {
      margin-bottom: 12px;
      font-size: 1.4rem;
    }

    .no-results p,
    .initial-state p {
      color: rgba(255, 255, 255, 0.7);
      line-height: 1.6;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .search-container {
        padding: 16px;
      }

      .search-bar {
        flex-direction: column;
        gap: 12px;
        align-items: center;
        text-align: center;
      }

      .search-input-wrapper {
        min-width: auto;
        width: 100%;
      }

      .search-input {
        font-size: 1rem;
        padding: 14px 16px;
      }

      .filter-controls {
        justify-content: center;
        gap: 8px;
        width: 100%;
        flex-wrap: wrap;
        overflow-x: visible;
        padding-bottom: 2px;
      }

      .filter-field {
        min-width: 90px;
        max-width: 120px;
        flex-shrink: 0;
      }

      .custom-select {
        height: 32px;
        font-size: 0.75rem;
      }

      .results-count {
        font-size: 0.75rem;
        order: -1;
        margin-bottom: 4px;
        flex-shrink: 0;
        width: 100%;
        text-align: center;
      }

      .results-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .result-meta {
        flex-wrap: wrap;
        gap: 12px;
      }

      .pagination {
        gap: 8px;
      }

      .pagination button[mat-icon-button] {
        width: 36px;
        height: 36px;
      }

      .page-numbers button {
        min-width: 32px;
        height: 32px;
        font-size: 0.85rem;
      }
    }
  `]
})
export class SearchComponent implements OnInit, OnDestroy {
  @Output() resultsChange = new EventEmitter<SearchResponse | null>();

  searchQuery = '';
  contentType = '';
  sortType = 'newest';
  
  searchResults: SearchResponse | null = null;
  isLoading = false;
  currentPage = 1;
  
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    // Debounce search input
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.performSearch();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private readonly cdr = inject(ChangeDetectorRef);

  onSearchInput(): void {
    this.searchSubject.next(this.searchQuery);
  }

  trackByResult(_index: number, result: SearchResult): string {
    return `${result.content_type}-${result.id}`;
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.performSearch();
  }

  performSearch(): void {
    if (!this.searchQuery.trim() && !this.contentType) {
      this.searchResults = null;
      this.resultsChange.emit(null);
      return;
    }

    this.isLoading = true;
    const params = {
      query: this.searchQuery.trim(),
      type: this.contentType,
      sort: this.sortType,
      limit: 12,
      offset: (this.currentPage - 1) * 12
    };

    this.dataService.searchContent(params).subscribe({
      next: (response) => {
        this.searchResults = response;
        this.isLoading = false;
        this.resultsChange.emit(response);
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.searchResults = null;
        this.resultsChange.emit(null);
        this.cdr.markForCheck();
      }
    });
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= (this.searchResults?.total_pages || 1)) {
      this.currentPage = page;
      this.performSearch();
    }
  }

  getPageNumbers(): number[] {
    if (!this.searchResults) return [];
    
    const totalPages = this.searchResults.total_pages;
    const currentPage = this.searchResults.current_page;
    const maxVisible = 5;
    
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  getResultRoute(result: SearchResult): string {
    if (result.content_type === 'product') {
      return '/product/' + (result.slug || result.id);
    }
    return '/post/' + (result.slug || result.id);
  }

}