import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
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
    MatSelectModule
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

        <mat-form-field appearance="fill" class="full-width" *ngIf="data.isSubcategory && !data.parentId">
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

        <div *ngIf="data.isSubcategory && data.parentId" class="parent-info">
          <strong>Danh mục cha:</strong> {{ getParentCategoryName() }}
        </div>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Mô tả</mat-label>
          <textarea matInput formControlName="description" rows="3" placeholder="Nhập mô tả danh mục"></textarea>
        </mat-form-field>
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
  `]
})
export class CategoryDialogComponent implements OnInit {
  categoryForm: FormGroup;
  isLoading = false;
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
      parent_id: [null]
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
      this.categoryForm.patchValue(this.data.category);
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
        description: formValue.description
      };

      // Add parent_id for subcategories
      if (this.data.isSubcategory) {
        if (this.data.parentId) {
          // Parent ID was provided (inline add button)
          categoryData.parent_id = this.data.parentId;
        } else if (formValue.parent_id) {
          // Parent ID was selected from dropdown (top add button)
          categoryData.parent_id = formValue.parent_id;
        }
      }

      console.log('Saving category with data:', categoryData);

      const operation = this.data.category
        ? this.dataService.updateCategory(this.data.category.id, categoryData)
        : this.dataService.createCategory(categoryData);

      operation.subscribe({
        next: (result) => {
          this.isLoading = false;
          this.snackBar.open(
            this.data.category ? 'Cập nhật danh mục thành công!' : 'Thêm danh mục thành công!',
            'Đóng',
            { duration: 3000 }
          );
          this.dialogRef.close(result);
        },
        error: (error) => {
          this.isLoading = false;
          this.snackBar.open('Có lỗi xảy ra!', 'Đóng', { duration: 3000 });
          console.error('Error saving category:', error);
        }
      });
    }
  }

  getParentCategoryName(): string {
    if (this.data.parentId && this.data.allCategories) {
      // We would need to get the category name from the allCategories observable
      // For now, return a placeholder with the ID
      return `Danh mục ID: ${this.data.parentId}`;
    }
    return 'Danh mục đã chọn';
  }
}