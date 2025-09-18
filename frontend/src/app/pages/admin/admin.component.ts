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
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { Category, Post, Admin, CategoryTreeItem } from '../../models/models';
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
    MatDialogModule,
    MatTooltipModule
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
                <h2>Danh Mục Hệ Thống</h2>
                <div class="category-actions">
                  <button mat-raised-button
                          color="primary"
                          (click)="openCategoryDialog()">
                    <mat-icon>add</mat-icon>
                    Thêm Danh Mục Chính
                  </button>
                  <button mat-stroked-button
                          color="primary"
                          (click)="openCategoryDialog(null, true)">
                    <mat-icon>add_circle_outline</mat-icon>
                    Thêm Danh Mục Con
                  </button>
                </div>
              </div>

              <!-- Category Tree View -->
              <mat-card class="category-tree-card">
                <div class="category-tree" *ngIf="categoryTree$ | async as tree">
                  <div class="tree-item main-category"
                       *ngFor="let mainCategory of tree"
                       [class.expanded]="mainCategory.expanded">

                    <!-- Main Category -->
                    <div class="category-header">
                      <div class="category-info">
                        <button mat-icon-button
                                class="expand-btn"
                                *ngIf="mainCategory.hasChildren"
                                (click)="toggleCategory(mainCategory)">
                          <mat-icon>{{ mainCategory.expanded ? 'expand_less' : 'expand_more' }}</mat-icon>
                        </button>
                        <mat-icon class="category-icon">{{ getCategoryIcon(mainCategory.slug) }}</mat-icon>
                        <div class="category-details">
                          <div class="category-name">{{ mainCategory.name }}</div>
                          <div class="category-meta">{{ mainCategory.slug }} • {{ mainCategory.description }}</div>
                        </div>
                      </div>
                      <div class="category-actions-inline">
                        <button mat-icon-button
                                (click)="openCategoryDialog(null, true, mainCategory.id)"
                                matTooltip="Thêm danh mục con">
                          <mat-icon>add_circle_outline</mat-icon>
                        </button>
                        <button mat-icon-button
                                (click)="editCategory(mainCategory)"
                                matTooltip="Chỉnh sửa">
                          <mat-icon>edit</mat-icon>
                        </button>
                        <button mat-icon-button
                                color="warn"
                                (click)="deleteCategory(mainCategory.id)"
                                matTooltip="Xóa">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </div>
                    </div>

                    <!-- Subcategories -->
                    <div class="subcategories" *ngIf="mainCategory.expanded && mainCategory.children?.length">
                      <div class="tree-item subcategory"
                           *ngFor="let subcategory of mainCategory.children">
                        <div class="category-header subcategory-header">
                          <div class="category-info">
                            <div class="subcategory-indicator"></div>
                            <mat-icon class="category-icon subcategory-icon">{{ getCategoryIcon(subcategory.slug) }}</mat-icon>
                            <div class="category-details">
                              <div class="category-name">{{ subcategory.name }}</div>
                              <div class="category-meta">{{ subcategory.slug }} • {{ subcategory.description }}</div>
                            </div>
                          </div>
                          <div class="category-actions-inline">
                            <button mat-icon-button
                                    (click)="editCategory(subcategory)"
                                    matTooltip="Chỉnh sửa">
                              <mat-icon>edit</mat-icon>
                            </button>
                            <button mat-icon-button
                                    color="warn"
                                    (click)="deleteCategory(subcategory.id)"
                                    matTooltip="Xóa">
                              <mat-icon>delete</mat-icon>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Empty State -->
                <div class="empty-state" *ngIf="!(categoryTree$ | async)?.length">
                  <mat-icon class="empty-icon">category</mat-icon>
                  <h3>Chưa có danh mục nào</h3>
                  <p>Hãy tạo danh mục đầu tiên để bắt đầu</p>
                </div>
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
                  
                  <ng-container matColumnDef="views">
                    <th mat-header-cell *matHeaderCellDef>Lượt xem</th>
                    <td mat-cell *matCellDef="let post">{{ post.views || 0 }}</td>
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
    
    /* Category Tree Styles */
    .category-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .category-tree-card {
      padding: 0;
      overflow: visible;
    }

    .category-tree {
      padding: 16px;
    }

    .tree-item {
      margin-bottom: 8px;
      border-radius: 8px;
      overflow: hidden;
    }

    .main-category {
      border: 1px solid #e0e0e0;
      background: white;
    }

    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      min-height: 64px;
      background: white;
    }

    .main-category .category-header {
      background: #f8f9fa;
      border-bottom: 1px solid #e0e0e0;
    }

    .category-info {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    }

    .expand-btn {
      color: var(--biscons-blue, #0170B9);
    }

    .category-icon {
      font-size: 24px;
      color: var(--biscons-blue, #0170B9);
    }

    .subcategory-icon {
      font-size: 20px;
      color: #666;
    }

    .category-details {
      flex: 1;
    }

    .category-name {
      font-weight: 600;
      font-size: 1.1rem;
      color: var(--dark-blue, #1a365d);
      margin-bottom: 4px;
    }

    .category-meta {
      font-size: 0.9rem;
      color: #666;
    }

    .category-actions-inline {
      display: flex;
      gap: 4px;
    }

    .subcategories {
      border-top: 1px solid #e0e0e0;
    }

    .subcategory {
      border-bottom: 1px solid #f0f0f0;
    }

    .subcategory:last-child {
      border-bottom: none;
    }

    .subcategory-header {
      background: white;
      padding: 12px 16px;
      min-height: auto;
    }

    .subcategory-indicator {
      width: 24px;
      height: 2px;
      background: var(--biscons-blue, #0170B9);
      margin-left: 12px;
    }

    .subcategory .category-name {
      font-size: 1rem;
      font-weight: 500;
    }

    .subcategory .category-meta {
      font-size: 0.85rem;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .empty-icon {
      font-size: 64px;
      color: #ddd;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      margin-bottom: 8px;
      color: var(--dark-blue, #1a365d);
    }

    .empty-state p {
      margin: 0;
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

      .category-actions {
        flex-direction: column;
        gap: 8px;
      }

      .category-header {
        padding: 12px;
        min-height: auto;
      }

      .category-actions-inline {
        flex-direction: column;
        gap: 2px;
      }

      .data-table-card {
        overflow-x: auto;
      }
    }

  `]
})
export class AdminComponent implements OnInit {
  categories$!: Observable<Category[]>;
  categoryTree$!: Observable<CategoryTreeItem[]>;
  posts$!: Observable<Post[]>;
  currentUser$: Observable<Admin | null>;

  categoryColumns: string[] = ['id', 'name', 'slug', 'description', 'actions'];
  postColumns: string[] = ['id', 'title', 'category', 'published', 'views', 'created_at', 'actions'];

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
    this.categoryTree$ = this.categories$.pipe(
      map(categories => this.dataService.buildCategoryTree(categories))
    );
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
  openCategoryDialog(category?: Category | null, isSubcategory: boolean = false, parentId?: number): void {
    const dialogRef = this.dialog.open(CategoryDialogComponent, {
      width: '600px',
      data: {
        category,
        isSubcategory,
        parentId,
        allCategories: this.categories$
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadData(); // Reload data after successful save
      }
    });
  }

  toggleCategory(category: CategoryTreeItem): void {
    category.expanded = !category.expanded;
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
