import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { SeoService } from '../../services/seo.service';
import { Admin, Category } from '../../models/models';
import { CardItem, byNewest, cardItemKey, toCardItem } from '../../models/card-item';
import { SkeletonImageDirective } from '../../directives/skeleton-image.directive';
import { BlueprintRevealDirective } from '../../directives/blueprint-reveal.directive';

/** Tab lọc theo danh mục con. `id === null` là "Mới nhất". */
interface SubTab {
  id: number | null;
  label: string;
}

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, RouterModule, SkeletonImageDirective, BlueprintRevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="category-page">
      <!-- Ảnh bìa + tiêu đề danh mục -->
      <div class="category-header" [class.no-thumbnail]="!categoryThumbnail">
        <!-- Không có ảnh bìa thì dùng nền chuyển sắc: ảnh mặc định 600x400 bị
             object-fit:cover kéo lên full màn hình trông rất tệ. -->
        <img *ngIf="categoryThumbnail"
             [src]="categoryThumbnail"
             [appSkeleton]="categoryThumbnail"
             [alt]="categoryName"
             class="category-thumbnail on-dark"
             fetchpriority="high">
        <div class="header-overlay">
          <div class="title-bar">
            <h1 class="category-title">{{ categoryName || 'Danh mục không tìm thấy' }}</h1>
          </div>
          <div class="description-bar" *ngIf="categoryDescription">
            <p>{{ categoryDescription }}</p>
          </div>
        </div>
      </div>

      <div class="container">
        <nav class="breadcrumb" *ngIf="breadcrumb.length > 0" aria-label="Đường dẫn">
          <span *ngFor="let item of breadcrumb; let i = index">
            <a [routerLink]="item.slug ? '/category/' + item.slug : '/'">{{ item.name }}</a>
            <mat-icon *ngIf="i < breadcrumb.length - 1" aria-hidden="true">chevron_right</mat-icon>
          </span>
        </nav>

        <!-- Danh mục con -->
        <section class="subcategories-section" *ngIf="!isLoading && allSubcategories.length > 0">
          <h2 class="section-title">Danh mục con</h2>

          <div class="subcategories-grid">
            <mat-card class="subcategory-card"
                      *ngFor="let subcat of pagedSubcategories; trackBy: trackByCategoryId"
                      [routerLink]="'/category/' + subcat.slug">
              <div class="subcategory-thumbnail">
                <img [src]="subcat.thumbnail_url"
                     [appSkeleton]="subcat.thumbnail_url"
                     [alt]="subcat.name"
                     loading="lazy"
                     decoding="async">
              </div>
              <mat-card-content>
                <h3>{{ subcat.name }}</h3>
                <p *ngIf="subcat.description">{{ subcat.description }}</p>
              </mat-card-content>
            </mat-card>
          </div>

          <div class="pagination" *ngIf="subcategoryTotalPages > 1">
            <button mat-icon-button type="button" (click)="goToSubcategoryPage(subcategoryPage - 1)"
                    [disabled]="subcategoryPage === 0" aria-label="Trang trước">
              <mat-icon aria-hidden="true">chevron_left</mat-icon>
            </button>
            <div class="page-numbers">
              <button mat-button type="button"
                      *ngFor="let page of subcategoryPages"
                      [class.active]="page === subcategoryPage"
                      [attr.aria-current]="page === subcategoryPage ? 'page' : null"
                      (click)="goToSubcategoryPage(page)">
                {{ page + 1 }}
              </button>
            </div>
            <button mat-icon-button type="button" (click)="goToSubcategoryPage(subcategoryPage + 1)"
                    [disabled]="subcategoryPage >= subcategoryTotalPages - 1" aria-label="Trang sau">
              <mat-icon aria-hidden="true">chevron_right</mat-icon>
            </button>
          </div>
        </section>

        <!-- Đang tải -->
        <div class="loading-state" *ngIf="isLoading" aria-live="polite" aria-busy="true">
          <div class="loading-spinner" aria-hidden="true"></div>
          <p>Đang tải bài viết...</p>
        </div>

        <!-- Bài viết & sản phẩm -->
        <section class="posts-section" *ngIf="!isLoading && items.length > 0">
          <h2 class="section-title">{{ categoryName }}</h2>

          <div class="subcategory-tabs" *ngIf="tabs.length > 0" role="tablist" [attr.aria-label]="categoryName">
            <button type="button"
                    class="subcategory-tab"
                    *ngFor="let tab of tabs; trackBy: trackByTabId"
                    [class.active]="activeTabId === tab.id"
                    [attr.aria-selected]="activeTabId === tab.id"
                    role="tab"
                    (click)="selectTab(tab.id)">
              <span>{{ tab.label }}</span>
            </button>
          </div>

          <div class="posts-grid">
            <mat-card class="post-card"
                      *ngFor="let item of pagedItems; let i = index; trackBy: trackByItem"
                      [routerLink]="item.route">
              <div class="post-image">
                <img [src]="item.imageUrl"
                     [appSkeleton]="item.imageUrl"
                     appBlueprint
                     [blueprintDelay]="i * 180"
                     [alt]="item.title"
                     loading="lazy"
                     decoding="async">
                <div class="post-overlay"></div>
                <span class="post-category-badge">{{ categoryName }}</span>
                <span class="item-type-badge" *ngIf="item.isProduct">Sản phẩm</span>
                <h3 class="post-title">{{ item.title }}</h3>
              </div>

              <div class="card-rule"></div>

              <mat-card-content class="post-content">
                <p class="post-summary">{{ item.summary || 'Không có mô tả' }}</p>

                <div class="post-meta">
                  <span class="post-date">{{ item.createdAt | date:'dd·MM·yyyy' }}</span>
                  <span class="post-status" *ngIf="currentUser$ | async"
                        [class.published]="item.published" [class.draft]="!item.published">
                    {{ item.published ? 'Đã xuất bản' : 'Bản nháp' }}
                  </span>
                  <span class="read-more">
                    {{ item.isProduct ? 'Xem sản phẩm' : 'Xem chi tiết' }}
                    <mat-icon aria-hidden="true">arrow_forward</mat-icon>
                  </span>
                </div>
              </mat-card-content>
            </mat-card>
          </div>

          <div class="pagination" *ngIf="itemTotalPages > 1">
            <button mat-icon-button type="button" (click)="goToItemPage(itemPage - 1)"
                    [disabled]="itemPage === 0" aria-label="Trang trước">
              <mat-icon aria-hidden="true">chevron_left</mat-icon>
            </button>
            <div class="page-numbers">
              <button mat-button type="button"
                      *ngFor="let page of itemPages"
                      [class.active]="page === itemPage"
                      [attr.aria-current]="page === itemPage ? 'page' : null"
                      (click)="goToItemPage(page)">
                {{ page + 1 }}
              </button>
            </div>
            <button mat-icon-button type="button" (click)="goToItemPage(itemPage + 1)"
                    [disabled]="itemPage >= itemTotalPages - 1" aria-label="Trang sau">
              <mat-icon aria-hidden="true">chevron_right</mat-icon>
            </button>
          </div>
        </section>

        <!-- Trống: chỉ hiện khi đã tải xong, không chồng lên spinner như trước -->
        <div class="no-posts" *ngIf="!isLoading && items.length === 0">
          <mat-icon class="no-posts-icon" aria-hidden="true">article</mat-icon>
          <h3>{{ notFound ? 'Không tìm thấy danh mục' : 'Chưa có bài viết hoặc sản phẩm nào' }}</h3>
          <p>
            {{ notFound
              ? 'Danh mục bạn tìm không tồn tại hoặc đã bị gỡ.'
              : 'Danh mục này hiện tại chưa có nội dung nào. Hãy quay lại sau nhé!' }}
          </p>
          <button mat-raised-button color="primary" routerLink="/">
            <mat-icon aria-hidden="true">home</mat-icon>
            Về trang chủ
          </button>
        </div>
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
      padding: 0px 0 40px 0;
      min-height: 100vh;
      background: #2a2a2a; /* Nền xám đen giống home */
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 60px 20px; /* Tăng padding để thoáng hơn */
    }

    /* Breadcrumb */
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 16px;
      flex-wrap: wrap;
      line-height: 1.2;
    }

    .breadcrumb span {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      line-height: 1.2;
    }

    .breadcrumb a {
      color: rgba(255, 255, 255, 0.7); /* Chữ trắng mờ cho nền tối */
      text-decoration: none;
      font-size: 0.9rem;
      transition: color 0.3s;
      line-height: 1.2;
      display: inline-block;
    }

    .breadcrumb a:hover {
      color: var(--accent-copper, #e09543); /* Hover màu copper */
    }

    .breadcrumb mat-icon {
      font-size: 16px !important;
      width: 16px !important;
      height: 16px !important;
      color: rgba(255, 255, 255, 0.5); /* Icon trắng mờ */
      display: inline-block !important;
      vertical-align: middle;
      margin: 0 2px;
    }

    /* Category Header */
    .category-header {
      position: relative;
      width: 100%;
      height: calc(100vh - 64px);
      margin-bottom: 40px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }

    .category-thumbnail {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
    }

    .category-header.no-thumbnail {
      background:
        radial-gradient(circle at 30% 20%, rgba(224, 149, 67, 0.18) 0%, transparent 55%),
        linear-gradient(135deg, #3a3a3a 0%, #262626 100%);
      height: 40vh;
      min-height: 280px;
    }

    .header-overlay {
      position: absolute;
      top: 80px;
      left: 0;
      width: 100%;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: flex-start;
      padding: 0;
      pointer-events: none;
    }

    .title-bar {
      /* Trước là rgba(102,126,234,.95) — tím xanh, không thuộc bảng màu thương hiệu */
      background: rgba(58, 58, 58, 0.92);
      border-left: 4px solid var(--accent-copper, #e09543);
      padding: 30px 60px;
      margin-bottom: 20px;
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      border-radius: 0 8px 8px 0;
      width: auto;
      max-width: 70%;
    }

    .category-title {
      font-size: 64px;
      font-weight: 900;
      color: white;
      margin: 0;
      font-family: 'UVF BankGothic Md BT', sans-serif;
      letter-spacing: 3px;
      text-transform: uppercase;
      text-shadow: 2px 4px 8px rgba(0, 0, 0, 0.3);
      line-height: 1.2;
    }

    .description-bar {
      background: rgba(255, 255, 255, 0.95);
      padding: 20px 40px;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      border-radius: 0 8px 8px 0;
      max-width: 600px;
      width: auto;
    }

    .description-bar p {
      font-size: 1.1rem;
      color: #333;
      line-height: 1.6;
      margin: 0;
    }

    .posts-count {
      display: inline-block;
      padding: 8px 16px;
      background: var(--brand, #e09543);
      color: white;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 500;
    }

    /* Loading State */
    .loading-state {
      text-align: center;
      padding: 60px 20px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      color: white;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(255, 255, 255, 0.1);
      border-top: 4px solid var(--accent-copper, #e09543);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Section Titles */
    .section-title {
      font-size: 1.8rem;
      margin: 30px 0 20px 0;
      color: white; /* Chữ trắng cho nền tối */
      font-weight: 600;
      padding-bottom: 10px;
      border-bottom: 3px solid var(--accent-copper, #e09543);
    }

    /* Subcategories Section */
    .subcategories-section {
      margin-bottom: 50px;
      padding: 20px 0;
    }

    /* Lưới co giãn thay cho repeat(3, 360px): cỡ cứng cần 1140px nên ở viewport
       1025-1180px (media query 1024px chưa kích hoạt) nó tràn ra ngoài container. */
    .subcategories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 30px;
      margin-top: 20px;
      margin-bottom: 20px;
    }

    .subcategory-card {
      cursor: pointer;
      border-radius: 16px;
      overflow: hidden;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      background: white;
      border: none;
      width: 100%;
      height: 350px;
      display: flex;
      flex-direction: column;
    }

    .subcategory-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
    }

    .subcategory-thumbnail {
      position: relative;
      height: 200px;
      overflow: hidden;
      flex-shrink: 0;
    }

    .subcategory-thumbnail img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .subcategory-card:hover .subcategory-thumbnail img {
      transform: scale(1.05);
    }

    .subcategory-card mat-card-content {
      padding: 24px !important;
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .subcategory-card h3 {
      margin: 0 0 12px 0;
      font-size: 1.25rem;
      color: #1a1a1a;
      font-weight: 600;
      line-height: 1.4;
    }

    .subcategory-card p {
      margin: 0;
      font-size: 0.95rem;
      color: #666;
      line-height: 1.6;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* Posts Section */
    .posts-section {
      margin-bottom: 50px;
      padding: 20px 0;
    }

    /* Subcategory Tabs */
    .subcategory-tabs {
      display: flex;
      gap: 0;
      margin-top: 30px;
      margin-bottom: 40px;
      border-bottom: 2px solid rgba(255, 255, 255, 0.1);
      overflow-x: auto;
      scroll-behavior: smooth;
    }

    .subcategory-tabs::-webkit-scrollbar {
      height: 6px;
    }

    .subcategory-tabs::-webkit-scrollbar-thumb {
      background: var(--accent-copper, #e09543);
      border-radius: 3px;
    }

    .subcategory-tab {
      padding: 16px 32px;
      background: transparent;
      border: none;
      border-bottom: 3px solid transparent;
      color: rgba(255, 255, 255, 0.6);
      font-size: 1rem;
      font-weight: 600;
      text-transform: uppercase;
      cursor: pointer;
      transition: all 0.3s ease;
      white-space: nowrap;
      position: relative;
      bottom: -2px;
      letter-spacing: 0.5px;
    }

    .subcategory-tab:hover {
      color: var(--accent-copper, #e09543);
      background: rgba(224, 149, 67, 0.1);
    }

    .subcategory-tab.active {
      color: var(--accent-copper, #e09543);
      border-bottom-color: var(--accent-copper, #e09543);
      font-weight: 700;
    }

    /* Lưới co giãn; số hàng theo số item thực tế thay vì luôn 2 hàng 500px */
    .posts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      grid-auto-rows: auto;
      align-items: start;
      gap: 30px;
      margin-top: 20px;
      margin-bottom: 20px;
    }

    /* Post Cards */
    /* Thẻ tối viền nét mảnh: ảnh công trình là nội dung, thẻ chỉ là khung —
       nó không nên sáng hơn thứ nó chứa. */
    .post-card {
      cursor: pointer;
      border-radius: 0;
      overflow: hidden;
      transition: transform 0.45s cubic-bezier(.16,1,.3,1), border-color 0.45s ease;
      box-shadow: none;
      background: #1F1E1C;
      border: 1px solid rgba(255, 255, 255, 0.09);
      text-decoration: none;
      color: inherit;
      width: 100%;
      height: auto;
      display: flex;
      flex-direction: column;
    }

    .post-card:hover {
      transform: translateY(-4px);
      border-color: rgba(224, 149, 67, 0.42);
      box-shadow: none;
    }

    .post-image {
      position: relative;
      aspect-ratio: 4 / 3;
      height: auto;
      overflow: hidden;
      flex-shrink: 0;
    }

    /* Nét đồng kéo hết chiều ngang khi rê chuột */
    .card-rule {
      height: 1px;
      width: 0;
      background: var(--brand, #e09543);
      transition: width 0.6s cubic-bezier(.16,1,.3,1);
    }

    .post-card:hover .card-rule {
      width: 100%;
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
      background: linear-gradient(to top, rgba(10,10,9,.90) 0%, rgba(10,10,9,.10) 55%, transparent 100%);
    }

    /* Lớp phủ chỉ để làm nổi nhãn trên ảnh thật; phủ lên skeleton trống chỉ
       khiến khối trông đục như lỗi hiển thị. */
    .post-image:has(img.is-failed) .post-overlay {
      background: none;
    }

    /* Nhãn viền nét mảnh thay viên thuốc bo tròn */
    .post-category-badge,
    .item-type-badge {
      position: absolute;
      z-index: 4;
      top: 14px;
      background: rgba(10, 10, 9, 0.55);
      backdrop-filter: blur(4px);
      padding: 5px 10px;
      border-radius: 0;
      font-family: ui-monospace, "SF Mono", "Roboto Mono", Menlo, Consolas, monospace;
      font-size: 0.58rem;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      font-weight: 500;
    }

    .post-category-badge {
      left: 14px;
      color: var(--brand, #e09543);
      border: 1px solid rgba(224, 149, 67, 0.42);
    }

    .item-type-badge {
      right: 14px;
      color: #7FD1A8;
      border: 1px solid rgba(127, 209, 168, 0.42);
    }

    /* Tiêu đề đè lên ảnh — ảnh giữ được phần lớn thẻ */
    .post-title {
      position: absolute;
      z-index: 4;
      left: 18px;
      right: 18px;
      bottom: 14px;
      margin: 0;
      color: #fff;
      font-size: 1.05rem;
      font-weight: 700;
      letter-spacing: -0.015em;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .item-type-badge mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    /* Post Content */
    .post-content {
      padding: 16px 18px 18px !important;
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #1F1E1C;
    }

    .post-summary {
      color: #A9A39A;
      font-size: 0.9rem;
      line-height: 1.6;
      margin-bottom: 0;
      flex: 0 0 auto;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .post-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-top: auto;
      margin-bottom: 0;
      padding-top: 14px;
      padding-bottom: 0;
      border-bottom: 0;
      font-family: ui-monospace, "SF Mono", "Roboto Mono", Menlo, Consolas, monospace;
      font-size: 0.58rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #6B665F;
    }

    .post-date,
    .post-status,
    .post-views {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 0.85rem;
      color: #6c757d;
      line-height: 1.3;
    }

    .post-date mat-icon,
    .post-status mat-icon,
    .post-views mat-icon {
      font-size: 16px !important;
      width: 16px !important;
      height: 16px !important;
      line-height: 1 !important;
      vertical-align: middle;
      display: inline-block !important;
      margin-right: 2px;
    }

    .post-date span,
    .post-status span,
    .post-views span {
      line-height: 1.3;
      vertical-align: middle;
      display: inline-block;
    }

    .post-status.published {
      color: var(--state-success, #2e7d52);
    }

    .post-status.draft {
      color: var(--state-warning, #b8802b);
    }

    .read-more {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      color: var(--brand, #e09543);
      font-weight: 500;
      font-size: 0.58rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      margin-top: 0;
      line-height: 1.3;
      width: auto;
      white-space: nowrap;
      transition: gap 0.35s cubic-bezier(.16,1,.3,1);
    }

    .post-card:hover .read-more {
      gap: 13px;
    }

    .read-more mat-icon {
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
      transition: transform 0.3s ease;
      display: inline-block !important;
      vertical-align: middle;
    }

    .post-card:hover .read-more mat-icon {
      transform: translateX(4px);
    }

    /* Pagination */
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 15px;
      margin-top: 40px;
      padding: 20px;
    }

    .pagination button[mat-icon-button] {
      background: rgba(255, 255, 255, 0.1);
      border: 2px solid rgba(255, 255, 255, 0.2);
      color: white;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      transition: all 0.3s;
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
      color: white;
    }

    .pagination button[mat-icon-button]:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .page-numbers {
      display: flex;
      gap: 8px;
    }

    .page-numbers button {
      min-width: 40px;
      height: 40px;
      border-radius: 8px;
      border: 2px solid rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.1);
      color: white;
      font-weight: 500;
      transition: all 0.3s;
    }

    .page-numbers button:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: var(--accent-copper, #e09543);
    }

    .page-numbers button.active {
      background: var(--accent-copper, #e09543);
      border-color: var(--accent-copper, #e09543);
      color: white;
    }

    /* Empty State */
    .no-posts {
      text-align: center;
      padding: 80px 20px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    }

    .no-posts-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: rgba(255, 255, 255, 0.3);
      margin-bottom: 20px;
    }

    .no-posts h3 {
      color: white;
      margin-bottom: 10px;
    }

    .no-posts p {
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 30px;
      line-height: 1.6;
    }

    .no-posts button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .subcategories-grid,
      .posts-grid {
        gap: 20px;
      }

      .title-bar {
        padding: 25px 40px;
        max-width: 75%;
      }

      .category-title {
        font-size: 48px;
      }
    }

    @media (max-width: 768px) {
      .category-page {
        padding-top: 0;
      }

      .container {
        padding: 40px 16px;
      }

      .category-header {
        height: 50vh;
        min-height: 350px;
        margin-bottom: 30px;
      }

      .header-overlay {
        top: 50px;
      }

      .title-bar {
        padding: 20px 30px;
        max-width: 85%;
        margin-bottom: 15px;
      }

      .category-title {
        font-size: 1.75rem;
        letter-spacing: 1px;
        line-height: 1.3;
      }

      .description-bar {
        padding: 16px 30px;
        max-width: 85%;
      }

      .description-bar p {
        font-size: 0.95rem;
        line-height: 1.5;
      }

      .section-title {
        font-size: 1.5rem;
        margin: 25px 0 18px 0;
      }

      .breadcrumb {
        margin-bottom: 14px;
        gap: 3px;
      }

      .breadcrumb span {
        gap: 3px;
      }

      .breadcrumb a {
        font-size: 0.85rem;
        line-height: 1.2;
      }

      .breadcrumb mat-icon {
        font-size: 14px !important;
        width: 14px !important;
        height: 14px !important;
      }

      /* Tabs Mobile Styles */
      .subcategory-tabs {
        margin: 18px 0 25px 0;
        gap: 6px;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        
        &::-webkit-scrollbar {
          display: none;
        }
      }

      .subcategory-tab {
        padding: 10px 18px;
        font-size: 0.8rem;
        letter-spacing: 0.2px;
        white-space: nowrap;
      }

      .subcategories-grid,
      .posts-grid {
        grid-template-columns: 1fr;
        grid-auto-rows: auto;
        gap: 16px;
        margin-top: 18px;
      }

      .subcategory-card,
      .post-card {
        border-radius: 12px;
        height: auto;
        min-height: 360px;
      }

      .subcategory-thumbnail,
      .post-image {
        height: 200px;
      }

      .subcategory-content,
      .post-content {
        padding: 14px;
      }

      .subcategory-title,
      .post-title {
        font-size: 1.05rem;
        margin-bottom: 8px;
      }

      .subcategory-description,
      .post-summary {
        font-size: 0.85rem;
        line-height: 1.5;
      }

      .post-meta {
        flex-wrap: wrap;
        gap: 8px;
        padding-bottom: 12px;
      }

      .post-date,
      .post-status,
      .post-views {
        font-size: 0.8rem;
      }

      .read-more {
        font-size: 0.85rem;
      }

      .pagination {
        gap: 12px;
        margin-top: 30px;
        padding: 15px;
      }

      .pagination button[mat-icon-button] {
        width: 36px;
        height: 36px;
      }

      .page-numbers button {
        min-width: 36px;
        height: 36px;
        font-size: 0.9rem;
      }

      .no-posts {
        padding: 60px 16px;
      }

      .no-posts-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
      }

      .no-posts h3 {
        font-size: 1.3rem;
      }

      .no-posts p {
        font-size: 0.9rem;
      }
    }

    @media (max-width: 480px) {
      .container {
        padding: 30px 12px;
      }

      .category-header {
        height: 40vh;
        min-height: 300px;
        margin-bottom: 25px;
      }

      .header-overlay {
        top: 30px;
      }

      .title-bar {
        padding: 16px 20px;
        max-width: 90%;
        margin-bottom: 12px;
        border-radius: 0 6px 6px 0;
      }

      .category-title {
        font-size: 1.4rem;
        letter-spacing: 0.5px;
        line-height: 1.25;
      }

      .description-bar {
        padding: 12px 20px;
        max-width: 90%;
        border-radius: 0 6px 6px 0;
      }

      .description-bar p {
        font-size: 0.85rem;
        line-height: 1.4;
      }

      .section-title {
        font-size: 1.35rem;
        margin: 20px 0 16px 0;
      }

      .breadcrumb a {
        font-size: 0.8rem;
        line-height: 1.2;
      }

      .breadcrumb mat-icon {
        font-size: 12px !important;
        width: 12px !important;
        height: 12px !important;
      }

      .subcategory-tabs {
        margin: 16px 0 20px 0;
        gap: 5px;
      }

      .subcategory-tab {
        padding: 8px 14px;
        font-size: 0.75rem;
      }

      .subcategories-grid,
      .posts-grid {
        gap: 14px;
        margin-top: 16px;
      }

      .subcategory-card,
      .post-card {
        min-height: 340px;
        border-radius: 10px;
      }

      .subcategory-thumbnail,
      .post-image {
        height: 180px;
      }

      .subcategory-content,
      .post-content {
        padding: 12px;
      }

      .subcategory-title,
      .post-title {
        font-size: 0.95rem;
        margin-bottom: 6px;
      }

      .subcategory-description,
      .post-summary {
        font-size: 0.8rem;
        line-height: 1.4;
      }

      .post-meta {
        gap: 6px;
      }

      .post-date,
      .post-status,
      .post-views {
        font-size: 0.75rem;
      }

      .post-date mat-icon,
      .post-status mat-icon,
      .post-views mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      .read-more {
        font-size: 0.8rem;
      }

      .read-more mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      .pagination {
        gap: 10px;
        margin-top: 25px;
        padding: 12px;
      }

      .pagination button[mat-icon-button] {
        width: 32px;
        height: 32px;
      }

      .page-numbers {
        gap: 6px;
      }

      .page-numbers button {
        min-width: 32px;
        height: 32px;
        font-size: 0.85rem;
      }

      .no-posts {
        padding: 50px 12px;
      }

      .no-posts-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
      }

      .no-posts h3 {
        font-size: 1.2rem;
      }

      .no-posts p {
        font-size: 0.85rem;
      }
    }

    @media (max-width: 360px) {
      .title-bar {
        padding: 14px 18px;
      }

      .category-title {
        font-size: 1.25rem;
      }

      .description-bar {
        padding: 10px 18px;
      }

      .description-bar p {
        font-size: 0.8rem;
      }

      .section-title {
        font-size: 1.2rem;
      }

      .subcategory-card,
      .post-card {
        min-height: 320px;
      }

      .subcategory-content,
      .post-content {
        padding: 10px;
      }

      .subcategory-title,
      .post-title {
        font-size: 0.9rem;
      }

      .subcategory-description,
      .post-summary {
        font-size: 0.75rem;
      }
    }
  `]
})
export class CategoryComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly dataService = inject(DataService);
  private readonly authService = inject(AuthService);
  private readonly seo = inject(SeoService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly currentUser$ = this.authService.currentUser$;

  categoryName = '';
  categoryDescription = '';
  categoryThumbnail = '';
  breadcrumb: Array<{ name: string; slug?: string }> = [];

  allSubcategories: Category[] = [];
  pagedSubcategories: Category[] = [];

  tabs: SubTab[] = [];
  activeTabId: number | null = null;

  /** Item của tab đang chọn. */
  items: CardItem[] = [];
  pagedItems: CardItem[] = [];

  isLoading = true;
  /** true khi slug không khớp danh mục nào — dùng để đổi thông điệp trống. */
  notFound = false;

  subcategoryPage = 0;
  itemPage = 0;

  private readonly subcategoryPageSize = 3;
  private readonly itemPageSize = 6;

  /** Toàn bộ item của danh mục, chưa lọc theo tab. */
  private allItems: CardItem[] = [];

  readonly trackByItem = cardItemKey;

  trackByCategoryId(_index: number, category: Category): number {
    return category.id;
  }

  trackByTabId(_index: number, tab: SubTab): string {
    return String(tab.id);
  }

  get subcategoryTotalPages(): number {
    return Math.ceil(this.allSubcategories.length / this.subcategoryPageSize);
  }

  get itemTotalPages(): number {
    return Math.ceil(this.items.length / this.itemPageSize);
  }

  get subcategoryPages(): number[] {
    return Array.from({ length: this.subcategoryTotalPages }, (_, i) => i);
  }

  get itemPages(): number[] {
    return Array.from({ length: this.itemTotalPages }, (_, i) => i);
  }

  ngOnInit(): void {
    this.route.params
      .pipe(
        switchMap(params => {
          this.isLoading = true;
          this.notFound = false;
          this.cdr.markForCheck();

          return forkJoin({
            slug: of(params['slug'] as string),
            categories: this.dataService.getCategories().pipe(catchError(() => of([] as Category[]))),
            posts: this.dataService.getPosts().pipe(catchError(() => of([]))),
            products: this.dataService.getProducts().pipe(catchError(() => of([])))
          });
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ slug, categories, posts, products }) => {
        this.build(slug, categories, posts, products);
        this.isLoading = false;
        this.cdr.markForCheck();
      });
  }

  private build(slug: string, categories: Category[], posts: any[], products: any[]): void {
    const category = categories.find(cat => cat.slug === slug);

    if (!category) {
      this.notFound = true;
      this.categoryName = 'Danh mục không tìm thấy';
      this.categoryDescription = '';
      this.categoryThumbnail = '';
      this.breadcrumb = [];
      this.allSubcategories = [];
      this.pagedSubcategories = [];
      this.tabs = [];
      this.allItems = [];
      this.items = [];
      this.pagedItems = [];
      this.seo.update({
        title: 'Không tìm thấy danh mục',
        description: 'Danh mục bạn tìm không tồn tại hoặc đã bị gỡ.',
        noindex: true
      });
      return;
    }

    this.categoryName = category.name;
    this.categoryDescription = category.description;
    this.categoryThumbnail = category.thumbnail_url || '';

    this.breadcrumb = [{ name: 'Trang chủ' }];
    const parent = category.parent_id ? categories.find(c => c.id === category.parent_id) : undefined;
    if (parent) {
      this.breadcrumb.push({ name: parent.name, slug: parent.slug });
    }
    this.breadcrumb.push({ name: category.name, slug: category.slug });

    this.allSubcategories = categories.filter(cat => cat.parent_id === category.id);
    this.subcategoryPage = 0;
    this.pagedSubcategories = this.allSubcategories.slice(0, this.subcategoryPageSize);

    const categoryIds = [category.id, ...this.allSubcategories.map(c => c.id)];
    const isAdmin = this.authService.isAuthenticated();

    this.allItems = [
      ...posts
        .filter((p: any) => categoryIds.includes(p.category_id) && (isAdmin || p.published))
        .map((p: any) => toCardItem(p, false)),
      ...products
        .filter((p: any) => categoryIds.includes(p.category_id) && (isAdmin || p.published))
        .map((p: any) => toCardItem(p, true))
    ].sort(byNewest);

    this.tabs = this.allSubcategories.length
      ? [
          { id: null, label: 'MỚI NHẤT' },
          ...this.allSubcategories.map(c => ({ id: c.id, label: c.name.toUpperCase() }))
        ]
      : [];

    this.activeTabId = null;
    this.applyTab();
    this.applySeo(category, parent);
  }

  private applyTab(): void {
    this.items = this.activeTabId === null
      ? this.allItems
      : this.allItems.filter(item => item.categoryId === this.activeTabId);

    this.itemPage = 0;
    this.updatePagedItems();
  }

  private updatePagedItems(): void {
    const start = this.itemPage * this.itemPageSize;
    this.pagedItems = this.items.slice(start, start + this.itemPageSize);
  }

  private applySeo(category: Category, parent?: Category): void {
    this.seo.update({
      title: category.meta_title || category.name,
      description: category.meta_description || category.description,
      keywords: category.meta_keywords,
      image: category.og_image_url || category.thumbnail_url,
      path: `/category/${category.slug}`,
      type: 'website',
      modifiedAt: category.updated_at
    });

    const trail: Array<{ name: string; path?: string }> = [{ name: 'Trang chủ', path: '/' }];
    if (parent) {
      trail.push({ name: parent.name, path: `/category/${parent.slug}` });
    }
    trail.push({ name: category.name, path: `/category/${category.slug}` });
    this.seo.setBreadcrumb(trail);
  }

  selectTab(tabId: number | null): void {
    if (this.activeTabId === tabId) {
      return;
    }
    this.activeTabId = tabId;
    this.applyTab();
    this.cdr.markForCheck();
  }

  goToItemPage(page: number): void {
    if (page < 0 || page >= this.itemTotalPages) {
      return;
    }
    this.itemPage = page;
    this.updatePagedItems();
    this.cdr.markForCheck();
  }

  goToSubcategoryPage(page: number): void {
    if (page < 0 || page >= this.subcategoryTotalPages) {
      return;
    }
    this.subcategoryPage = page;
    const start = page * this.subcategoryPageSize;
    this.pagedSubcategories = this.allSubcategories.slice(start, start + this.subcategoryPageSize);
    this.cdr.markForCheck();
  }

}
