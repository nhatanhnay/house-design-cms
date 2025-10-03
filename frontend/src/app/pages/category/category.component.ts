import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Observable, switchMap, of } from 'rxjs';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { Post, Admin } from '../../models/models';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, RouterModule],
  template: `
    <div class="category-page">
      <!-- Category Header -->
      <div class="category-header">
        <div class="left-content">
          <h1 class="category-title">{{ categoryName || 'Danh mục không tìm thấy' }}</h1>
          <div class="category-description" *ngIf="categoryDescription">
            <p>{{ categoryDescription }}</p>
          </div>
        </div>
        <div class="right-content">
          <img [src]="categoryThumbnail || 'assets/images/placeholder-category.jpg'"
               [alt]="categoryName"
               class="category-thumbnail"
               (error)="onImageError($event)">
        </div>
      </div>
      <div class="container">

        <!-- Loading State -->
        <div class="loading-state" *ngIf="isLoading">
          <div class="loading-spinner"></div>
          <p>Đang tải bài viết...</p>
        </div>

        <!-- Posts Grid -->
        <div class="posts-grid" *ngIf="posts$ | async as posts; else noPosts">
          <mat-card class="post-card" *ngFor="let post of posts" [routerLink]="'/post/' + post.id">
            <div class="post-image">
              <img
                [src]="post.image_url || 'assets/images/placeholder-post.jpg'"
                [alt]="post.title"
                (error)="onImageError($event)">
              <div class="post-overlay">
                <div class="post-category-badge">{{ categoryName }}</div>
              </div>
            </div>

            <mat-card-content class="post-content">
              <h3 class="post-title">{{ post.title }}</h3>
              <p class="post-summary">{{ post.summary || 'Không có mô tả' }}</p>

              <div class="post-meta">
                <div class="post-date">
                  <mat-icon>event</mat-icon>
                  <span>{{ post.created_at | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
                <div class="post-status" *ngIf="currentUser$ | async" [class.published]="post.published" [class.draft]="!post.published">
                  <mat-icon>{{ post.published ? 'visibility' : 'visibility_off' }}</mat-icon>
                  <span>{{ post.published ? 'Đã xuất bản' : 'Bản nháp' }}</span>
                </div>
                <div class="post-views" *ngIf="!(currentUser$ | async)">
                  <mat-icon>visibility</mat-icon>
                  <span>{{ post.views || 0 }} lượt xem</span>
                </div>
              </div>

              <div class="read-more">
                <span>Xem chi tiết</span>
                <mat-icon>arrow_forward</mat-icon>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Empty State -->
        <ng-template #noPosts>
          <div class="no-posts">
            <mat-icon class="no-posts-icon">article</mat-icon>
            <h3>Chưa có bài viết nào</h3>
            <p>Danh mục này hiện tại chưa có bài viết nào. Hãy quay lại sau nhé!</p>
            <button mat-raised-button color="primary" routerLink="/">
              <mat-icon>home</mat-icon>
              Về trang chủ
            </button>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    @font-face {
      font-family: 'UVF BankGothic Md BT';
      src: url('/assets/images/font/UVF BankGothic Md BT.ttf') format('truetype');
      font-weight: normal;
      font-style: normal;
    }

    .category-page {
      padding: 0px 0;
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    /* Category Header */
    .category-header {
      display: flex;
      width: 100%;
      height: calc(100vh - 64px);
      margin-bottom: 40px;
      background: white;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }

    .left-content {
      width: 20%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: flex-end;
      text-align: right;
      padding: 20px;
      font-family: 'UVF BankGothic Md BT', sans-serif;
      position: relative;
      overflow: visible;
    }

    .right-content {
      width: 80%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .category-title {
      align-items: center;
      justify-content: center;
      display: flex;
      font-size: 60px;
      height: auto;
      font-weight: 700;
      color: var(--dark-blue, #2c3e50);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      transform: rotate(-90deg);
      transform-origin: center;
      white-space: nowrap;
      margin: 0;
      font-family: 'UVF BankGothic Md BT', sans-serif;
      position: absolute;
      right: 20px;
      top: calc(50vh - 32px);
      transform-origin: center;
    }

    .category-description {
      margin-bottom: 20px;
    }

    .category-description p {
      font-size: 1.1rem;
      color: #6c757d;
      line-height: 1.6;
    }

    .category-thumbnail {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
    }

    .posts-count {
      display: inline-block;
      padding: 8px 16px;
      background: var(--primary-blue, #3498db);
      color: white;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 500;
    }

    /* Loading State */
    .loading-state {
      text-align: center;
      padding: 60px 20px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid var(--primary-blue, #3498db);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Posts Grid */
    .posts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 30px;
      margin-top: 30px;
    }

    /* Post Cards */
    .post-card {
      cursor: pointer;
      transition: all 0.3s ease;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      background: white;
      border: none;
    }

    .post-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
    }

    .post-image {
      position: relative;
      height: 240px;
      overflow: hidden;
    }

    .post-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .post-card:hover .post-image img {
      transform: scale(1.05);
    }

    .post-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.3));
    }

    .post-category-badge {
      position: absolute;
      top: 15px;
      left: 15px;
      background: var(--primary-blue, #3498db);
      color: white;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    /* Post Content */
    .post-content {
      padding: 24px !important;
    }

    .post-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--dark-blue, #2c3e50);
      margin-bottom: 12px;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .post-summary {
      color: #6c757d;
      line-height: 1.6;
      margin-bottom: 20px;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .post-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid #eee;
    }

    .post-date,
    .post-status {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      color: #6c757d;
    }

    .post-date mat-icon,
    .post-status mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .post-status.published {
      color: #28a745;
    }

    .post-status.draft {
      color: #ffc107;
    }

    .read-more {
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: var(--primary-blue, #3498db);
      font-weight: 500;
      font-size: 0.9rem;
    }

    .read-more mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      transition: transform 0.3s ease;
    }

    .post-card:hover .read-more mat-icon {
      transform: translateX(4px);
    }

    /* Empty State */
    .no-posts {
      text-align: center;
      padding: 80px 20px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }

    .no-posts-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #ddd;
      margin-bottom: 20px;
    }

    .no-posts h3 {
      color: var(--dark-blue, #2c3e50);
      margin-bottom: 10px;
    }

    .no-posts p {
      color: #6c757d;
      margin-bottom: 30px;
      line-height: 1.6;
    }

    .no-posts button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .category-page {
        padding: 20px 0;
      }

      .container {
        padding: 0 15px;
      }

      .category-title {
        font-size: 2rem;
      }

      .posts-grid {
        grid-template-columns: 1fr;
        gap: 20px;
      }

      .post-meta {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
    }
  `]
})
export class CategoryComponent implements OnInit {
  posts$: Observable<Post[]>;
  currentUser$: Observable<Admin | null>;
  categoryName = '';
  categoryDescription = '';
  categoryThumbnail = '';
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService,
    private authService: AuthService
  ) {
    this.posts$ = this.route.params.pipe(
      switchMap(params => {
        this.isLoading = true;
        this.categoryName = params['slug'];

        // First get categories to find the category ID by slug
        return this.dataService.getCategories().pipe(
          switchMap(categories => {
            const category = categories.find(cat => cat.slug === params['slug']);

            if (category) {
              this.categoryName = category.name; // Use the actual category name
              this.categoryDescription = category.description;
              this.categoryThumbnail = category.thumbnail_url || '';
              return this.dataService.getPosts(category.id);
            } else {
              this.categoryName = 'Danh mục không tìm thấy';
              this.categoryDescription = '';
              this.categoryThumbnail = '';
              return of([]);
            }
          })
        );
      })
    );
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    // Subscribe to posts observable to handle loading state
    this.posts$.subscribe({
      next: (posts) => {
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
      }
    });
  }

  onImageError(event: any): void {
    event.target.src = 'assets/images/placeholder-post.jpg';
  }
}
