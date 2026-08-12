import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../models/models';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <div class="login-page">
      <div class="container">
        <div class="login-container">
          <mat-card class="login-card">
            <mat-card-content>
              <div class="login-header">
                <mat-icon class="login-icon" aria-hidden="true">admin_panel_settings</mat-icon>
                <h2>Đăng Nhập Quản Trị</h2>
                <p>Nhập thông tin để truy cập trang quản trị</p>
              </div>
              
              <form (ngSubmit)="onLogin()" #loginForm="ngForm" class="login-form">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Tên đăng nhập</mat-label>
                  <input matInput 
                         [(ngModel)]="credentials.username"
                         name="username"
                         required
                         autocomplete="username">
                  <mat-icon matSuffix aria-hidden="true">person</mat-icon>
                </mat-form-field>
                
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Mật khẩu</mat-label>
                  <input matInput 
                         [type]="hidePassword ? 'password' : 'text'"
                         [(ngModel)]="credentials.password"
                         name="password"
                         required
                         autocomplete="current-password">
                  <button mat-icon-button
                          matSuffix
                          (click)="hidePassword = !hidePassword"
                          [attr.aria-label]="hidePassword ? 'Hiện mật khẩu' : 'Ẩn mật khẩu'"
                          [attr.aria-pressed]="!hidePassword"
                          type="button">
                    <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                  </button>
                </mat-form-field>
                
                <button mat-raised-button 
                        type="submit"
                        class="login-btn full-width"
                        [disabled]="!loginForm.valid || isLoading"
                        color="primary">
                  <mat-icon *ngIf="isLoading" aria-hidden="true">refresh</mat-icon>
                  <span>{{ isLoading ? 'Đang đăng nhập...' : 'Đăng Nhập' }}</span>
                </button>
              </form>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      background: linear-gradient(135deg, var(--surface-darker, #2a2a2a), var(--surface-dark, #3a3a3a));
      display: flex;
      align-items: center;
      padding: 20px 0;
    }
    
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
    }
    
    .login-card {
      width: 100%;
      max-width: 400px;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }
    
    .login-header {
      text-align: center;
      margin-bottom: 30px;
    }
    
    .login-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      color: var(--brand, #e09543);
      margin-bottom: 20px;
    }
    
    .login-header h2 {
      color: #1a1a1a;
      margin-bottom: 10px;
      font-weight: 600;
    }
    
    .login-header p {
      color: #6B6B6B;
      margin: 0;
    }
    
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    .full-width {
      width: 100%;
    }
    
    .login-btn {
      padding: 12px;
      font-size: 1.1rem;
      font-weight: 500;
      margin-top: 10px;
    }
    
    .login-btn[disabled] {
      opacity: 0.6;
    }

    .login-btn mat-icon {
      animation: spin 1s linear infinite;
      margin-right: 6px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (prefers-reduced-motion: reduce) {
      .login-btn mat-icon {
        animation: none;
      }
    }
    
    @media (max-width: 480px) {
      .login-card {
        margin: 0 15px;
      }
      
      .login-icon {
        font-size: 3rem;
        width: 3rem;
        height: 3rem;
      }
    }
  `]
})
export class AdminLoginComponent implements OnInit {
  private readonly seo = inject(SeoService);

  credentials: LoginRequest = {
    username: '',
    password: ''
  };
  
  hidePassword = true;
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    // If already logged in, redirect to admin
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/admin']);
    }
  }

  ngOnInit(): void {
    // Trang đăng nhập không được index, và canonical phải trỏ đúng chính nó
    // thay vì kế thừa thẻ mặc định trỏ về trang chủ.
    this.seo.update({
      title: 'Đăng nhập quản trị',
      description: 'Khu vực quản trị nội bộ.',
      path: '/admin/login',
      noindex: true
    });
    this.seo.setBreadcrumb([]);
    this.seo.setStructuredData('article', null);
    this.seo.setStructuredData('product', null);
  }

  onLogin(): void {
    if (!this.credentials.username || !this.credentials.password) {
      return;
    }

    this.isLoading = true;
    
    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.snackBar.open('Đăng nhập thành công!', 'Đóng', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.router.navigate(['/admin']);
      },
      error: (error) => {
        this.isLoading = false;
        let errorMessage = 'Đăng nhập thất bại!';
        
        if (error.status === 401) {
          errorMessage = 'Tên đăng nhập hoặc mật khẩu không đúng!';
        } else if (error.status === 0) {
          errorMessage = 'Không thể kết nối đến server!';
        }
        
        this.snackBar.open(errorMessage, 'Đóng', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
}
