import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { Post, Category, Admin } from '../../models/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="home-page">
      <!-- Hero Section with Carousel -->
      <section class="hero-carousel">
        <div class="carousel-container">
          <div class="carousel-slide active">
            <div class="hero-image-bg"></div>
            <div class="hero-overlay">
              <div class="container">
                <div class="hero-content">
                  <h1>MMA Architectural Design</h1>
                  <p>Chuyên thiết kế và thi công biệt thự, nhà ở hiện đại với phong cách kiến trúc độc đáo</p>
                  <div class="hero-stats">
                    <div class="stat-item">
                      <div class="stat-number">37</div>
                      <div class="stat-label">Tỉnh Thành Phủ Sóng</div>
                    </div>
                    <div class="stat-item">
                      <div class="stat-number">500+</div>
                      <div class="stat-label">Dự Án Biệt Thự/Nhà Ở Chuyên Nghiệp</div>
                    </div>
                  </div>
                  <div class="hero-buttons">
                    <button mat-raised-button class="btn-primary">
                      Khám Phá Dự Án
                    </button>
                    <button mat-stroked-button class="btn-outline">
                      Liên Hệ Tư Vấn
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Main Categories Section -->
      <section class="main-categories">
        <div class="container">
          <h2 class="section-title text-center">Danh Mục Thiết Kế Chính</h2>
          <div class="categories-grid">
            <div class="category-item" routerLink="/category/nha-pho-hien-dai">
              <div class="category-image-placeholder"></div>
              <div class="category-content">
                <h3>Nhà Phố Hiện Đại</h3>
                <p>Thiết kế nhà phố đô thị với phong cách hiện đại, tối ưu không gian</p>
              </div>
            </div>
            <div class="category-item" routerLink="/category/biet-thu-hien-dai">
              <div class="category-image-placeholder"></div>
              <div class="category-content">
                <h3>Biệt Thự Hiện Đại</h3>
                <p>Biệt thự sang trọng với kiến trúc hiện đại và tiện nghi đầy đủ</p>
              </div>
            </div>
            <div class="category-item" routerLink="/category/van-phong">
              <div class="category-image-placeholder"></div>
              <div class="category-content">
                <h3>Không Gian Văn Phòng</h3>
                <p>Thiết kế văn phòng chuyên nghiệp, tạo môi trường làm việc tối ưu</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="features-section">
        <div class="container">
          <h2 class="section-title text-center">Ưu Thế MMA Architectural Design</h2>
          <div class="features-grid">
            <div class="feature-card">
              <mat-icon class="feature-icon">architecture</mat-icon>
              <h3>Thiết Kế Kiến Trúc Độc Đáo</h3>
              <p>Chuyên gia kiến trúc sư với hơn 10 năm kinh nghiệm, tạo ra những công trình biệt thự và nhà ở đẳng cấp.</p>
            </div>
            <div class="feature-card">
              <mat-icon class="feature-icon">engineering</mat-icon>
              <h3>Thi Công Chất Lượng Cao</h3>
              <p>Đội ngũ kỹ sư và công nhân tay nghề cao, sử dụng công nghệ hiện đại trong thi công.</p>
            </div>
            <div class="feature-card">
              <mat-icon class="feature-icon">business</mat-icon>
              <h3>Dịch Vụ Toàn Diện</h3>
              <p>Từ thiết kế kiến trúc, nội thất đến giám sát thi công và bàn giao hoàn thiện.</p>
            </div>
            <div class="feature-card">
              <mat-icon class="feature-icon">verified</mat-icon>
              <h3>Uy Tín 37 Tỉnh Thành</h3>
              <p>Đã hoàn thành hơn 500 dự án biệt thự và nhà ở trên toàn quốc, được khách hàng tin tưởng.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Latest Posts Section -->
      <section class="latest-posts gray-blue-bg">
        <div class="container">
          <h2 class="section-title text-center">Dự Án & Tin Tức Kiến Trúc</h2>

          <!-- Loading State -->
          <div class="loading-state" *ngIf="isLoadingPosts">
            <div class="loading-spinner"></div>
            <p>Đang tải bài viết...</p>
          </div>

          <!-- Posts Grid -->
          <div class="posts-grid" *ngIf="latestPosts$ | async as posts; else noPostsTemplate">
            <mat-card class="post-card" *ngFor="let post of posts.slice(0, 6)" [routerLink]="'/post/' + post.id">
              <div class="post-image">
                <div class="post-image-placeholder" *ngIf="!post.image_url"></div>
                <img *ngIf="post.image_url" [src]="post.image_url"
                     [alt]="post.title"
                     (error)="onImageError($event)">
                <div class="post-overlay">
                  <div class="post-category" *ngIf="post.category">{{ post.category.name }}</div>
                </div>
              </div>
              <mat-card-content class="post-content">
                <h3 class="post-title">{{ post.title }}</h3>
                <p class="post-summary">{{ post.summary || 'Không có mô tả' }}</p>
                <div class="post-meta">
                  <div class="meta-item">
                    <mat-icon>event</mat-icon>
                    <span class="post-date">{{ post.created_at | date:'dd/MM/yyyy HH:mm' }}</span>
                  </div>
                  <div class="meta-item status" *ngIf="currentUser$ | async" [class.published]="post.published" [class.draft]="!post.published">
                    <mat-icon>{{ post.published ? 'visibility' : 'visibility_off' }}</mat-icon>
                    <span>{{ post.published ? 'Đã xuất bản' : 'Bản nháp' }}</span>
                  </div>
                  <div class="meta-item" *ngIf="!(currentUser$ | async)">
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

          <!-- No Posts Template -->
          <ng-template #noPostsTemplate>
            <div class="no-posts" *ngIf="!isLoadingPosts">
              <mat-icon class="no-posts-icon">article</mat-icon>
              <h3>Chưa có dự án nào</h3>
              <p>Hiện tại chưa có dự án kiến trúc nào được xuất bản. Hãy quay lại sau để khám phá!</p>
            </div>
          </ng-template>

          <div class="text-center mt-4" *ngIf="(latestPosts$ | async)?.length">
            <button mat-raised-button
                    routerLink="/category/tin-tuc"
                    class="btn-primary view-all-btn">
              <mat-icon>view_list</mat-icon>
              Xem Tất Cả Dự Án
            </button>
          </div>
        </div>
      </section>

      <!-- Categories Section -->
      <section class="categories-section">
        <div class="container">
          <h2 class="section-title text-center">Danh Mục Dự Án</h2>
          <div class="categories-grid" *ngIf="categories$ | async as categories">
            <div class="category-card" 
                 *ngFor="let category of categories"
                 [routerLink]="'/category/' + category.slug">
              <div class="category-icon">
                <mat-icon>{{ getCategoryIcon(category.slug) }}</mat-icon>
              </div>
              <h3>{{ category.name }}</h3>
              <p>{{ category.description }}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    :host {
      --biscons-blue: #0170B9;
      --dark-blue: #1a365d;
      --light-gray: #f8f9fa;
      --shadow-light: rgba(1, 112, 185, 0.1);
    }

    .home-page {
      min-height: 100vh;
    }

    /* Hero Carousel Section */
    .hero-carousel {
      position: relative;
      height: 70vh;
      min-height: 600px;
      overflow: hidden;
    }

    .carousel-container {
      position: relative;
      height: 100%;
    }

    .carousel-slide {
      position: relative;
      height: 100%;
      display: flex;
      align-items: center;
    }

    .hero-image-bg {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, #e0e0e0 0%, #c0c0c0 100%);
      z-index: 1;
    }

    .hero-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(1, 112, 185, 0.8) 0%, rgba(26, 54, 93, 0.9) 100%);
      z-index: 2;
      display: flex;
      align-items: center;
    }

    .hero-content {
      color: white;
      text-align: center;
      max-width: 800px;
      margin: 0 auto;
    }

    .hero-content h1 {
      font-size: 3.5rem;
      font-weight: 700;
      margin-bottom: 20px;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    }

    .hero-content p {
      font-size: 1.3rem;
      line-height: 1.6;
      margin-bottom: 40px;
      opacity: 0.95;
    }

    .hero-stats {
      display: flex;
      justify-content: center;
      gap: 60px;
      margin-bottom: 40px;
    }

    .stat-item {
      text-align: center;
    }

    .stat-number {
      font-size: 2.5rem;
      font-weight: 700;
      color: white;
      margin-bottom: 8px;
    }

    .stat-label {
      font-size: 0.9rem;
      opacity: 0.9;
      max-width: 120px;
    }

    .hero-buttons {
      display: flex;
      gap: 20px;
      justify-content: center;
    }

    .btn-primary {
      background: white !important;
      color: var(--biscons-blue) !important;
      font-weight: 600;
      padding: 12px 30px;
      border-radius: 50px;
    }

    .btn-outline {
      border: 2px solid white !important;
      color: white !important;
      font-weight: 600;
      padding: 12px 30px;
      border-radius: 50px;
    }

    /* Main Categories Section */
    .main-categories {
      padding: 80px 0;
      background: #f8f9fa;
    }

    .categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 30px;
      margin-top: 50px;
    }

    .category-item {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 25px var(--shadow-light);
      transition: all 0.3s ease;
      cursor: pointer;
      text-decoration: none;
      color: inherit;
    }

    .category-item:hover {
      transform: translateY(-8px);
      box-shadow: 0 15px 35px rgba(1, 112, 185, 0.15);
    }

    .category-image-placeholder {
      height: 240px;
      background: linear-gradient(135deg, #e0e0e0 0%, #c0c0c0 100%);
      position: relative;
    }

    .category-image-placeholder::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 60px;
      height: 60px;
      background: rgba(255, 255, 255, 0.8);
      border-radius: 50%;
    }

    .category-content {
      padding: 24px;
    }

    .category-content h3 {
      color: var(--dark-blue);
      font-size: 1.4rem;
      font-weight: 600;
      margin-bottom: 12px;
    }

    .category-content p {
      color: #6c757d;
      line-height: 1.6;
      margin: 0;
    }
    
    .section-title {
      font-size: 2.5rem;
      margin-bottom: 50px;
      color: var(--dark-blue);
      text-align: center;
    }

    /* Features Section */
    .features-section {
      padding: 80px 0;
      background: white;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 30px;
    }

    .feature-card {
      text-align: center;
      padding: 40px 24px;
      border-radius: 12px;
      background: white;
      box-shadow: 0 8px 25px var(--shadow-light);
      transition: all 0.3s ease;
      border: 1px solid #f0f0f0;
    }

    .feature-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 15px 35px rgba(1, 112, 185, 0.15);
    }

    .feature-icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
      color: var(--biscons-blue);
      margin-bottom: 24px;
    }

    .feature-card h3 {
      color: var(--dark-blue);
      margin-bottom: 16px;
      font-weight: 600;
    }

    .feature-card p {
      color: #6c757d;
      line-height: 1.6;
    }
    
    /* Latest Posts Section */
    .latest-posts {
      padding: 80px 0;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    }

    /* Loading State */
    .loading-state {
      text-align: center;
      padding: 60px 20px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
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

    .posts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 30px;
      margin-bottom: 40px;
    }

    .post-card {
      cursor: pointer;
      border-radius: 16px;
      overflow: hidden;
      transition: all 0.3s ease;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      background: white;
      border: none;
      text-decoration: none;
      color: inherit;
    }

    .post-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
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

    .post-image-placeholder {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #e0e0e0 0%, #c0c0c0 100%);
      position: relative;
    }

    .post-image-placeholder::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 50px;
      height: 50px;
      background: rgba(255, 255, 255, 0.7);
      border-radius: 50%;
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

    .post-category {
      position: absolute;
      top: 15px;
      left: 15px;
      background: var(--biscons-blue);
      color: white;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .post-content {
      padding: 24px !important;
    }

    .post-title {
      color: var(--dark-blue, #2c3e50);
      margin-bottom: 12px;
      font-size: 1.25rem;
      font-weight: 600;
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

    .meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      color: #6c757d;
    }

    .meta-item mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .meta-item.status.published {
      color: #28a745;
    }

    .meta-item.status.draft {
      color: #ffc107;
    }

    .read-more {
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: var(--biscons-blue);
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

    /* No Posts State */
    .no-posts {
      text-align: center;
      padding: 80px 20px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
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

    /* View All Button */
    .view-all-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--biscons-blue) !important;
      color: white !important;
      padding: 12px 24px;
      border-radius: 50px;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .view-all-btn:hover {
      background: #015da0 !important;
      transform: translateY(-2px);
    }
    
    /* Categories Section */
    .categories-section {
      padding: 80px 0;
    }
    
    .categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 25px;
    }
    
    .category-card {
      text-align: center;
      padding: 40px 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 15px var(--shadow);
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;
      color: inherit;
    }
    
    .category-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 25px var(--shadow);
    }
    
    .category-icon {
      margin-bottom: 20px;
    }
    
    .category-icon mat-icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
      color: var(--biscons-blue);
    }
    
    .category-card h3 {
      color: var(--dark-blue);
      margin-bottom: 10px;
    }
    
    /* Responsive Design */
    @media (max-width: 768px) {
      .hero-carousel {
        height: 60vh;
        min-height: 500px;
      }

      .hero-content h1 {
        font-size: 2.5rem;
      }

      .hero-content p {
        font-size: 1.1rem;
      }

      .hero-stats {
        flex-direction: column;
        gap: 30px;
      }

      .hero-buttons {
        flex-direction: column;
        align-items: center;
        gap: 15px;
      }

      .btn-primary,
      .btn-outline {
        width: 200px;
      }

      .main-categories {
        padding: 60px 0;
      }

      .categories-grid {
        grid-template-columns: 1fr;
        gap: 20px;
      }

      .latest-posts {
        padding: 60px 0;
      }

      .section-title {
        font-size: 2rem;
        margin-bottom: 30px;
      }

      .posts-grid {
        grid-template-columns: 1fr;
        gap: 20px;
      }

      .post-image {
        height: 200px;
      }

      .post-content {
        padding: 20px !important;
      }

      .post-meta {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .loading-state {
        padding: 40px 20px;
      }

      .no-posts {
        padding: 60px 20px;
      }

      .view-all-btn {
        padding: 10px 20px;
        font-size: 0.9rem;
      }
    }

    @media (max-width: 480px) {
      .container {
        padding: 0 15px;
      }

      .post-title {
        font-size: 1.1rem;
      }

      .post-summary {
        font-size: 0.9rem;
        -webkit-line-clamp: 2;
      }

      .loading-state {
        padding: 30px 15px;
      }

      .no-posts {
        padding: 40px 15px;
      }

      .no-posts-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
      }
    }
  `]
})
export class HomeComponent implements OnInit {
  latestPosts$: Observable<Post[]>;
  categories$: Observable<Category[]>;
  currentUser$: Observable<Admin | null>;
  isLoadingPosts = true;
  isLoadingCategories = true;

  constructor(
    private dataService: DataService,
    private authService: AuthService
  ) {
    this.latestPosts$ = this.dataService.getPosts();
    this.categories$ = this.dataService.getCategories();
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.latestPosts$.subscribe({
      next: (posts) => {
        this.isLoadingPosts = false;
        console.log('Latest posts loaded:', posts.length);
      },
      error: (error) => {
        this.isLoadingPosts = false;
        console.error('Error loading posts:', error);
      }
    });

    this.categories$.subscribe({
      next: (categories) => {
        this.isLoadingCategories = false;
        console.log('Categories loaded:', categories.length);
      },
      error: (error) => {
        this.isLoadingCategories = false;
        console.error('Error loading categories:', error);
      }
    });
  }

  onImageError(event: any): void {
    const target = event.target;
    target.style.display = 'none';

    const placeholder = target.parentElement.querySelector('.post-image-placeholder');
    if (!placeholder) {
      const placeholderDiv = document.createElement('div');
      placeholderDiv.className = 'post-image-placeholder';
      target.parentElement.appendChild(placeholderDiv);
    }
  }

  getCategoryIcon(slug: string): string {
    const iconMap: { [key: string]: string } = {
      'mau-thiet-ke': 'home',
      'tin-tuc': 'newspaper',
      'san-pham': 'inventory',
      'bao-chi': 'article'
    };
    return iconMap[slug] || 'category';
  }
}
