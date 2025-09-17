import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { Category, Post, Admin } from '../../models/models';
import { CategoryDialogComponent } from '../../components/category-dialog/category-dialog.component';
import { PostDialogComponent } from '../../components/post-dialog/post-dialog.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatDialogModule
  ],
  template: `
    <div class="admin-page">
      <div class="container">
        <div class="admin-header">
          <h1>Trang Quản Trị</h1>
          <div class="admin-info" *ngIf="currentUser$ | async as user">
            <span>Xin chào, <strong>{{ user.username }}</strong></span>
            <button mat-button (click)="logout()" class="logout-btn">
              <mat-icon>logout</mat-icon>
              Đăng Xuất
            </button>
          </div>
        </div>

        <mat-tab-group class="admin-tabs">
          <!-- Categories Tab -->
          <mat-tab label="Quản Lý Danh Mục">
            <div class="tab-content">
              <div class="section-header">
                <h2>Danh Mục</h2>
                <button mat-raised-button 
                        color="primary" 
                        (click)="openCategoryDialog()">
                  <mat-icon>add</mat-icon>
                  Thêm Danh Mục
                </button>
              </div>
              
              <mat-card class="data-table-card">
                <table mat-table [dataSource]="(categories$ | async) || []" class="admin-table">
                  <ng-container matColumnDef="id">
                    <th mat-header-cell *matHeaderCellDef>ID</th>
                    <td mat-cell *matCellDef="let category">{{ category.id }}</td>
                  </ng-container>
                  
                  <ng-container matColumnDef="name">
                    <th mat-header-cell *matHeaderCellDef>Tên</th>
                    <td mat-cell *matCellDef="let category">{{ category.name }}</td>
                  </ng-container>
                  
                  <ng-container matColumnDef="slug">
                    <th mat-header-cell *matHeaderCellDef>Slug</th>
                    <td mat-cell *matCellDef="let category">{{ category.slug }}</td>
                  </ng-container>
                  
                  <ng-container matColumnDef="description">
                    <th mat-header-cell *matHeaderCellDef>Mô tả</th>
                    <td mat-cell *matCellDef="let category">{{ category.description }}</td>
                  </ng-container>
                  
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Hành động</th>
                    <td mat-cell *matCellDef="let category">
                      <button mat-icon-button (click)="editCategory(category)">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button 
                              color="warn" 
                              (click)="deleteCategory(category.id)">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </td>
                  </ng-container>
                  
                  <tr mat-header-row *matHeaderRowDef="categoryColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: categoryColumns;"></tr>
                </table>
              </mat-card>
            </div>
          </mat-tab>

          <!-- Posts Tab -->
          <mat-tab label="Quản Lý Bài Viết">
            <div class="tab-content">
              <div class="section-header">
                <h2>Bài Viết</h2>
                <button mat-raised-button 
                        color="primary" 
                        (click)="openPostDialog()">
                  <mat-icon>add</mat-icon>
                  Thêm Bài Viết
                </button>
              </div>
              
              <mat-card class="data-table-card">
                <table mat-table [dataSource]="(posts$ | async) || []" class="admin-table">
                  <ng-container matColumnDef="id">
                    <th mat-header-cell *matHeaderCellDef>ID</th>
                    <td mat-cell *matCellDef="let post">{{ post.id }}</td>
                  </ng-container>
                  
                  <ng-container matColumnDef="title">
                    <th mat-header-cell *matHeaderCellDef>Tiêu đề</th>
                    <td mat-cell *matCellDef="let post">{{ post.title }}</td>
                  </ng-container>
                  
                  <ng-container matColumnDef="category">
                    <th mat-header-cell *matHeaderCellDef>Danh mục</th>
                    <td mat-cell *matCellDef="let post">{{ post.category?.name }}</td>
                  </ng-container>
                  
                  <ng-container matColumnDef="published">
                    <th mat-header-cell *matHeaderCellDef>Trạng thái</th>
                    <td mat-cell *matCellDef="let post">
                      <span class="status-badge" 
                            [class.published]="post.published"
                            [class.draft]="!post.published">
                        {{ post.published ? 'Đã xuất bản' : 'Nháp' }}
                      </span>
                    </td>
                  </ng-container>
                  
                  <ng-container matColumnDef="created_at">
                    <th mat-header-cell *matHeaderCellDef>Ngày tạo</th>
                    <td mat-cell *matCellDef="let post">{{ post.created_at | date:'dd/MM/yyyy' }}</td>
                  </ng-container>
                  
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Hành động</th>
                    <td mat-cell *matCellDef="let post">
                      <button mat-icon-button (click)="editPost(post)">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button 
                              color="warn" 
                              (click)="deletePost(post.id)">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </td>
                  </ng-container>
                  
                  <tr mat-header-row *matHeaderRowDef="postColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: postColumns;"></tr>
                </table>
              </mat-card>
            </div>
          </mat-tab>

        </mat-tab-group>
      </div>
    </div>
  `,
  styles: [`
    .admin-page {
      padding: 20px 0;
      min-height: 100vh;
      background-color: var(--surface);
    }
    
    .admin-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px var(--shadow);
    }
    
    .admin-header h1 {
      color: var(--dark-blue);
      margin: 0;
    }
    
    .admin-info {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    
    .logout-btn {
      color: var(--dark-red) !important;
    }
    
    .admin-tabs {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px var(--shadow);
    }
    
    .tab-content {
      padding: 20px;
    }
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .section-header h2 {
      color: var(--dark-blue);
      margin: 0;
    }
    
    .data-table-card {
      overflow: auto;
    }
    
    .admin-table {
      width: 100%;
    }
    
    .admin-table th {
      background-color: var(--gray-blue);
      color: var(--dark-blue);
      font-weight: 600;
    }
    
    .admin-table td {
      padding: 12px;
    }
    
    .status-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 500;
    }
    
    .status-badge.published {
      background-color: var(--primary-blue);
      color: white;
    }
    
    .status-badge.draft {
      background-color: var(--brown);
      color: white;
    }
    
    @media (max-width: 768px) {
      .admin-header {
        flex-direction: column;
        gap: 15px;
        text-align: center;
      }
      
      .section-header {
        flex-direction: column;
        gap: 15px;
        align-items: stretch;
      }
      
      .data-table-card {
        overflow-x: auto;
      }
    }

  `]
})
export class AdminComponent implements OnInit {
  categories$!: Observable<Category[]>;
  posts$!: Observable<Post[]>;
  currentUser$: Observable<Admin | null>;

  categoryColumns: string[] = ['id', 'name', 'slug', 'description', 'actions'];
  postColumns: string[] = ['id', 'title', 'category', 'published', 'created_at', 'actions'];

  constructor(
    private dataService: DataService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.categories$ = this.dataService.getCategories();
    this.posts$ = this.dataService.getPosts();
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.snackBar.open('Đã đăng xuất thành công!', 'Đóng', {
          duration: 3000
        });
      },
      error: (error) => {
        console.error('Logout error:', error);
      }
    });
  }

  // Category methods
  openCategoryDialog(category?: Category): void {
    const dialogRef = this.dialog.open(CategoryDialogComponent, {
      width: '500px',
      data: { category }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadData(); // Reload data after successful save
      }
    });
  }

  editCategory(category: Category): void {
    this.openCategoryDialog(category);
  }

  deleteCategory(id: number): void {
    if (confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
      this.dataService.deleteCategory(id).subscribe({
        next: () => {
          this.snackBar.open('Xóa danh mục thành công!', 'Đóng', {
            duration: 3000
          });
          this.loadData();
        },
        error: (error) => {
          this.snackBar.open('Lỗi khi xóa danh mục!', 'Đóng', {
            duration: 3000
          });
        }
      });
    }
  }

  // Post methods
  openPostDialog(post?: Post): void {
    const dialogRef = this.dialog.open(PostDialogComponent, {
      width: '800px',
      maxWidth: '90vw',
      data: { post }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadData(); // Reload data after successful save
      }
    });
  }

  editPost(post: Post): void {
    this.openPostDialog(post);
  }

  deletePost(id: number): void {
    if (confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      this.dataService.deletePost(id).subscribe({
        next: () => {
          this.snackBar.open('Xóa bài viết thành công!', 'Đóng', {
            duration: 3000
          });
          this.loadData();
        },
        error: (error) => {
          this.snackBar.open('Lỗi khi xóa bài viết!', 'Đóng', {
            duration: 3000
          });
        }
      });
    }
  }

}
