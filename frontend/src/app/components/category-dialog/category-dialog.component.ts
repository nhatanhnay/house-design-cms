import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { DataService } from '../../services/data.service';
import { Category } from '../../models/models';

@Component({
  selector: 'app-category-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatIconModule,
    MatCheckboxModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.category ? 'Sửa Danh Mục' : (data.isSubcategory ? 'Thêm Danh Mục Con' : 'Thêm Danh Mục Chính') }}</h2>

    <mat-dialog-content>
      <form [formGroup]="categoryForm" class="category-form">
        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Tên danh mục</mat-label>
          <input matInput formControlName="name" placeholder="Nhập tên danh mục">
          <mat-error *ngIf="categoryForm.get('name')?.hasError('required')">
            Tên danh mục là bắt buộc
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Slug</mat-label>
          <input matInput formControlName="slug" placeholder="Nhập slug (tự động tạo từ tên)">
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Loại danh mục</mat-label>
          <mat-select formControlName="category_type" (selectionChange)="onCategoryTypeChange($event)">
            <mat-option value="product">Sản phẩm (có thể có danh mục con)</mat-option>
            <mat-option value="news">Tin tức (chỉ chứa bài viết)</mat-option>
          </mat-select>
          <mat-error *ngIf="categoryForm.get('category_type')?.hasError('required')">
            Phải chọn loại danh mục
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width" *ngIf="data.isSubcategory && !data.parentId && categoryForm.get('category_type')?.value === 'product'">
          <mat-label>Danh mục cha</mat-label>
          <mat-select formControlName="parent_id" placeholder="Chọn danh mục cha">
            <mat-option *ngFor="let category of parentCategories$ | async" [value]="category.id">
              {{ category.name }}
            </mat-option>
          </mat-select>
          <mat-error *ngIf="categoryForm.get('parent_id')?.hasError('required')">
            Phải chọn danh mục cha
          </mat-error>
        </mat-form-field>

        <div *ngIf="categoryForm.get('category_type')?.value === 'news'" class="category-type-info">
          <mat-icon>info</mat-icon>
          <span>Danh mục tin tức không thể có danh mục con. Chỉ có thể chứa các bài viết.</span>
        </div>

        <div *ngIf="data.isSubcategory && data.parentId" class="parent-info">
          <strong>Danh mục cha:</strong> {{ getParentCategoryName() }}
        </div>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Mô tả</mat-label>
          <textarea matInput formControlName="description" rows="3" placeholder="Nhập mô tả danh mục"></textarea>
        </mat-form-field>

        <!-- Thumbnail Upload Section -->
        <div class="thumbnail-section">
          <label class="thumbnail-label">Hình đại diện danh mục</label>

          <!-- Current thumbnail display -->
          <div class="current-thumbnail" *ngIf="categoryForm.get('thumbnail_url')?.value">
            <img [src]="categoryForm.get('thumbnail_url')?.value"
                 alt="Category thumbnail"
                 class="thumbnail-preview">
            <button type="button"
                    mat-icon-button
                    class="remove-thumbnail"
                    (click)="removeThumbnail()"
                    matTooltip="Xóa hình đại diện">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <!-- Upload button -->
          <div class="upload-section">
            <input type="file"
                   #fileInput
                   accept="image/*"
                   (change)="onThumbnailSelected($event)"
                   style="display: none;">
            <button type="button"
                    mat-stroked-button
                    class="upload-btn"
                    (click)="fileInput.click()"
                    [disabled]="isLoading">
              <mat-icon>cloud_upload</mat-icon>
              {{ categoryForm.get('thumbnail_url')?.value ? 'Thay đổi hình đại diện' : 'Tải lên hình đại diện' }}
            </button>
          </div>

          <!-- Upload progress -->
          <div class="upload-progress" *ngIf="uploadProgress > 0 && uploadProgress < 100">
            <mat-progress-bar [value]="uploadProgress"></mat-progress-bar>
            <span class="progress-text">Đang tải lên... {{ uploadProgress }}%</span>
          </div>
        </div>

        <!-- Active Status Checkbox -->
        <div class="status-section">
          <mat-checkbox formControlName="is_active" color="primary">
            Kích hoạt danh mục (hiển thị cho người dùng)
          </mat-checkbox>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Hủy</button>
      <button mat-raised-button
              color="primary"
              (click)="onSave()"
              [disabled]="categoryForm.invalid || isLoading">
        {{ isLoading ? 'Đang lưu...' : (data.category ? 'Cập nhật' : 'Thêm mới') }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .category-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 400px;
      padding: 16px 0;
    }

    .full-width {
      width: 100%;
    }

    .parent-info {
      padding: 12px;
      background-color: #f5f5f5;
      border-radius: 4px;
      margin-bottom: 16px;
      color: #666;
    }

    mat-dialog-content {
      padding: 20px 24px;
    }

    mat-dialog-actions {
      padding: 16px 24px;
    }

    .thumbnail-section {
      margin-bottom: 16px;
    }

    .thumbnail-label {
      display: block;
      font-weight: 500;
      margin-bottom: 12px;
      color: #666;
    }

    .current-thumbnail {
      position: relative;
      display: inline-block;
      margin-bottom: 12px;
    }

    .thumbnail-preview {
      width: 120px;
      height: 80px;
      object-fit: cover;
      border-radius: 8px;
      border: 2px solid #e0e0e0;
    }

    .remove-thumbnail {
      position: absolute;
      top: -8px;
      right: -8px;
      background: #f44336;
      color: white;
      width: 24px;
      height: 24px;
    }

    .upload-section {
      margin-bottom: 12px;
    }

    .upload-btn {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .upload-progress {
      margin-top: 8px;
    }

    .progress-text {
      font-size: 12px;
      color: #666;
      margin-top: 4px;
      display: block;
    }

    .status-section {
      margin-top: 16px;
      padding: 12px;
      background-color: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #1976d2;
    }

    .category-type-info {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background-color: #e3f2fd;
      border-radius: 8px;
      border-left: 4px solid #2196f3;
      margin-bottom: 16px;
      font-size: 14px;
      color: #1565c0;
    }

    .category-type-info mat-icon {
      color: #2196f3;
      font-size: 20px;
    }
  `]
})
export class CategoryDialogComponent implements OnInit {
  categoryForm: FormGroup;
  isLoading = false;
  uploadProgress = 0;
  parentCategories$?: Observable<Category[]>;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CategoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      category?: Category,
      isSubcategory?: boolean,
      parentId?: number,
      allCategories?: Observable<Category[]>
    },
    private dataService: DataService,
    private snackBar: MatSnackBar
  ) {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required]],
      slug: [''],
      description: [''],
      thumbnail_url: [''],
      category_type: ['product', [Validators.required]], // Mặc định là product
      parent_id: [null],
      is_active: [true]  // Đảm bảo danh mục mới luôn được tạo ở trạng thái hoạt động
    });

    // Set up parent categories for subcategory creation
    if (this.data.isSubcategory && this.data.allCategories) {
      this.parentCategories$ = this.data.allCategories;
      if (!this.data.parentId) {
        this.categoryForm.get('parent_id')?.setValidators([Validators.required]);
      }
    }
  }

  ngOnInit(): void {
    if (this.data.category) {
      console.log('Editing category:', this.data.category);
      this.categoryForm.patchValue({
        name: this.data.category.name,
        slug: this.data.category.slug,
        description: this.data.category.description,
        thumbnail_url: this.data.category.thumbnail_url || '',
        category_type: this.data.category.category_type || 'product',
        parent_id: this.data.category.parent_id,
        is_active: this.data.category.is_active
      });
      console.log('Form values after patch:', this.categoryForm.value);
    }

    // Set parent_id if provided
    if (this.data.parentId) {
      this.categoryForm.patchValue({ parent_id: this.data.parentId });
    }

    // Auto-generate slug from name
    this.categoryForm.get('name')?.valueChanges.subscribe(name => {
      if (name && !this.data.category) {
        const slug = this.generateSlug(name);
        this.categoryForm.get('slug')?.setValue(slug);
      }
    });
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .trim()
      .replace(/\s+/g, '-'); // Replace spaces with hyphens
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.categoryForm.valid) {
      this.isLoading = true;
      const formValue = this.categoryForm.value;

      // Prepare category data with proper parent_id handling
      const categoryData: any = {
        name: formValue.name,
        slug: formValue.slug,
        description: formValue.description || '',
        category_type: formValue.category_type || 'product',
        is_active: formValue.is_active !== undefined ? formValue.is_active : true
      };

      // Ensure category_type is always sent
      if (!categoryData.category_type) {
        categoryData.category_type = 'product';
      }

      // Handle parent_id based on category type
      if (categoryData.category_type === 'news') {
        // News categories should never have parents
        categoryData.parent_id = null;
      } else if (this.data.isSubcategory || formValue.parent_id) {
        // Product categories can have parents
        if (this.data.parentId) {
          // Parent ID was provided (inline add button)
          categoryData.parent_id = this.data.parentId;
        } else if (formValue.parent_id) {
          // Parent ID was selected from dropdown (top add button)
          categoryData.parent_id = formValue.parent_id;
        }
      } else {
        // Explicitly set to null for main categories
        categoryData.parent_id = null;
      }

      // Add thumbnail_url if provided
      if (formValue.thumbnail_url) {
        categoryData.thumbnail_url = formValue.thumbnail_url;
      }

      console.log('💾 SAVE TRIGGERED');
      console.log('📋 Form value before saving:', formValue);
      console.log('📦 Category data prepared:', categoryData);
      console.log('✏️ Is editing existing category:', !!this.data.category);
      console.log('🆔 Category ID:', this.data.category?.id);
      console.log('🏷️ Original category type:', this.data.category?.category_type);
      console.log('🔄 New category type:', categoryData.category_type);

      const operation = this.data.category
        ? this.dataService.updateCategory(this.data.category.id, categoryData)
        : this.dataService.createCategory(categoryData);

      operation.subscribe({
        next: (result) => {
          this.isLoading = false;
          console.log('✅ SUCCESS: Category saved successfully');
          console.log('📤 Server response:', result);
          console.log('🆔 Response category type:', result?.category_type);
          this.snackBar.open(
            this.data.category ? 'Cập nhật danh mục thành công!' : 'Thêm danh mục thành công!',
            'Đóng',
            { duration: 3000 }
          );
          this.dialogRef.close(result);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('❌ ERROR saving category:', error);
          console.error('📤 Error details:', error.error);
          this.snackBar.open('Có lỗi xảy ra!', 'Đóng', { duration: 3000 });
        }
      });
    }
  }

  onCategoryTypeChange(event: any): void {
    const categoryType = event.value;
    console.log('⚡ Category type changed to:', categoryType);

    // If changing to news, clear parent_id and remove subcategory restrictions
    if (categoryType === 'news') {
      console.log('🗞️ Setting to news type - clearing parent_id');
      this.categoryForm.patchValue({ parent_id: null });
      this.categoryForm.get('parent_id')?.clearValidators();
    } else if (categoryType === 'product' && this.data.isSubcategory && !this.data.parentId) {
      // If changing to product and it's a subcategory dialog, add validators back
      console.log('📦 Setting to product type - adding parent validation');
      this.categoryForm.get('parent_id')?.setValidators([Validators.required]);
    }

    this.categoryForm.get('parent_id')?.updateValueAndValidity();
    console.log('📝 Form state after category type change:', this.categoryForm.value);
  }

  getParentCategoryName(): string {
    if (this.data.parentId && this.data.allCategories) {
      // We would need to get the category name from the allCategories observable
      // For now, return a placeholder with the ID
      return `Danh mục ID: ${this.data.parentId}`;
    }
    return 'Danh mục đã chọn';
  }

  onThumbnailSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.snackBar.open('Chỉ chấp nhận file hình ảnh!', 'Đóng', { duration: 3000 });
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        this.snackBar.open('File không được lớn hơn 5MB!', 'Đóng', { duration: 3000 });
        return;
      }

      this.uploadThumbnail(file);
    }
  }

  uploadThumbnail(file: File): void {
    const formData = new FormData();
    formData.append('upload', file);

    this.uploadProgress = 0;
    this.isLoading = true;

    // Use the existing upload endpoint
    this.dataService.uploadImageFormData(formData).subscribe({
      next: (response: any) => {
        this.uploadProgress = 100;
        this.categoryForm.patchValue({ thumbnail_url: response.url });
        this.isLoading = false;
        this.snackBar.open('Tải lên hình đại diện thành công!', 'Đóng', { duration: 3000 });
      },
      error: (error) => {
        this.uploadProgress = 0;
        this.isLoading = false;
        this.snackBar.open('Lỗi khi tải lên hình đại diện!', 'Đóng', { duration: 3000 });
        console.error('Upload error:', error);
      }
    });
  }

  removeThumbnail(): void {
    this.categoryForm.patchValue({ thumbnail_url: '' });
    this.uploadProgress = 0;
  }
}