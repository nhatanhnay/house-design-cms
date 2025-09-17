import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { Observable } from 'rxjs';
import { DataService } from '../../services/data.service';
import { UploadService } from '../../services/upload.service';
import { AuthService } from '../../services/auth.service';
import { Category, Post } from '../../models/models';
import { CKEditorUploadAdapterPlugin } from '../../utils/ckeditor-upload-adapter';

@Component({
  selector: 'app-post-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
    CKEditorModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.post ? 'Sửa Bài Viết' : 'Thêm Bài Viết' }}</h2>

    <mat-dialog-content>
      <form [formGroup]="postForm" class="post-form">
        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Tiêu đề</mat-label>
          <input matInput formControlName="title" placeholder="Nhập tiêu đề bài viết">
          <mat-error *ngIf="postForm.get('title')?.hasError('required')">
            Tiêu đề là bắt buộc
          </mat-error>
        </mat-form-field>


        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Danh mục</mat-label>
          <mat-select formControlName="category_id">
            <mat-option *ngFor="let category of categories$ | async" [value]="category.id">
              {{ category.name }}
            </mat-option>
          </mat-select>
          <mat-error *ngIf="postForm.get('category_id')?.hasError('required')">
            Danh mục là bắt buộc
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Tóm tắt</mat-label>
          <textarea matInput formControlName="summary" rows="3" placeholder="Nhập tóm tắt bài viết"></textarea>
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>URL hình ảnh</mat-label>
          <input matInput formControlName="image_url" placeholder="Nhập URL hình ảnh">
        </mat-form-field>

        <div class="editor-field">
          <label class="editor-label">Nội dung</label>
          <ckeditor
            [editor]="Editor"
            [config]="editorConfig"
            formControlName="content"
            class="ck-editor">
          </ckeditor>
          <mat-error *ngIf="postForm.get('content')?.hasError('required') && postForm.get('content')?.touched">
            Nội dung là bắt buộc
          </mat-error>
        </div>

        <mat-checkbox formControlName="published" class="published-checkbox">
          Xuất bản ngay
        </mat-checkbox>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Hủy</button>
      <button mat-raised-button
              color="primary"
              (click)="onSave()"
              [disabled]="postForm.invalid || isLoading">
        {{ isLoading ? 'Đang lưu...' : (data.post ? 'Cập nhật' : 'Thêm mới') }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .post-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 600px;
      max-width: 800px;
      padding: 16px 0;
    }

    .full-width {
      width: 100%;
    }

    .editor-field {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .editor-label {
      font-size: 14px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.6);
    }

    .ck-editor {
      min-height: 200px;
    }

    .ck-editor .ck-content {
      min-height: 200px;
    }

    .published-checkbox {
      margin-top: 8px;
    }

    mat-dialog-content {
      padding: 20px 24px;
      max-height: 80vh;
      overflow-y: auto;
    }

    mat-dialog-actions {
      padding: 16px 24px;
    }

    mat-error {
      font-size: 12px;
      margin-top: 4px;
    }
  `]
})
export class PostDialogComponent implements OnInit {
  postForm: FormGroup;
  isLoading = false;
  categories$: Observable<Category[]>;

  public Editor = ClassicEditor;
  public editorConfig: any;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<PostDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { post?: Post },
    private dataService: DataService,
    private uploadService: UploadService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.postForm = this.fb.group({
      title: ['', [Validators.required]],
      category_id: ['', [Validators.required]],
      summary: [''],
      image_url: [''],
      content: ['', [Validators.required]],
      published: [false]
    });

    this.categories$ = this.dataService.getCategories();
  }

  ngOnInit(): void {
    // Configure CKEditor with upload adapter - do this here to ensure token is available
    const token = this.authService.getToken();
    console.log('Setting up CKEditor, token available:', !!token);

    this.editorConfig = {
      toolbar: {
        items: [
          'heading',
          '|',
          'bold',
          'italic',
          'link',
          'bulletedList',
          'numberedList',
          '|',
          'outdent',
          'indent',
          '|',
          'imageUpload',
          'blockQuote',
          'insertTable',
          'mediaEmbed',
          '|',
          'undo',
          'redo'
        ]
      },
      language: 'en', // Change to English for better debugging
      image: {
        toolbar: [
          'imageTextAlternative',
          'imageStyle:full',
          'imageStyle:side'
        ]
      },
      table: {
        contentToolbar: [
          'tableColumn',
          'tableRow',
          'mergeTableCells'
        ]
      },
      extraPlugins: [CKEditorUploadAdapterPlugin(this.uploadService)],
      // Add simple upload URL as fallback
      simpleUpload: {
        uploadUrl: 'http://localhost:8080/api/upload',
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${token || ''}`
        }
      }
    };

    if (this.data.post) {
      const post = this.data.post;
      this.postForm.patchValue({
        title: post.title,
        category_id: post.category_id,
        summary: post.summary,
        image_url: post.image_url,
        content: post.content,
        published: post.published
      });
    }
  }


  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.postForm.valid) {
      this.isLoading = true;
      const postData = { ...this.postForm.value };

      const operation = this.data.post
        ? this.dataService.updatePost(this.data.post.id, postData)
        : this.dataService.createPost(postData);

      operation.subscribe({
        next: (result) => {
          this.isLoading = false;
          this.snackBar.open(
            this.data.post ? 'Cập nhật bài viết thành công!' : 'Thêm bài viết thành công!',
            'Đóng',
            { duration: 3000 }
          );
          this.dialogRef.close(result);
        },
        error: (error) => {
          this.isLoading = false;
          this.snackBar.open('Có lỗi xảy ra!', 'Đóng', { duration: 3000 });
          console.error('Error saving post:', error);
        }
      });
    }
  }
}