import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { SeoService } from '../../services/seo.service';
import { environment } from '../../../environments/environment';
import { Post } from '../../models/models';
import { SkeletonImageDirective } from '../../directives/skeleton-image.directive';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, RouterModule, SkeletonImageDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="post-detail-page">
      <div class="container">
        <!-- Breadcrumb -->
        <nav class="breadcrumb" *ngIf="post && !isLoading" aria-label="Đường dẫn">
          <a routerLink="/">Trang chủ</a>
          <mat-icon>chevron_right</mat-icon>
          <a [routerLink]="'/category/' + post.category.slug" *ngIf="post.category">
            {{ post.category.name }}
          </a>
        </nav>

        <!-- Loading State -->
        <div class="loading-state" *ngIf="isLoading" aria-live="polite" aria-busy="true">
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
            <img [src]="post.image_url" [appSkeleton]="post.image_url" [alt]="post.title" fetchpriority="high">
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
                <button type="button" mat-raised-button color="primary" (click)="shareOnFacebook(post)">
                  <mat-icon>share</mat-icon>
                  Facebook
                </button>
                <button type="button" mat-stroked-button (click)="copyLink()">
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
              <div class="related-post-card" *ngFor="let relatedPost of relatedPosts; trackBy: trackByPostId" [routerLink]="'/post/' + (relatedPost.slug || relatedPost.id)">
                <div class="related-post-image">
                  <img [src]="relatedPost.image_url"
                       [appSkeleton]="relatedPost.image_url"
                       [alt]="relatedPost.title"
                       loading="lazy"
                       decoding="async">
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
            <mat-card class="suggestion-card" *ngFor="let suggested of suggestedPosts; trackBy: trackByPostId" [routerLink]="'/post/' + (suggested.slug || suggested.id)">
              <div class="suggestion-image">
                <img [src]="suggested.image_url"
                     [appSkeleton]="suggested.image_url"
                     [alt]="suggested.title"
                     loading="lazy"
                     decoding="async">
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
      border-top: 4px solid var(--brand, #e09543);
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
      border-left: 4px solid var(--brand, #e09543);
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
      color: #1a1a1a;
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
      border-bottom: 2px solid var(--brand, #e09543);
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
      color: #6B6B6B;
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
      border-bottom: 2px solid var(--brand, #e09543);
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
      color: #6B6B6B;
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
export class PostDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly dataService = inject(DataService);
  private readonly authService = inject(AuthService);
  private readonly seo = inject(SeoService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly currentUser$ = this.authService.currentUser$;

  post: Post | null = null;
  isLoading = true;
  hasError = false;

  relatedPosts: Post[] = [];
  suggestedPosts: Post[] = [];

  trackByPostId(_index: number, post: Post): number {
    return post.id;
  }

  ngOnInit(): void {
    this.route.params
      .pipe(
        switchMap(params => {
          const slugOrId = params['slug'];
          this.isLoading = true;
          this.hasError = false;
          this.post = null;
          this.relatedPosts = [];
          this.suggestedPosts = [];
          this.cdr.markForCheck();

          if (!slugOrId) {
            return of(null);
          }

          // Route nhận cả slug lẫn id để link cũ không chết.
          const numericId = Number(slugOrId);
          const isNumeric = Number.isInteger(numericId) && String(numericId) === slugOrId;

          return (isNumeric
            ? this.dataService.getPost(numericId)
            : this.dataService.getPostBySlug(slugOrId)
          ).pipe(catchError(() => of(null)));
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(post => {
        this.isLoading = false;

        if (!post) {
          this.hasError = true;
          this.seo.update({
            title: 'Không tìm thấy bài viết',
            description: 'Bài viết không tồn tại hoặc đã bị xoá.',
            noindex: true
          });
          this.cdr.markForCheck();
          return;
        }

        this.post = post;
        this.applySeo(post);
        this.loadRelated(post);
        this.countView(post);
        this.cdr.markForCheck();
      });
  }

  /**
   * Đưa dữ liệu SEO mà biên tập viên đã nhập ra thẻ meta thật.
   *
   * Trước đây model đã có meta_title/meta_description/og_image_url và admin có cả
   * màn hình xem trước, nhưng không trang chi tiết nào ghi chúng ra <head> — mọi
   * bài viết dùng chung đúng một tiêu đề mặc định.
   */
  private applySeo(post: Post): void {
    this.seo.update({
      title: post.meta_title || post.title,
      description: post.meta_description || post.summary,
      keywords: post.focus_keywords,
      image: post.og_image_url || post.image_url,
      path: `/post/${post.slug || post.id}`,
      type: 'article',
      publishedAt: post.created_at,
      modifiedAt: post.updated_at
    });

    this.seo.setStructuredData('article', {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.meta_description || post.summary || '',
      image: post.og_image_url || post.image_url || undefined,
      datePublished: post.created_at,
      dateModified: post.updated_at || post.created_at,
      articleSection: post.category?.name,
      inLanguage: 'vi-VN',
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${environment.baseUrl}/post/${post.slug || post.id}`
      },
      publisher: {
        '@type': 'Organization',
        name: environment.siteName
      }
    });

    const trail: Array<{ name: string; path?: string }> = [{ name: 'Trang chủ', path: '/' }];
    if (post.category) {
      trail.push({ name: post.category.name, path: `/category/${post.category.slug}` });
    }
    trail.push({ name: post.title, path: `/post/${post.slug || post.id}` });
    this.seo.setBreadcrumb(trail);
  }

  /**
   * Chỉ lấy bài cùng danh mục qua `?category=`.
   * Trước đây gọi getPosts() không tham số — kéo toàn bộ CSDL về chỉ để lấy 7 bản ghi.
   */
  private loadRelated(post: Post): void {
    if (!post.category_id) {
      return;
    }

    this.dataService.getRelatedPosts(post.category_id, post.id)
      .pipe(catchError(() => of([] as Post[])), takeUntilDestroyed(this.destroyRef))
      .subscribe(posts => {
        this.relatedPosts = posts.slice(0, 3);
        this.suggestedPosts = posts.slice(3, 7);
        this.cdr.markForCheck();
      });
  }

  /** Không tính lượt xem cho phiên quản trị. */
  private countView(post: Post): void {
    if (this.authService.getToken()) {
      return;
    }

    this.dataService.incrementPostView(post.id)
      .pipe(catchError(() => of(null)), takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result !== null && this.post) {
          this.post = { ...this.post, views: (this.post.views || 0) + 1 };
          this.cdr.markForCheck();
        }
      });
  }

  shareOnFacebook(post: Post): void {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(post.title);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank', 'noopener');
  }

  async copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(window.location.href);
      this.snackBar.open('Đã sao chép liên kết', 'Đóng', { duration: 2500 });
    } catch {
      this.snackBar.open('Không sao chép được. Hãy copy từ thanh địa chỉ.', 'Đóng', { duration: 4000 });
    }
  }
}
