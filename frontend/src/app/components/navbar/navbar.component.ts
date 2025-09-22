import { Component, OnInit, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
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
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  @ViewChildren(MatMenuTrigger) triggers!: QueryList<MatMenuTrigger>;

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
        return of([]);
      }),
      map(categories => {
        console.log('Categories from API:', categories);
        // Filter only active categories for navbar display
        const activeCategories = categories.filter(cat => cat.is_active);
        const tree = this.dataService.buildCategoryTree(activeCategories);
        const mainCategories = tree.filter(cat => cat.level === 0);
        console.log('Active main categories filtered:', mainCategories);
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
        // Set empty array on error
        this.mainCategories = [];
      }
    });
  }


  onCategoryHover(index: number): void {
    this.cancelCloseMenu();

    if (this.triggers && this.mainCategories[index]?.hasChildren) {
      const trigger = this.triggers.toArray()[index];
      if (trigger && !trigger.menuOpen) {
        trigger.openMenu();
      }
    }
  }

  onCategoryLeave(): void {
    this.closeTimeout = setTimeout(() => {
      if (this.triggers) {
        this.triggers.forEach(trigger => {
          if (trigger.menuOpen) {
            trigger.closeMenu();
          }
        });
      }
    }, 200);
  }

  cancelCloseMenu(): void {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }
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
