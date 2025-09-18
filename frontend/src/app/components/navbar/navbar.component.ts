import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { Category, Admin, CategoryTreeItem } from '../../models/models';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule
  ],
  template: `
    <mat-toolbar class="navbar primary-bg" color="primary">
      <div class="container navbar-content">
        <div class="brand">
          <a routerLink="/" class="brand-link">
            <mat-icon>home</mat-icon>
            <span class="brand-text">MMA Architectural Design</span>
          </a>
        </div>
        
        <nav class="nav-links">
          <a mat-button routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
            Trang Chủ
          </a>

          <!-- Main Categories with Hover Dropdowns -->
          <ng-container *ngFor="let mainCategory of mainCategories">
            <div class="nav-category-wrapper"
                 [class.has-dropdown]="mainCategory.hasChildren">

              <!-- Category with subcategories - hover dropdown -->
              <button mat-button
                      *ngIf="mainCategory.hasChildren"
                      [matMenuTriggerFor]="categoryMenu"
                      #trigger="matMenuTrigger"
                      class="category-dropdown"
                      (mouseenter)="trigger.openMenu()"
                      (mouseleave)="scheduleCloseMenu(trigger)">
                {{ mainCategory.name }}
                <mat-icon class="dropdown-arrow">keyboard_arrow_down</mat-icon>
              </button>

              <!-- Category without subcategories - direct link -->
              <a mat-button
                 *ngIf="!mainCategory.hasChildren"
                 [routerLink]="'/category/' + mainCategory.slug"
                 routerLinkActive="active">
                {{ mainCategory.name }}
              </a>

              <!-- Dropdown menu for subcategories -->
              <mat-menu #categoryMenu="matMenu"
                        class="category-submenu"
                        (mouseenter)="cancelCloseMenu()"
                        (mouseleave)="closeMenuImmediately(categoryMenu)">
                <a mat-menu-item
                   *ngFor="let subcategory of mainCategory.children"
                   [routerLink]="'/category/' + subcategory.slug">
                  <mat-icon>{{ getCategoryIcon(subcategory.slug) }}</mat-icon>
                  <span>{{ subcategory.name }}</span>
                </a>
              </mat-menu>
            </div>
          </ng-container>

          <!-- Debug info - remove this later -->
          <div *ngIf="mainCategories.length === 0" style="color: white; padding: 10px;">
            Loading categories... ({{mainCategories.length}} loaded)
          </div>

          <a mat-button
             routerLink="/admin"
             *ngIf="currentUser$ | async"
             class="admin-link">
            <mat-icon>admin_panel_settings</mat-icon>
            Quản Trị
          </a>
          
          <button mat-button
                  *ngIf="currentUser$ | async"
                  (click)="logout()"
                  class="logout-btn">
            <mat-icon>logout</mat-icon>
            Đăng Xuất
          </button>
        </nav>
        
        <!-- Mobile menu button -->
        <button mat-icon-button 
                class="mobile-menu-btn"
                [matMenuTriggerFor]="mobileMenu">
          <mat-icon>menu</mat-icon>
        </button>
      </div>
    </mat-toolbar>
    
    <!-- Mobile menu -->
    <mat-menu #mobileMenu="matMenu" class="mobile-menu">
      <a mat-menu-item routerLink="/">
        <mat-icon>home</mat-icon>
        <span>Trang Chủ</span>
      </a>

      <!-- Mobile menu with hierarchical categories -->
      <ng-container *ngFor="let mainCategory of mainCategories$ | async">
        <!-- Main category header -->
        <div mat-menu-item class="mobile-category-header" *ngIf="mainCategory.hasChildren">
          <mat-icon>{{ getCategoryIcon(mainCategory.slug) }}</mat-icon>
          <span class="category-header-text">{{ mainCategory.name }}</span>
        </div>

        <!-- Subcategories -->
        <a mat-menu-item
           *ngFor="let subcategory of mainCategory.children"
           [routerLink]="'/category/' + subcategory.slug"
           class="mobile-subcategory">
          <mat-icon class="subcategory-icon">{{ getCategoryIcon(subcategory.slug) }}</mat-icon>
          <span>{{ subcategory.name }}</span>
        </a>

        <!-- Direct link if no children -->
        <a mat-menu-item
           *ngIf="!mainCategory.hasChildren"
           [routerLink]="'/category/' + mainCategory.slug">
          <mat-icon>{{ getCategoryIcon(mainCategory.slug) }}</mat-icon>
          <span>{{ mainCategory.name }}</span>
        </a>

        <mat-divider *ngIf="mainCategory.hasChildren"></mat-divider>
      </ng-container>
      
      <mat-divider *ngIf="currentUser$ | async"></mat-divider>
      
      <a mat-menu-item 
         routerLink="/admin"
         *ngIf="currentUser$ | async">
        <mat-icon>admin_panel_settings</mat-icon>
        <span>Quản Trị</span>
      </a>
      
      <button mat-menu-item
              *ngIf="currentUser$ | async"
              (click)="logout()">
        <mat-icon>logout</mat-icon>
        <span>Đăng Xuất</span>
      </button>
    </mat-menu>
  `,
  styles: [`
    .navbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      height: 64px;
    }
    
    .navbar-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
    
    .brand {
      display: flex;
      align-items: center;
    }
    
    .brand-link {
      display: flex;
      align-items: center;
      text-decoration: none;
      color: inherit;
      font-size: 1.2rem;
      font-weight: 500;
    }
    
    .brand-text {
      margin-left: 8px;
    }
    
    .nav-links {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .nav-links a,
    .nav-links button {
      color: white !important;
      font-weight: 400;
    }
    
    .nav-links .active {
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
    }

    /* Navigation Category Styles */
    .nav-category-wrapper {
      position: relative;
      display: inline-block;
    }

    .category-dropdown {
      display: flex;
      align-items: center;
      gap: 4px;
      color: white !important;
      background: transparent !important;
      border: none !important;
      transition: background-color 0.2s ease;
    }

    .category-dropdown:hover {
      background-color: rgba(255, 255, 255, 0.1) !important;
      border-radius: 4px;
    }

    .dropdown-arrow {
      font-size: 16px !important;
      width: 16px !important;
      height: 16px !important;
      transition: transform 0.2s ease;
    }

    .nav-category-wrapper.has-dropdown:hover .dropdown-arrow {
      transform: rotate(180deg);
    }
    
    .admin-link,
    .logout-btn {
      color: var(--light-blue) !important;
      font-weight: 500 !important;
    }
    
    .mobile-menu-btn {
      display: none;
    }
    
    @media (max-width: 768px) {
      .nav-links {
        display: none;
      }
      
      .mobile-menu-btn {
        display: block;
      }
      
      .brand-text {
        display: none;
      }
    }
    
    @media (max-width: 480px) {
      .brand-text {
        display: none;
      }
    }

    /* Category submenu styling */
    ::ng-deep .category-submenu {
      margin-top: 8px;
    }

    ::ng-deep .category-submenu .mat-mdc-menu-item {
      display: flex;
      align-items: center;
      gap: 12px;
      min-height: 44px;
    }

    ::ng-deep .category-submenu .mat-mdc-menu-item mat-icon {
      color: var(--biscons-blue, #0170B9);
      font-size: 20px;
    }

    /* Mobile menu styling */
    .mobile-category-header {
      background-color: #f5f5f5 !important;
      color: var(--dark-blue, #1a365d) !important;
      font-weight: 600 !important;
      pointer-events: none;
    }

    .category-header-text {
      font-weight: 600;
      color: var(--dark-blue, #1a365d);
    }

    .mobile-subcategory {
      padding-left: 24px !important;
    }

    .subcategory-icon {
      color: var(--biscons-blue, #0170B9) !important;
      font-size: 18px !important;
    }
  `]
})
export class NavbarComponent implements OnInit {
  categories$: Observable<Category[]>;
  mainCategories$: Observable<CategoryTreeItem[]>;
  currentUser$: Observable<Admin | null>;

  // Add property to hold categories directly
  mainCategories: CategoryTreeItem[] = [];

  private closeTimeout: any;

  constructor(
    private dataService: DataService,
    private authService: AuthService
  ) {
    this.categories$ = this.dataService.getCategories();
    this.mainCategories$ = this.categories$.pipe(
      catchError(error => {
        console.error('Error loading categories from API:', error);
        return of(this.getSampleCategories());
      }),
      map(categories => {
        console.log('Categories from API:', categories);
        // If no categories from backend, use sample data
        if (!categories || categories.length === 0) {
          console.log('No categories from API, using sample data');
          categories = this.getSampleCategories();
        }
        const tree = this.dataService.buildCategoryTree(categories);
        const mainCategories = tree.filter(cat => cat.level === 0);
        console.log('Main categories filtered:', mainCategories);
        return mainCategories;
      })
    );
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    // Subscribe to mainCategories$ and populate mainCategories array
    this.mainCategories$.subscribe({
      next: (categories) => {
        console.log('Main categories loaded:', categories);
        this.mainCategories = categories;
      },
      error: (error) => {
        console.error('Error loading main categories:', error);
        // Use sample data on error
        const sampleCategories = this.getSampleCategories();
        const tree = this.dataService.buildCategoryTree(sampleCategories);
        this.mainCategories = tree.filter(cat => cat.level === 0);
      }
    });
  }


  private getSampleCategories(): Category[] {
    return [
      // Main categories
      {
        id: 1,
        name: 'Giới Thiệu',
        slug: 'gioi-thieu',
        description: 'Về công ty',
        parent_id: null,
        level: 0,
        order_index: 1,
        is_active: true
      },
      {
        id: 2,
        name: 'Dự Án Thiết Kế',
        slug: 'du-an-thiet-ke',
        description: 'Các dự án thiết kế',
        parent_id: null,
        level: 0,
        order_index: 2,
        is_active: true
      },
      {
        id: 3,
        name: 'Công Trình Thực Tế',
        slug: 'cong-trinh-thuc-te',
        description: 'Công trình đã hoàn thành',
        parent_id: null,
        level: 0,
        order_index: 3,
        is_active: true
      },
      {
        id: 4,
        name: 'Dịch Vụ',
        slug: 'dich-vu',
        description: 'Các dịch vụ của công ty',
        parent_id: null,
        level: 0,
        order_index: 4,
        is_active: true
      },
      {
        id: 5,
        name: 'Tin Tức',
        slug: 'tin-tuc',
        description: 'Tin tức và bài viết',
        parent_id: null,
        level: 0,
        order_index: 5,
        is_active: true
      },
      {
        id: 6,
        name: 'Liên Hệ',
        slug: 'lien-he',
        description: 'Thông tin liên hệ',
        parent_id: null,
        level: 0,
        order_index: 6,
        is_active: true
      },
      // Subcategories for Dự Án Thiết Kế
      {
        id: 7,
        name: 'Biệt Thự Hiện Đại',
        slug: 'biet-thu-hien-dai',
        description: 'Thiết kế biệt thự hiện đại',
        parent_id: 2,
        level: 1,
        order_index: 1,
        is_active: true
      },
      {
        id: 8,
        name: 'Nhà Phố Hiện Đại',
        slug: 'nha-pho-hien-dai',
        description: 'Thiết kế nhà phố hiện đại',
        parent_id: 2,
        level: 1,
        order_index: 2,
        is_active: true
      },
      {
        id: 9,
        name: 'Văn Phòng',
        slug: 'van-phong',
        description: 'Thiết kế văn phòng',
        parent_id: 2,
        level: 1,
        order_index: 3,
        is_active: true
      },
      // Subcategories for Dịch Vụ
      {
        id: 10,
        name: 'Dịch Vụ Thiết Kế',
        slug: 'dich-vu-thiet-ke',
        description: 'Dịch vụ thiết kế kiến trúc',
        parent_id: 4,
        level: 1,
        order_index: 1,
        is_active: true
      },
      {
        id: 11,
        name: 'Dịch Vụ Thi Công',
        slug: 'dich-vu-thi-cong',
        description: 'Dịch vụ thi công xây dựng',
        parent_id: 4,
        level: 1,
        order_index: 2,
        is_active: true
      },
      {
        id: 12,
        name: 'Tư Vấn Giám Sát',
        slug: 'tu-van-giam-sat',
        description: 'Tư vấn và giám sát công trình',
        parent_id: 4,
        level: 1,
        order_index: 3,
        is_active: true
      }
    ];
  }

  scheduleCloseMenu(trigger: any): void {
    this.closeTimeout = setTimeout(() => {
      trigger.closeMenu();
    }, 300); // 300ms delay
  }

  cancelCloseMenu(): void {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }
  }

  closeMenuImmediately(menu: any): void {
    setTimeout(() => {
      menu._elementRef.nativeElement.dispatchEvent(new Event('mouseleave'));
    }, 100);
  }

  getCategoryIcon(slug: string): string {
    const iconMap: { [key: string]: string } = {
      // Main categories
      'gioi-thieu': 'info',
      'du-an-thiet-ke': 'architecture',
      'cong-trinh-thuc-te': 'business',
      'dich-vu': 'handyman',
      'tin-tuc': 'newspaper',
      'tuyen-dung': 'work',
      'lien-he': 'contact_page',

      // Subcategories
      'biet-thu-hien-dai': 'home',
      'nha-pho-hien-dai': 'apartment',
      'van-phong': 'business_center',
      'biet-thu': 'villa',
      'nha-pho': 'home_work',
      'thiet-ke': 'draw',
      'thi-cong': 'construction',
      'tu-van': 'support_agent',

      // Default icons
      'default': 'category'
    };
    return iconMap[slug] || iconMap['default'];
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        // Logout successful
      },
      error: (error) => {
        console.error('Logout error:', error);
        // Even if API call fails, clear local storage
        this.authService.logout();
      }
    });
  }
}
