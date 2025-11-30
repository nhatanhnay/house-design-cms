import { Component, OnInit, AfterViewChecked } from '@angular/core';
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
        <!-- Breadcrumb -->
        <div class="breadcrumb" *ngIf="post && !isLoading">
          <a routerLink="/">Trang chủ</a>
          <mat-icon>chevron_right</mat-icon>
          <a [routerLink]="'/category/' + post.category.slug" *ngIf="post.category">
            {{ post.category.name }}
          </a>
        </div>

        <!-- Loading State -->
        <div class="loading-state" *ngIf="isLoading">
          <div class="loading-spinner"></div>
          <p>Đang tải bài viết...</p>
        </div>

        <!-- Two Column Layout -->
        <div class="two-column-layout" *ngIf="post && !isLoading && !hasError">
          <!-- Main Content (Left) -->
          <article class="post-article">
          <!-- Post Header -->
          <header class="post-header">
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

        <!-- Sidebar (Right) -->
        <aside class="sidebar">
          <div class="sidebar-section">
            <h3>Có thể bạn quan tâm</h3>
            <div class="related-posts">
              <div class="related-post-card" *ngFor="let relatedPost of relatedPosts" [routerLink]="'/post/' + (relatedPost.slug || relatedPost.id)">
                <div class="related-post-image">
                  <img [src]="relatedPost.image_url || 'assets/images/placeholder-post.jpg'"
                       [alt]="relatedPost.title"
                       (error)="onImageError($event)">
                </div>
                <div class="related-post-info">
                  <h4>{{ relatedPost.title }}</h4>
                  <div class="related-post-meta">
                    <mat-icon>event</mat-icon>
                    <span>{{ relatedPost.created_at | date:'dd/MM/yyyy' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <!-- Bottom Suggestions -->
      <div class="bottom-suggestions" *ngIf="suggestedPosts && suggestedPosts.length > 0">
        <div class="container">
          <h3>Các mẫu nhà đẹp</h3>
          <div class="suggestions-grid">
            <mat-card class="suggestion-card" *ngFor="let suggested of suggestedPosts" [routerLink]="'/post/' + (suggested.slug || suggested.id)">
              <div class="suggestion-image">
                <img [src]="suggested.image_url || 'assets/images/placeholder-post.jpg'"
                     [alt]="suggested.title"
                     (error)="onImageError($event)">
              </div>
              <mat-card-content>
                <h4>{{ suggested.title }}</h4>
                <div class="suggestion-meta">
                  <mat-icon>event</mat-icon>
                  <span>{{ suggested.created_at | date:'dd/MM/yyyy' }}</span>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </div>
      </div>

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
  `,
  styles: [`
    .post-detail-page {
      padding: 20px 0;
      min-height: 100vh;
      background: #2a2a2a; /* Nền xám đen */
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    /* Top Breadcrumb */
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 20px;
      font-size: 0.9rem;
    }

    .breadcrumb a {
      color: rgba(255, 255, 255, 0.7); /* Chữ trắng mờ */
      text-decoration: none;
      transition: color 0.3s;
    }

    .breadcrumb a:hover {
      color: var(--accent-copper, #e09543); /* Hover màu copper */
    }

    .breadcrumb mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: rgba(255, 255, 255, 0.5); /* Icon trắng mờ */
    }

    /* Two Column Layout */
    .two-column-layout {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 30px;
      margin-bottom: 40px;
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
      background: #f5f5f5; /* Nền xám nhạt thay vì trắng */
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      margin-bottom: 30px;
    }

    /* Post Header */
    .post-header {
      padding: 30px;
      border-bottom: 1px solid #e0e0e0;
    }

    .post-title {
      font-size: 1.8rem;
      font-weight: 700;
      color: #1a1a1a; /* Chữ đen đậm */
      line-height: 1.3;
      margin-bottom: 15px;
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
      color: #666; /* Text xám đậm để dễ đọc */
    }

    .meta-item mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #888;
    }

    .meta-item.published {
      color: #059669; /* Green đậm hơn */
    }

    .meta-item.draft {
      color: #d97706; /* Orange đậm hơn */
    }

    .post-summary {
      background: #fff9e6; /* Nền vàng nhạt */
      padding: 20px;
      border-radius: 12px;
      border-left: 4px solid var(--accent-copper, #e09543);
      margin-bottom: 0;
    }

    .post-summary p {
      font-size: 1.1rem;
      line-height: 1.6;
      color: #333; /* Text đen cho dễ đọc */
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
      width: 100%;
      box-sizing: border-box;
      background: white; /* Nền trắng cho content */
    }

    .content-html {
      font-size: 1.1rem;
      line-height: 1.8;
      color: #333; /* Text xám đậm dễ đọc */
      width: 100%;
      box-sizing: border-box;
      overflow: hidden;
    }

    .content-html h1,
    .content-html h2,
    .content-html h3,
    .content-html h4,
    .content-html h5,
    .content-html h6 {
      color: #1a1a1a; /* Headings đen đậm */
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

    ::ng-deep .content-html figure {
      max-width: 100% !important;
      width: 100% !important;
      height: auto !important;
      margin: 20px 0 !important;
      display: block !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
    }

    ::ng-deep .content-html img {
      max-width: 100% !important;
      width: 100% !important;
      height: auto !important;
      display: block !important;
      border-radius: 8px;
      margin: 0 !important;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }

    .content-html blockquote {
      border-left: 4px solid var(--primary-blue, #3498db);
      padding-left: 20px;
      margin: 20px 0;
      font-style: italic;
      color: #555; /* Màu xám đậm hơn */
      background: #f9f9f9;
      padding: 15px 20px;
      border-radius: 4px;
    }

    .content-html ul,
    .content-html ol {
      padding-left: 30px;
      margin-bottom: 1.5em;
      color: #333;
    }

    .content-html li {
      margin-bottom: 0.5em;
      color: #333;
    }

    .content-html a {
      color: #e09543; /* Copper color */
      text-decoration: none;
      border-bottom: 1px solid transparent;
      transition: border-color 0.3s ease;
      font-weight: 500;
    }

    .content-html a:hover {
      border-bottom-color: #e09543;
    }

    /* Post Footer */
    .post-footer {
      padding: 40px;
      border-top: 1px solid #e0e0e0;
      background: #f8f9fa;
    }

    .share-buttons {
      margin-bottom: 30px;
    }

    .share-buttons h4 {
      color: #1a1a1a; /* Đen đậm */
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

    /* Sidebar */
    .sidebar {
      position: sticky;
      top: 20px;
      height: fit-content;
    }

    .sidebar-section {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .sidebar-section h3 {
      font-size: 1.2rem;
      font-weight: 700;
      color: #333;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #3498db;
    }

    .related-posts {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .related-post-card {
      display: flex;
      gap: 12px;
      cursor: pointer;
      transition: transform 0.2s;
      padding: 10px;
      border-radius: 8px;
    }

    .related-post-card:hover {
      transform: translateX(5px);
      background: #f8f9fa;
    }

    .related-post-image {
      width: 80px;
      height: 80px;
      flex-shrink: 0;
      border-radius: 8px;
      overflow: hidden;
    }

    .related-post-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .related-post-info {
      flex: 1;
    }

    .related-post-info h4 {
      font-size: 0.9rem;
      font-weight: 600;
      color: #333;
      margin: 0 0 8px 0;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .related-post-meta {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      color: #999;
    }

    .related-post-meta mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    /* Bottom Suggestions */
    .bottom-suggestions {
      background: white;
      padding: 40px 0;
      margin-top: 40px;
    }

    .bottom-suggestions .container h3 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #333;
      margin-bottom: 30px;
      padding-bottom: 15px;
      border-bottom: 2px solid #3498db;
    }

    .suggestions-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
    }

    .suggestion-card {
      cursor: pointer;
      transition: transform 0.3s, box-shadow 0.3s;
      border-radius: 12px;
      overflow: hidden;
    }

    .suggestion-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    }

    .suggestion-image {
      width: 100%;
      height: 180px;
      overflow: hidden;
    }

    .suggestion-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s;
    }

    .suggestion-card:hover .suggestion-image img {
      transform: scale(1.1);
    }

    .suggestion-card mat-card-content {
      padding: 15px;
    }

    .suggestion-card h4 {
      font-size: 1rem;
      font-weight: 600;
      color: #333;
      margin: 0 0 10px 0;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .suggestion-meta {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8rem;
      color: #999;
    }

    .suggestion-meta mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .two-column-layout {
        grid-template-columns: 1fr;
      }

      .sidebar {
        position: static;
        order: 2;
      }

      .suggestions-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .post-detail-page {
        padding: 10px 0;
      }

      .container {
        padding: 0 15px;
      }

      .post-header {
        padding: 20px;
      }

      .post-title {
        font-size: 1.5rem;
      }

      .post-content {
        padding: 20px;
      }

      .post-footer {
        padding: 20px;
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

      .suggestions-grid {
        grid-template-columns: 1fr;
      }

      .bottom-suggestions {
        padding: 20px 0;
      }
    }
  `]
})
export class PostDetailComponent implements OnInit, AfterViewChecked {
  post$: Observable<Post>;
  isLoading = true;
  post: Post | null = null;
  hasError = false;
  currentUser$: Observable<Admin | null>;
  relatedPosts: Post[] = [];
  suggestedPosts: Post[] = [];
  private imagesProcessed = false;

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
      const slugOrId = params['slug'];

      if (slugOrId) {
        this.isLoading = true;
        this.hasError = false;
        this.post = null;

        // Try to parse as ID first (if it's a number, use old method)
        const numericId = parseInt(slugOrId);
        const isNumeric = !isNaN(numericId) && slugOrId === numericId.toString();

        const postObservable = isNumeric
          ? this.dataService.getPost(numericId)
          : this.dataService.getPostBySlug(slugOrId);

        postObservable.subscribe({
          next: (post) => {
            console.log('🔍 Post loaded:', post.id, post.title, 'Initial views:', post.views);
            this.isLoading = false;
            this.post = post;
            this.hasError = false;
            this.imagesProcessed = false; // Reset flag for new post

            // Load related posts from the same category
            if (post.category_id) {
              this.loadRelatedPosts(post.category_id, post.id);
            }

            // Increment view count (only if not logged in as admin)
            const hasToken = this.authService.getToken();
            console.log('🔐 Auth check - Has token:', !!hasToken);

            if (!hasToken) {
              console.log('🚀 Calling incrementPostView for post ID:', post.id);
              this.dataService.incrementPostView(post.id).subscribe({
                next: (response) => {
                  console.log('✅ Post view count incremented for post ID:', post.id, 'Response:', response);
                  // Increment the local view count for immediate UI update
                  if (this.post) {
                    this.post.views = (this.post.views || 0) + 1;
                    console.log('📊 Updated post views to:', this.post.views);
                  }
                },
                error: (error) => {
                  console.error('❌ Error incrementing post views:', error);
                  console.error('Error details:', {
                    message: error.message,
                    status: error.status,
                    statusText: error.statusText,
                    url: error.url
                  });
                }
              });
            } else {
              console.log('⏭️ Skipping view increment - User is logged in as admin');
            }
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

  ngAfterViewChecked(): void {
    if (this.post && !this.imagesProcessed) {
      this.removeImageDimensions();
      this.imagesProcessed = true;
    }
  }

  private removeImageDimensions(): void {
    // Remove width and height attributes from all images and figures in content
    const contentImages = document.querySelectorAll('.content-html img');
    contentImages.forEach((img: Element) => {
      img.removeAttribute('width');
      img.removeAttribute('height');
    });

    const contentFigures = document.querySelectorAll('.content-html figure');
    contentFigures.forEach((figure: Element) => {
      figure.removeAttribute('width');
      figure.removeAttribute('height');
      (figure as HTMLElement).style.width = '';
      (figure as HTMLElement).style.height = '';
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

  loadRelatedPosts(categoryId: number, currentPostId: number): void {
    this.dataService.getPosts().subscribe({
      next: (posts) => {
        // Filter posts from the same category, exclude current post
        const sameCategoryPosts = posts.filter(p =>
          p.category_id === categoryId &&
          p.id !== currentPostId &&
          p.published
        );

        // Take 3 for sidebar, 4 for bottom (different sets)
        this.relatedPosts = sameCategoryPosts.slice(0, 3);
        this.suggestedPosts = sameCategoryPosts.slice(3, 7);

        // If not enough posts, fill with other published posts
        if (this.suggestedPosts.length < 4) {
          const otherPosts = posts.filter(p =>
            p.id !== currentPostId &&
            p.published &&
            !this.relatedPosts.some(rp => rp.id === p.id) &&
            !this.suggestedPosts.some(sp => sp.id === p.id)
          );
          this.suggestedPosts = [...this.suggestedPosts, ...otherPosts].slice(0, 4);
        }
      },
      error: (error) => {
        console.error('Error loading related posts:', error);
      }
    });
  }
}
