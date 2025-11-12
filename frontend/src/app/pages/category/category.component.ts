import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Observable, switchMap, of } from 'rxjs';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { Post, Admin, Category, Product } from '../../models/models';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, RouterModule],
  template: `
    <div class="category-page">
      <!-- Category Header -->
      <div class="category-header">
        <img [src]="categoryThumbnail || 'assets/images/placeholder-category.jpg'"
             [alt]="categoryName"
             class="category-thumbnail"
             (error)="onImageError($event)">
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

        <!-- Subcategories Section -->
        <div class="subcategories-section" *ngIf="allSubcategories && allSubcategories.length > 0">
          <!-- Breadcrumb -->
          <div class="breadcrumb" *ngIf="breadcrumb.length > 0">
            <span *ngFor="let item of breadcrumb; let i = index">
              <a [routerLink]="item.slug ? '/category/' + item.slug : '/'">{{ item.name }}</a>
              <mat-icon *ngIf="i < breadcrumb.length - 1">chevron_right</mat-icon>
            </span>
          </div>

          <h2 class="section-title">Danh mục con</h2>

          <div class="subcategories-grid">
            <mat-card class="subcategory-card" *ngFor="let subcat of subcategories" [routerLink]="'/category/' + subcat.slug">
              <div class="subcategory-thumbnail">
                <img [src]="subcat.thumbnail_url || 'assets/images/placeholder-category.jpg'"
                     [alt]="subcat.name"
                     (error)="onImageError($event)">
              </div>
              <mat-card-content>
                <h3>{{ subcat.name }}</h3>
                <p *ngIf="subcat.description">{{ subcat.description }}</p>
              </mat-card-content>
            </mat-card>
          </div>

          <!-- Subcategory Pagination -->
          <div class="pagination" *ngIf="subcategoryTotalPages > 1">
            <button mat-icon-button (click)="prevSubcategoryPage()" [disabled]="subcategoryPage === 0">
              <mat-icon>chevron_left</mat-icon>
            </button>
            <div class="page-numbers">
              <button mat-button
                      *ngFor="let page of [].constructor(subcategoryTotalPages); let i = index"
                      [class.active]="i === subcategoryPage"
                      (click)="goToSubcategoryPage(i)">
                {{ i + 1 }}
              </button>
            </div>
            <button mat-icon-button (click)="nextSubcategoryPage()" [disabled]="subcategoryPage === subcategoryTotalPages - 1">
              <mat-icon>chevron_right</mat-icon>
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div class="loading-state" *ngIf="isLoading">
          <div class="loading-spinner"></div>
          <p>Đang tải bài viết...</p>
        </div>

        <!-- Combined Posts & Products Grid -->
        <div class="posts-section" *ngIf="allItems && allItems.length > 0; else noItems">
          <h2 class="section-title">{{ categoryName }}</h2>

          <!-- Subcategory Tabs (if has subcategories) -->
          <div class="subcategory-tabs" *ngIf="allSubcategories && allSubcategories.length > 0">
            <!-- "Tất cả" tab -->
            <button 
              class="subcategory-tab" 
              [class.active]="getActiveSubcategoryTab() === null"
              (click)="setActiveSubcategoryTab(null)">
              <span>TẤT CẢ</span>
            </button>

            <!-- Individual subcategory tabs -->
            <button 
              class="subcategory-tab" 
              *ngFor="let subcategory of allSubcategories"
              [class.active]="getActiveSubcategoryTab() === subcategory.id"
              (click)="setActiveSubcategoryTab(subcategory.id)">
              <span>{{ subcategory.name | uppercase }}</span>
            </button>
          </div>

          <div class="posts-grid">
            <!-- Post/Product Card -->
            <mat-card class="post-card" *ngFor="let item of getPaginatedItems()" [routerLink]="isProduct(item) ? '/product/' + (item.slug || item.id) : '/post/' + (item.slug || item.id)">
            <div class="post-image">
              <img
                [src]="getImageUrl(item) || 'assets/images/placeholder-post.jpg'"
                [alt]="item.title"
                (error)="onImageError($event)">
              <div class="post-overlay">
                <div class="post-category-badge">{{ categoryName }}</div>
                <div class="item-type-badge" *ngIf="isProduct(item)">
                  <mat-icon>shopping_cart</mat-icon>
                  Sản phẩm
                </div>
              </div>
            </div>

            <mat-card-content class="post-content">
              <h3 class="post-title">{{ item.title }}</h3>

              <p class="post-summary">{{ item.summary || 'Không có mô tả' }}</p>

              <div class="post-meta">
                <div class="post-date">
                  <mat-icon>event</mat-icon>
                  <span>{{ item.created_at | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
                <div class="post-status" *ngIf="currentUser$ | async" [class.published]="item.published" [class.draft]="!item.published">
                  <mat-icon>{{ item.published ? 'visibility' : 'visibility_off' }}</mat-icon>
                  <span>{{ item.published ? 'Đã xuất bản' : 'Bản nháp' }}</span>
                </div>
                <div class="post-views" *ngIf="!(currentUser$ | async)">
                  <mat-icon>visibility</mat-icon>
                  <span>{{ item.views || 0 }} lượt xem</span>
                </div>
              </div>

              <div class="read-more">
                <span>{{ isProduct(item) ? 'Xem sản phẩm' : 'Xem chi tiết' }}</span>
                <mat-icon>arrow_forward</mat-icon>
              </div>
            </mat-card-content>
          </mat-card>
          </div>

          <!-- Item Pagination -->
          <div class="pagination" *ngIf="itemTotalPages > 1">
            <button mat-icon-button (click)="prevItemPage()" [disabled]="itemPage === 0">
              <mat-icon>chevron_left</mat-icon>
            </button>
            <div class="page-numbers">
              <button mat-button
                      *ngFor="let page of [].constructor(itemTotalPages); let i = index"
                      [class.active]="i === itemPage"
                      (click)="goToItemPage(i)">
                {{ i + 1 }}
              </button>
            </div>
            <button mat-icon-button (click)="nextItemPage()" [disabled]="itemPage === itemTotalPages - 1">
              <mat-icon>chevron_right</mat-icon>
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <ng-template #noItems>
          <div class="no-posts">
            <mat-icon class="no-posts-icon">article</mat-icon>
            <h3>Chưa có bài viết hoặc sản phẩm nào</h3>
            <p>Danh mục này hiện tại chưa có nội dung nào. Hãy quay lại sau nhé!</p>
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
      background: rgba(102, 126, 234, 0.95);
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

    .subcategories-grid {
      display: grid;
      grid-template-columns: repeat(3, 360px);
      gap: 30px;
      margin-top: 20px;
      margin-bottom: 20px;
      justify-content: start; /* Căn trái như home */
    }

    .subcategory-card {
      cursor: pointer;
      border-radius: 16px;
      overflow: hidden;
      transition: all 0.3s ease;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      background: white;
      border: none;
      width: 360px;
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

    /* Posts Grid - 3x2 = 6 items */
    .posts-grid {
      display: grid;
      grid-template-columns: repeat(3, 360px);
      gap: 30px;
      margin-top: 20px;
      margin-bottom: 20px;
      justify-content: start; /* Căn trái như home */
    }

    /* Post Cards */
    .post-card {
      cursor: pointer;
      border-radius: 16px;
      overflow: hidden;
      transition: all 0.3s ease;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      background: white;
      border: none;
      text-decoration: none;
      color: inherit;
      width: 360px;
      height: 500px;
      display: flex;
      flex-direction: column;
    }

    .post-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
    }

    .post-image {
      position: relative;
      height: 220px;
      overflow: hidden;
      flex-shrink: 0;
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

    .item-type-badge {
      position: absolute;
      top: 15px;
      right: 15px;
      background: #28a745;
      color: white;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .item-type-badge mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    /* Post Content */
    .post-content {
      padding: 20px !important;
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .post-title {
      color: #3A3A3A;
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
      margin-bottom: auto;
      flex: 1;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .post-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
      margin-bottom: 16px;
      padding-top: 12px;
      padding-bottom: 16px;
      border-bottom: 1px solid #eee;
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
      color: #28a745;
    }

    .post-status.draft {
      color: #ffc107;
    }

    .read-more {
      display: inline-flex;
      align-items: center;
      justify-content: space-between;
      color: var(--primary-blue, #3498db);
      font-weight: 500;
      font-size: 0.9rem;
      margin-top: auto;
      line-height: 1.3;
      width: 100%;
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
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
      }

      .subcategory-card,
      .post-card {
        width: 100%;
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
  items$: Observable<(Post | Product)[]>;
  currentUser$: Observable<Admin | null>;
  categoryName = '';
  categoryDescription = '';
  categoryThumbnail = '';
  categoryId: number | null = null; // Track current category ID
  subcategories: Category[] = [];
  allSubcategories: Category[] = [];
  allItems: (Post | Product)[] = [];
  allItemsUnfiltered: (Post | Product)[] = []; // Store all items before tab filtering
  breadcrumb: Array<{name: string, slug?: string}> = [];
  isLoading = true;

  // Active subcategory tab (null = "Tất cả")
  activeSubcategoryTab: number | null = null;

  // Pagination for subcategories
  subcategoryPage = 0;
  subcategoryPageSize = 3;

  // Pagination for posts/products
  itemPage = 0;
  itemPageSize = 6; // 3x2 grid

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService,
    private authService: AuthService
  ) {
    this.items$ = this.route.params.pipe(
      switchMap(params => {
        this.isLoading = true;
        this.categoryName = params['slug'];

        // First get categories to find the category ID by slug
        return this.dataService.getCategories().pipe(
          switchMap(categories => {
            const category = categories.find(cat => cat.slug === params['slug']);

            if (category) {
              this.categoryName = category.name;
              this.categoryDescription = category.description;
              this.categoryThumbnail = category.thumbnail_url || '';
              this.categoryId = category.id; // Store category ID

              // Build breadcrumb
              this.breadcrumb = [{name: 'Trang chủ'}];
              if (category.parent_id) {
                const parent = categories.find(c => c.id === category.parent_id);
                if (parent) {
                  this.breadcrumb.push({name: parent.name, slug: parent.slug});
                }
              }
              this.breadcrumb.push({name: category.name, slug: category.slug});

              // Get all category IDs including subcategories
              const categoryIds = [category.id];
              this.allSubcategories = categories.filter(cat => cat.parent_id === category.id);
              this.subcategories = this.getPaginatedSubcategories();
              
              // Initialize active tab to "Tất cả" if has subcategories
              if (this.allSubcategories.length > 0) {
                this.activeSubcategoryTab = null;
              }
              
              this.allSubcategories.forEach(sub => categoryIds.push(sub.id));

              // Get both posts and products from all these categories
              return this.dataService.getPosts().pipe(
                switchMap(allPosts => {
                  return this.dataService.getProducts().pipe(
                    switchMap(allProducts => {
                      console.log('🔍 CategoryComponent - All Posts:', allPosts);
                      console.log('🔍 CategoryComponent - All Products:', allProducts);
                      console.log('🔍 CategoryComponent - Category IDs to filter:', categoryIds);
                      
                      const filteredPosts = allPosts.filter(post =>
                        categoryIds.includes(post.category_id)
                      );
                      const filteredProducts = allProducts.filter(product =>
                        categoryIds.includes(product.category_id)
                      );

                      console.log('✅ Filtered Posts:', filteredPosts.length, filteredPosts);
                      console.log('✅ Filtered Products:', filteredProducts.length, filteredProducts);

                      // Combine and sort by created_at
                      const combined = [...filteredPosts, ...filteredProducts].sort((a, b) => {
                        const dateA = new Date(a.created_at || 0).getTime();
                        const dateB = new Date(b.created_at || 0).getTime();
                        return dateB - dateA; // Newest first
                      });

                      console.log('📦 Combined items:', combined.length, combined);
                      console.log('🔎 First item type check:', combined[0], 'isProduct:', this.isProduct(combined[0]));

                      return of(combined);
                    })
                  );
                })
              );
            } else {
              this.categoryName = 'Danh mục không tìm thấy';
              this.categoryDescription = '';
              this.categoryThumbnail = '';
              this.breadcrumb = [];
              return of([]);
            }
          })
        );
      })
    );
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    // Subscribe to items observable to handle loading state and store items
    this.items$.subscribe({
      next: (items) => {
        this.isLoading = false;
        this.allItemsUnfiltered = items; // Store all items
        this.filterItemsByTab(); // Apply initial filter
      },
      error: (error) => {
        this.isLoading = false;
      }
    });
  }

  // Filter items by active tab
  filterItemsByTab(): void {
    if (this.activeSubcategoryTab === null) {
      // "Tất cả" - show all items
      this.allItems = this.allItemsUnfiltered;
    } else {
      // Filter by specific subcategory
      this.allItems = this.allItemsUnfiltered.filter(item => 
        item.category_id === this.activeSubcategoryTab
      );
    }
    // Reset to first page when filter changes
    this.itemPage = 0;
  }

  // Set active subcategory tab
  setActiveSubcategoryTab(subcategoryId: number | null): void {
    this.activeSubcategoryTab = subcategoryId;
    this.filterItemsByTab();
  }

  // Get active subcategory tab
  getActiveSubcategoryTab(): number | null {
    return this.activeSubcategoryTab;
  }

  // Subcategory pagination
  getPaginatedSubcategories(): Category[] {
    const start = this.subcategoryPage * this.subcategoryPageSize;
    const end = start + this.subcategoryPageSize;
    return this.allSubcategories.slice(start, end);
  }

  get subcategoryTotalPages(): number {
    return Math.ceil(this.allSubcategories.length / this.subcategoryPageSize);
  }

  nextSubcategoryPage(): void {
    if (this.subcategoryPage < this.subcategoryTotalPages - 1) {
      this.subcategoryPage++;
      this.subcategories = this.getPaginatedSubcategories();
    }
  }

  prevSubcategoryPage(): void {
    if (this.subcategoryPage > 0) {
      this.subcategoryPage--;
      this.subcategories = this.getPaginatedSubcategories();
    }
  }

  goToSubcategoryPage(page: number): void {
    this.subcategoryPage = page;
    this.subcategories = this.getPaginatedSubcategories();
  }

  // Item (post/product) pagination
  getPaginatedItems(): (Post | Product)[] {
    const start = this.itemPage * this.itemPageSize;
    const end = start + this.itemPageSize;
    return this.allItems.slice(start, end);
  }

  get itemTotalPages(): number {
    return Math.ceil(this.allItems.length / this.itemPageSize);
  }

  nextItemPage(): void {
    if (this.itemPage < this.itemTotalPages - 1) {
      this.itemPage++;
    }
  }

  prevItemPage(): void {
    if (this.itemPage > 0) {
      this.itemPage--;
    }
  }

  goToItemPage(page: number): void {
    this.itemPage = page;
  }

  onImageError(event: any): void {
    event.target.src = 'assets/images/placeholder-post.jpg';
  }

  isProduct(item: Post | Product): item is Product {
    // Products have thumbnail_url instead of image_url
    // Check for thumbnail_url existence (Products) vs image_url (Posts)
    return 'thumbnail_url' in item && !('image_url' in item);
  }

  asProduct(item: Post | Product): Product {
    return item as Product;
  }

  getImageUrl(item: Post | Product): string {
    if (this.isProduct(item)) {
      // For products, use thumbnail_url first, then fallback to gallery or og_image_url
      return item.thumbnail_url ||
             (item.images && item.images.length > 0 ? item.images[0].image_url : '') ||
             item.og_image_url || '';
    } else {
      // For posts, use image_url
      return (item as Post).image_url || '';
    }
  }
}
