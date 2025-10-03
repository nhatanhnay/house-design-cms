import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';


import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Admin, Category, CategoryTreeItem } from '../../models/models';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  categories$: Observable<Category[]>;
  mainCategories$: Observable<CategoryTreeItem[]>;
  currentUser$: Observable<Admin | null>;

  // Add property to hold categories directly
  mainCategories: CategoryTreeItem[] = [];
  
  // Mobile menu state
  isMobileMenuOpen: boolean = false;

  constructor(
    private dataService: DataService,
    private authService: AuthService
  ) {
    this.categories$ = this.dataService.getCategories();
    this.mainCategories$ = this.categories$.pipe(
      catchError(error => {
        return of([]);
      }),
      map(categories => {
        // Filter only active categories for navbar display
        const activeCategories = categories.filter(cat => cat.is_active);
        const tree = this.dataService.buildCategoryTree(activeCategories);
        const mainCategories = tree.filter(cat => cat.level === 0);
        return mainCategories;
      })
    );
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    // Subscribe to mainCategories$ and populate mainCategories array
    this.mainCategories$.subscribe({
      next: (categories) => {
        this.mainCategories = categories;
      },
      error: (error) => {
        // Set empty array on error
        this.mainCategories = [];
      }
    });
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

  ngOnDestroy(): void {
    // No cleanup needed for CSS-only hover
  }

  // Mobile menu methods
  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        // Logout successful
      },
      error: (error) => {
        // Even if API call fails, clear local storage
        this.authService.logout();
      }
    });
  }
}
