import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';
import { DataService } from '../../services/data.service';
import { Post, Category } from '../../models/models';

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
      <!-- Hero Section -->
      <section class="hero primary-bg">
        <div class="container hero-content">
          <div class="hero-text">
            <h1>Thiết Kế Nhà Hiện Đại</h1>
            <p>Chuyên thiết kế và thi công những ngôi nhà hiện đại, sang trọng với phong cách kiến trúc độc đáo. 
               Mang đến cho bạn không gian sống hoàn hảo nhất.</p>
            <div class="hero-buttons">
              <button mat-raised-button class="btn-primary">
                Khám Phá Thiết Kế
              </button>
              <button mat-stroked-button class="btn-outline">
                Liên Hệ Tư Vấn
              </button>
            </div>
          </div>
          <div class="hero-image">
            <img src="assets/images/hero-house.svg" 
                 alt="Modern House Design">
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="features-section">
        <div class="container">
          <h2 class="section-title text-center">Tại Sao Chọn Chúng Tôi?</h2>
          <div class="features-grid">
            <div class="feature-card">
              <mat-icon class="feature-icon">architecture</mat-icon>
              <h3>Thiết Kế Độc Đáo</h3>
              <p>Mỗi công trình đều được thiết kế riêng biệt, phù hợp với nhu cầu và phong cách sống của gia đình bạn.</p>
            </div>
            <div class="feature-card">
              <mat-icon class="feature-icon">engineering</mat-icon>
              <h3>Thi Công Chuyên Nghiệp</h3>
              <p>Đội ngũ kỹ sư và thợ xây giàu kinh nghiệm, cam kết chất lượng và tiến độ công trình.</p>
            </div>
            <div class="feature-card">
              <mat-icon class="feature-icon">support_agent</mat-icon>
              <h3>Hỗ Trợ 24/7</h3>
              <p>Tư vấn và hỗ trợ khách hàng 24/7 từ khâu thiết kế đến hoàn thiện và bảo hành.</p>
            </div>
            <div class="feature-card">
              <mat-icon class="feature-icon">verified</mat-icon>
              <h3>Bảo Hành Dài Hạn</h3>
              <p>Cam kết bảo hành dài hạn cho tất cả các hạng mục công trình, đảm bảo chất lượng lâu bền.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Latest Posts Section -->
      <section class="latest-posts gray-blue-bg">
        <div class="container">
          <h2 class="section-title text-center">Tin Tức & Dự Án Mới Nhất</h2>

          <!-- Loading State -->
          <div class="loading-state" *ngIf="isLoadingPosts">
            <div class="loading-spinner"></div>
            <p>Đang tải bài viết...</p>
          </div>

          <!-- Posts Grid -->
          <div class="posts-grid" *ngIf="latestPosts$ | async as posts; else noPostsTemplate">
            <mat-card class="post-card" *ngFor="let post of posts.slice(0, 6)" [routerLink]="'/post/' + post.id">
              <div class="post-image">
                <img [src]="post.image_url || 'assets/images/placeholder-post.jpg'"
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
                  <div class="meta-item status" [class.published]="post.published" [class.draft]="!post.published">
                    <mat-icon>{{ post.published ? 'visibility' : 'visibility_off' }}</mat-icon>
                    <span>{{ post.published ? 'Đã xuất bản' : 'Bản nháp' }}</span>
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
              <h3>Chưa có bài viết nào</h3>
              <p>Hiện tại chưa có bài viết nào được xuất bản. Hãy quay lại sau nhé!</p>
            </div>
          </ng-template>

          <div class="text-center mt-4" *ngIf="(latestPosts$ | async)?.length">
            <button mat-raised-button
                    routerLink="/category/tin-tuc"
                    class="btn-primary view-all-btn">
              <mat-icon>view_list</mat-icon>
              Xem Tất Cả Tin Tức
            </button>
          </div>
        </div>
      </section>

      <!-- Categories Section -->
      <section class="categories-section">
        <div class="container">
          <h2 class="section-title text-center">Khám Phá Danh Mục</h2>
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
    .home-page {
      min-height: 100vh;
    }
    
    /* Hero Section */
    .hero {
      padding: 80px 0;
      min-height: 60vh;
      display: flex;
      align-items: center;
    }
    
    .hero-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      align-items: center;
    }
    
    .hero-text h1 {
      font-size: 3rem;
      font-weight: 700;
      margin-bottom: 20px;
      color: white;
    }
    
    .hero-text p {
      font-size: 1.2rem;
      line-height: 1.6;
      margin-bottom: 30px;
      color: rgba(255, 255, 255, 0.9);
    }
    
    .hero-buttons {
      display: flex;
      gap: 20px;
    }
    
    .btn-outline {
      border: 2px solid white !important;
      color: white !important;
    }
    
    .hero-image img {
      width: 100%;
      height: auto;
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    }
    
    /* Features Section */
    .features-section {
      padding: 80px 0;
    }
    
    .section-title {
      font-size: 2.5rem;
      margin-bottom: 50px;
      color: var(--dark-blue);
    }
    
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 30px;
    }
    
    .feature-card {
      text-align: center;
      padding: 30px 20px;
      border-radius: 12px;
      background: white;
      box-shadow: 0 4px 15px var(--shadow);
      transition: transform 0.3s ease;
    }
    
    .feature-card:hover {
      transform: translateY(-5px);
    }
    
    .feature-icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
      color: var(--brown);
      margin-bottom: 20px;
    }
    
    .feature-card h3 {
      color: var(--dark-blue);
      margin-bottom: 15px;
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
      background: var(--primary-blue, #3498db);
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
      background: var(--primary-blue, #3498db) !important;
      color: white !important;
      padding: 12px 24px;
      border-radius: 50px;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .view-all-btn:hover {
      background: #2980b9 !important;
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
      color: var(--primary-blue);
    }
    
    .category-card h3 {
      color: var(--dark-blue);
      margin-bottom: 10px;
    }
    
    /* Responsive Design */
    @media (max-width: 768px) {
      .latest-posts {
        padding: 40px 0;
      }

      .hero-content {
        grid-template-columns: 1fr;
        text-align: center;
      }

      .hero-text h1 {
        font-size: 2.2rem;
      }

      .hero-buttons {
        justify-content: center;
        flex-wrap: wrap;
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
  isLoadingPosts = true;
  isLoadingCategories = true;

  constructor(private dataService: DataService) {
    this.latestPosts$ = this.dataService.getPosts();
    this.categories$ = this.dataService.getCategories();
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
    event.target.src = 'assets/images/placeholder-post.jpg';
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
