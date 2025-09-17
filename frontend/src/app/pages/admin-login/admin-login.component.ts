import { Component } from '@angular/core';
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
                <mat-icon class="login-icon">admin_panel_settings</mat-icon>
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
                  <mat-icon matSuffix>person</mat-icon>
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
                          type="button">
                    <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                  </button>
                </mat-form-field>
                
                <button mat-raised-button 
                        type="submit"
                        class="login-btn full-width"
                        [disabled]="!loginForm.valid || isLoading"
                        color="primary">
                  <mat-icon *ngIf="isLoading">refresh</mat-icon>
                  <span>{{ isLoading ? 'Đang đăng nhập...' : 'Đăng Nhập' }}</span>
                </button>
              </form>
              
              <div class="login-info">
                <p><strong>Thông tin đăng nhập mặc định:</strong></p>
                <p>Tên đăng nhập: <code>admin</code></p>
                <p>Mật khẩu: <code>admin123</code></p>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      background: linear-gradient(135deg, var(--primary-blue), var(--light-blue));
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
      color: var(--primary-blue);
      margin-bottom: 20px;
    }
    
    .login-header h2 {
      color: var(--dark-blue);
      margin-bottom: 10px;
      font-weight: 600;
    }
    
    .login-header p {
      color: var(--text-secondary);
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
    
    .login-info {
      margin-top: 30px;
      padding: 20px;
      background-color: var(--surface);
      border-radius: 8px;
      border-left: 4px solid var(--brown);
    }
    
    .login-info p {
      margin: 5px 0;
      font-size: 0.9rem;
      color: var(--text-secondary);
    }
    
    .login-info p:first-child {
      font-weight: 500;
      color: var(--text-primary);
    }
    
    .login-info code {
      background-color: rgba(0, 0, 0, 0.1);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      color: var(--brown);
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
export class AdminLoginComponent {
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
