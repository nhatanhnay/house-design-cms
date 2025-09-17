import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { Observable } from 'rxjs';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { Category, Admin } from '../../models/models';

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
            <span class="brand-text">Modern House Design</span>
          </a>
        </div>
        
        <nav class="nav-links">
          <a mat-button routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
            Trang Chủ
          </a>
          

          <ng-container *ngFor="let category of categories$ | async">
            <a mat-button
               [routerLink]="'/category/' + category.slug"
               routerLinkActive="active">
              {{ category.name }}
            </a>
          </ng-container>

          <a mat-button
             routerLink="/admin"
             *ngIf="currentUser$ | async"
             class="admin-link">
            <mat-icon>admin_panel_settings</mat-icon>
            Quản Trị
          </a>
          
          <button mat-button 
                  *ngIf="currentUser$ | async; else loginButton"
                  (click)="logout()"
                  class="logout-btn">
            <mat-icon>logout</mat-icon>
            Đăng Xuất
          </button>
          
          <ng-template #loginButton>
            <a mat-button routerLink="/admin/login" class="login-link">
              <mat-icon>login</mat-icon>
              Đăng Nhập
            </a>
          </ng-template>
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
      

      <ng-container *ngFor="let category of categories$ | async">
        <a mat-menu-item [routerLink]="'/category/' + category.slug">
          <mat-icon>category</mat-icon>
          <span>{{ category.name }}</span>
        </a>
      </ng-container>
      
      <mat-divider *ngIf="currentUser$ | async"></mat-divider>
      
      <a mat-menu-item 
         routerLink="/admin"
         *ngIf="currentUser$ | async">
        <mat-icon>admin_panel_settings</mat-icon>
        <span>Quản Trị</span>
      </a>
      
      <button mat-menu-item 
              *ngIf="currentUser$ | async; else mobileLogin"
              (click)="logout()">
        <mat-icon>logout</mat-icon>
        <span>Đăng Xuất</span>
      </button>
      
      <ng-template #mobileLogin>
        <a mat-menu-item routerLink="/admin/login">
          <mat-icon>login</mat-icon>
          <span>Đăng Nhập</span>
        </a>
      </ng-template>
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
    
    .admin-link,
    .login-link,
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
  `]
})
export class NavbarComponent implements OnInit {
  categories$: Observable<Category[]>;
  currentUser$: Observable<Admin | null>;

  constructor(
    private dataService: DataService,
    private authService: AuthService
  ) {
    this.categories$ = this.dataService.getCategories();
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    // Refresh categories on component init
    this.categories$ = this.dataService.getCategories();
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
