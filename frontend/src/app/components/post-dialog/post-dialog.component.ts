import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { Observable } from 'rxjs';
import { DataService } from '../../services/data.service';
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
    MatIconModule,
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

        <div class="image-upload-field">
          <label class="upload-label">Hình ảnh thumbnail</label>
          <div class="upload-container">
            <input
              type="file"
              #fileInput
              accept="image/*"
              (change)="onImageSelect($event)"
              style="display: none">

            <div class="upload-area"
                 (click)="fileInput.click()"
                 [class.has-image]="selectedImageUrl">

              <div class="upload-content" *ngIf="!selectedImageUrl && !isUploadingImage">
                <mat-icon class="upload-icon">cloud_upload</mat-icon>
                <p>Nhấn để chọn hình ảnh</p>
                <span class="upload-hint">PNG, JPG, GIF tối đa 5MB</span>
              </div>

              <div class="upload-loading" *ngIf="isUploadingImage">
                <div class="loading-spinner"></div>
                <p>Đang tải lên...</p>
              </div>

              <div class="image-preview" *ngIf="selectedImageUrl && !isUploadingImage">
                <img [src]="selectedImageUrl" [alt]="postForm.get('title')?.value || 'Preview'">
                <div class="image-overlay">
                  <button mat-icon-button type="button" (click)="removeImage($event)">
                    <mat-icon>delete</mat-icon>
                  </button>
                  <button mat-icon-button type="button" (click)="$event.stopPropagation(); fileInput.click()">
                    <mat-icon>edit</mat-icon>
                  </button>
                </div>
              </div>
            </div>

            <mat-error *ngIf="imageUploadError">
              {{ imageUploadError }}
            </mat-error>
          </div>
        </div>

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

        <!-- SEO Settings Section -->
        <div class="seo-section">
          <h4>SEO Settings</h4>

          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Meta Title</mat-label>
            <input matInput formControlName="meta_title"
                   placeholder="SEO title for this post (leave blank to use post title)">
            <mat-hint>{{ getMetaTitleLength() }}/60 characters (optimal: 30-60)</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Meta Description</mat-label>
            <textarea matInput formControlName="meta_description" rows="2"
                     placeholder="SEO description for this post"></textarea>
            <mat-hint>{{ getMetaDescriptionLength() }}/160 characters (optimal: 120-160)</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Focus Keywords</mat-label>
            <input matInput formControlName="focus_keywords"
                   placeholder="Primary keywords for this post (comma-separated)">
            <mat-hint>Example: thiết kế biệt thự, kiến trúc hiện đại</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="fill" class="full-width">
            <mat-label>URL Slug</mat-label>
            <input matInput formControlName="slug"
                   placeholder="SEO-friendly URL slug">
            <button mat-icon-button matSuffix type="button" (click)="generateSlug()"
                    matTooltip="Generate slug from title">
              <mat-icon>refresh</mat-icon>
            </button>
          </mat-form-field>

          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Open Graph Image URL</mat-label>
            <input matInput formControlName="og_image_url"
                   placeholder="Image URL for social media sharing">
            <mat-hint>Recommended size: 1200x630px (leave blank to use post image)</mat-hint>
          </mat-form-field>
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

    /* Image Upload Styles */
    .image-upload-field {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }

    .upload-label {
      font-size: 14px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.6);
    }

    .upload-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .upload-area {
      border: 2px dashed #ccc;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      min-height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      background: #fafafa;
    }

    .upload-area:hover {
      border-color: #1976d2;
      background: #f0f8ff;
    }

    .upload-area.has-image {
      padding: 0;
      border: 1px solid #ddd;
      min-height: 200px;
    }

    .upload-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      color: #666;
    }

    .upload-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #1976d2;
    }

    .upload-hint {
      font-size: 12px;
      color: #999;
    }

    .upload-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      color: #666;
    }

    .loading-spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #1976d2;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .image-preview {
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 200px;
    }

    .image-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 6px;
    }

    .image-overlay {
      position: absolute;
      top: 8px;
      right: 8px;
      display: flex;
      gap: 4px;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .image-preview:hover .image-overlay {
      opacity: 1;
    }

    .image-overlay button {
      background: rgba(0, 0, 0, 0.7);
      color: white;
      border: none;
      width: 36px;
      height: 36px;
    }

    .image-overlay button:hover {
      background: rgba(0, 0, 0, 0.9);
    }

    .seo-section {
      margin-top: 24px;
      padding: 16px;
      background-color: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #4caf50;
    }

    .seo-section h4 {
      margin: 0 0 16px 0;
      color: #2e7d32;
      font-size: 16px;
      font-weight: 500;
    }
  `]
})
export class PostDialogComponent implements OnInit {
  postForm: FormGroup;
  isLoading = false;
  categories$: Observable<Category[]>;

  // Image upload properties
  selectedImageUrl: string | null = null;
  isUploadingImage = false;
  imageUploadError: string | null = null;

  public Editor: any = ClassicEditor;
  public editorConfig: any;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<PostDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { post?: Post },
    private dataService: DataService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.postForm = this.fb.group({
      title: ['', [Validators.required]],
      category_id: ['', [Validators.required]],
      summary: [''],
      image_url: [''],
      content: ['', [Validators.required]],
      published: [false],
      // SEO Fields
      meta_title: [''],
      meta_description: [''],
      focus_keywords: [''],
      slug: [''],
      og_image_url: ['']
    });

    this.categories$ = this.dataService.getCategories();
  }

  ngOnInit(): void {
    // Configure CKEditor with upload adapter - do this here to ensure token is available
    const token = this.authService.getToken();

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
      extraPlugins: [CKEditorUploadAdapterPlugin(this.dataService)],
      // Add simple upload URL as fallback
      simpleUpload: {
        uploadUrl: '/api/upload',
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
        content: this.convertContentImageUrls(post.content),
        published: post.published,
        // SEO Fields
        meta_title: post.meta_title || '',
        meta_description: post.meta_description || '',
        focus_keywords: post.focus_keywords || '',
        slug: post.slug || '',
        og_image_url: post.og_image_url || ''
      });
      
      
      // Set the selected image URL for preview with URL conversion
      this.selectedImageUrl = post.image_url ? this.convertImageUrl(post.image_url) : null;
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
        }
      });
    }
  }

  onImageSelect(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      this.imageUploadError = 'Kích thước tệp không được vượt quá 5MB';
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.imageUploadError = 'Chỉ chấp nhận tệp hình ảnh';
      return;
    }

    this.imageUploadError = null;
    this.isUploadingImage = true;

    this.dataService.uploadImage(file).subscribe({
      next: (response) => {
        this.isUploadingImage = false;
        this.selectedImageUrl = response.url;
        this.postForm.patchValue({ image_url: response.url });
        this.snackBar.open('Tải lên hình ảnh thành công!', 'Đóng', { duration: 3000 });
      },
      error: (error) => {
        this.isUploadingImage = false;
        this.imageUploadError = 'Lỗi khi tải lên hình ảnh. Vui lòng thử lại.';
        this.snackBar.open('Lỗi khi tải lên hình ảnh!', 'Đóng', { duration: 3000 });
      }
    });
  }

  removeImage(event: Event): void {
    event.stopPropagation();
    this.selectedImageUrl = null;
    this.postForm.patchValue({ image_url: '' });
    this.imageUploadError = null;
  }

  // Convert absolute backend URLs to relative URLs for proxy support
  private convertImageUrl = (url: string): string => {
    if (!url) return url;


    // Handle localhost URLs
    if (url.startsWith('http://localhost:8080/')) {
      const converted = url.replace('http://localhost:8080/', '/');
      return converted;
    }

    // Handle HTTPS backend URLs
    if (url.startsWith('https://') && url.includes(':8080/')) {
      const converted = url.replace(/https:\/\/[^\/]+:8080\//, '/');
      return converted;
    }

    // Handle HTTP backend URLs with any domain
    if (url.startsWith('http://') && url.includes(':8080/')) {
      const converted = url.replace(/http:\/\/[^\/]+:8080\//, '/');
      return converted;
    }

    // Handle URLs that are already absolute paths starting with /
    if (url.startsWith('/data/') || url.startsWith('/uploads/') || url.startsWith('/api/')) {
      return url;
    }

    // VPS fallback: If URL contains backend domain patterns, convert to relative
    if (url.includes('/data/uploads/') || url.includes('/api/')) {
      // Extract just the path part after domain
      const match = url.match(/https?:\/\/[^\/]+(.*)$/);
      if (match) {
        const converted = match[1];
        return converted;
      }
    }

    return url;
  }

  // Convert image URLs within HTML content for CKEditor
  private convertContentImageUrls = (htmlContent: string): string => {
    if (!htmlContent) return htmlContent;


    // Replace img src attributes with absolute URLs
    const convertedContent = htmlContent.replace(
      /(<img[^>]+src=["'])([^"']+)(["'][^>]*>)/gi,
      (match, prefix, url, suffix) => {
        const convertedUrl = this.convertImageUrl(url);
        return prefix + convertedUrl + suffix;
      }
    );

    return convertedContent;
  }

  // SEO Helper Methods
  getMetaTitleLength(): number {
    const metaTitle = this.postForm.get('meta_title')?.value || '';
    const title = this.postForm.get('title')?.value || '';
    return (metaTitle || title).length;
  }

  getMetaDescriptionLength(): number {
    const metaDescription = this.postForm.get('meta_description')?.value || '';
    return metaDescription.length;
  }

  generateSlug(): void {
    const title = this.postForm.get('title')?.value;
    if (title) {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      this.postForm.patchValue({ slug });
    }
  }
}