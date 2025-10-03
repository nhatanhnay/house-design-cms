import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Observable, switchMap } from 'rxjs';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { Post, Admin } from '../../models/models';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, RouterModule],
  template: `
    <div class="post-detail-page">
      <div class="container">
        <!-- Loading State -->
        <div class="loading-state" *ngIf="isLoading">
          <div class="loading-spinner"></div>
          <p>Đang tải bài viết...</p>
        </div>

        <!-- Post Content -->
        <article class="post-article" *ngIf="post && !isLoading && !hasError">
          <!-- Post Header -->
          <header class="post-header">
            <div class="breadcrumb">
              <button mat-button routerLink="/">
                <mat-icon>home</mat-icon>
                Trang chủ
              </button>
              <mat-icon>chevron_right</mat-icon>
              <button mat-button [routerLink]="'/category/' + post.category.slug" *ngIf="post.category">
                {{ post.category.name }}
              </button>
              <mat-icon>chevron_right</mat-icon>
              <span>{{ post.title }}</span>
            </div>

            <h1 class="post-title">{{ post.title }}</h1>

            <div class="post-meta">
              <div class="meta-item">
                <mat-icon>event</mat-icon>
                <span>{{ post.created_at | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
              <div class="meta-item" *ngIf="post.category">
                <mat-icon>category</mat-icon>
                <span>{{ post.category.name }}</span>
              </div>
              <div class="meta-item" *ngIf="currentUser$ | async" [class.published]="post.published" [class.draft]="!post.published">
                <mat-icon>{{ post.published ? 'visibility' : 'visibility_off' }}</mat-icon>
                <span>{{ post.published ? 'Đã xuất bản' : 'Bản nháp' }}</span>
              </div>
              <div class="meta-item" *ngIf="!(currentUser$ | async)">
                <mat-icon>visibility</mat-icon>
                <span>{{ post.views || 0 }} lượt xem</span>
              </div>
            </div>

            <div class="post-summary" *ngIf="post.summary">
              <p>{{ post.summary }}</p>
            </div>
          </header>

          <!-- Featured Image -->
          <div class="featured-image" *ngIf="post.image_url">
            <img [src]="post.image_url" [alt]="post.title" (error)="onImageError($event)">
          </div>

          <!-- Post Content -->
          <div class="post-content">
            <div class="content-html" [innerHTML]="post.content"></div>
          </div>

          <!-- Post Actions -->
          <footer class="post-footer">
            <div class="share-buttons">
              <h4>Chia sẻ bài viết</h4>
              <div class="social-buttons">
                <button mat-raised-button color="primary" (click)="shareOnFacebook(post)">
                  <mat-icon>share</mat-icon>
                  Facebook
                </button>
                <button mat-stroked-button (click)="copyLink()">
                  <mat-icon>link</mat-icon>
                  Sao chép liên kết
                </button>
              </div>
            </div>

            <div class="navigation-buttons">
              <button mat-button [routerLink]="'/category/' + post.category.slug" *ngIf="post.category">
                <mat-icon>arrow_back</mat-icon>
                Quay lại {{ post.category.name }}
              </button>
              <button mat-raised-button color="primary" routerLink="/">
                <mat-icon>home</mat-icon>
                Về trang chủ
              </button>
            </div>
          </footer>
        </article>

        <!-- Error State -->
        <div class="error-state" *ngIf="!isLoading && (hasError || !post)">
          <mat-icon class="error-icon">error_outline</mat-icon>
          <h3>Không tìm thấy bài viết</h3>
          <p>Bài viết bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
          <button mat-raised-button color="primary" routerLink="/">
            <mat-icon>home</mat-icon>
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .post-detail-page {
      padding: 20px 0;
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 0 20px;
    }

    /* Loading State */
    .loading-state {
      text-align: center;
      padding: 80px 20px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      margin-bottom: 30px;
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

    /* Post Article */
    .post-article {
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      margin-bottom: 30px;
    }

    /* Post Header */
    .post-header {
      padding: 40px;
      border-bottom: 1px solid #eee;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 30px;
      font-size: 0.9rem;
      color: #6c757d;
    }

    .breadcrumb button {
      color: var(--primary-blue, #3498db) !important;
      min-width: auto;
      padding: 0 8px;
      height: auto;
    }

    .breadcrumb mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #6c757d;
    }

    .post-title {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--dark-blue, #2c3e50);
      line-height: 1.2;
      margin-bottom: 25px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .post-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      margin-bottom: 25px;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.9rem;
      color: #6c757d;
    }

    .meta-item mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .meta-item.published {
      color: #28a745;
    }

    .meta-item.draft {
      color: #ffc107;
    }

    .post-summary {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 12px;
      border-left: 4px solid var(--primary-blue, #3498db);
      margin-bottom: 0;
    }

    .post-summary p {
      font-size: 1.1rem;
      line-height: 1.6;
      color: #6c757d;
      margin: 0;
      font-style: italic;
    }

    /* Featured Image */
    .featured-image {
      max-height: 500px;
      overflow: hidden;
      margin-bottom: 0;
    }

    .featured-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    /* Post Content */
    .post-content {
      padding: 40px;
    }

    .content-html {
      font-size: 1.1rem;
      line-height: 1.8;
      color: #333;
    }

    .content-html h1,
    .content-html h2,
    .content-html h3,
    .content-html h4,
    .content-html h5,
    .content-html h6 {
      color: var(--dark-blue, #2c3e50);
      margin-top: 2em;
      margin-bottom: 1em;
      font-weight: 600;
    }

    .content-html h1 { font-size: 2rem; }
    .content-html h2 { font-size: 1.75rem; }
    .content-html h3 { font-size: 1.5rem; }
    .content-html h4 { font-size: 1.25rem; }

    .content-html p {
      margin-bottom: 1.5em;
    }

    .content-html img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 20px 0;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }

    .content-html blockquote {
      border-left: 4px solid var(--primary-blue, #3498db);
      padding-left: 20px;
      margin: 20px 0;
      font-style: italic;
      color: #6c757d;
    }

    .content-html ul,
    .content-html ol {
      padding-left: 30px;
      margin-bottom: 1.5em;
    }

    .content-html li {
      margin-bottom: 0.5em;
    }

    .content-html a {
      color: var(--primary-blue, #3498db);
      text-decoration: none;
      border-bottom: 1px solid transparent;
      transition: border-color 0.3s ease;
    }

    .content-html a:hover {
      border-bottom-color: var(--primary-blue, #3498db);
    }

    /* Post Footer */
    .post-footer {
      padding: 40px;
      border-top: 1px solid #eee;
      background: #f8f9fa;
    }

    .share-buttons {
      margin-bottom: 30px;
    }

    .share-buttons h4 {
      color: var(--dark-blue, #2c3e50);
      margin-bottom: 15px;
      font-size: 1.1rem;
    }

    .social-buttons {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
    }

    .social-buttons button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .navigation-buttons {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 15px;
    }

    .navigation-buttons button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    /* Error State */
    .error-state {
      text-align: center;
      padding: 80px 20px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }

    .error-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #dc3545;
      margin-bottom: 20px;
    }

    .error-state h3 {
      color: var(--dark-blue, #2c3e50);
      margin-bottom: 10px;
    }

    .error-state p {
      color: #6c757d;
      margin-bottom: 30px;
      line-height: 1.6;
    }

    .error-state button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .post-detail-page {
        padding: 10px 0;
      }

      .container {
        padding: 0 15px;
      }

      .post-header {
        padding: 30px 20px;
      }

      .post-title {
        font-size: 2rem;
      }

      .post-content {
        padding: 30px 20px;
      }

      .post-footer {
        padding: 30px 20px;
      }

      .meta-item {
        font-size: 0.8rem;
      }

      .breadcrumb {
        flex-wrap: wrap;
        font-size: 0.8rem;
      }

      .navigation-buttons {
        flex-direction: column;
        align-items: stretch;
      }

      .social-buttons {
        flex-direction: column;
      }
    }
  `]
})
export class PostDetailComponent implements OnInit {
  post$: Observable<Post>;
  isLoading = true;
  post: Post | null = null;
  hasError = false;
  currentUser$: Observable<Admin | null>;

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService,
    private authService: AuthService
  ) {
    this.post$ = this.route.params.pipe(
      switchMap(params => {
        const id = parseInt(params['id']);
        return this.dataService.getPost(id);
      })
    );
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = parseInt(params['id']);

      if (id) {
        this.isLoading = true;
        this.hasError = false;
        this.post = null;

        this.dataService.getPost(id).subscribe({
          next: (post) => {
            this.isLoading = false;
            this.post = post;
            this.hasError = false;
            // Increment view count
            this.dataService.incrementPostViews(id).subscribe({
              next: () => console.log('View count incremented'),
              error: (error) => console.error('Error incrementing views:', error)
            });
          },
          error: (error) => {
            this.isLoading = false;
            this.hasError = true;
            this.post = null;
          }
        });
      } else {
        this.isLoading = false;
        this.hasError = true;
        this.post = null;
      }
    });
  }

  onImageError(event: any): void {
    event.target.src = 'assets/images/placeholder-post.jpg';
  }

  shareOnFacebook(post: Post): void {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(post.title);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank');
  }

  copyLink(): void {
    navigator.clipboard.writeText(window.location.href).then(() => {
      // You could show a snackbar here
    });
  }
}
